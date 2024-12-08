import { IProfile } from './../profile/interface/profile.interface';
import { resetPasswordDto, forgetPasswordDto } from './dto/auth.dto';
// import { EmailService } from './../common/mailer/sendMail';
import { JwtService } from '@nestjs/jwt';
import { authDto } from './dto/auth.dto';
import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { comparePassword, hashPassword } from 'src/common/bycrypt/bycrypt';
import { User } from 'src/users/users.schema';
import { profile, error } from 'console';
import { IUser } from 'src/users/users.interface';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { generateOtp } from 'src/common/utils/generateOtp';
import { Otp } from './otp.schema';
import { EmailService } from 'src/emailservice/emailservice.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { otp } from './interface/otp.inteface';
import { Profile } from 'src/profile/profile.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(User.name) private userModel: Model<User>, // Injecting the User model
    @InjectModel(Profile.name) private profileModel: Model<IProfile>,
    private jwtService: JwtService, // Injecting the JwtService for token generation
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Create the user
    const newUser = new this.userModel(createUserDto);
    
    // Generate OTP
    let otp = generateOtp();
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 3);  // OTP expiration time (3 minutes from now)
  
    // Create OTP document
    const saveOtp = new this.otpModel({
      oneTimePassword: otp,
      userID: newUser._id,
      expiredAt: currentDate,
    });
  
    // Send OTP email
    await this.emailService.sendOtpEmail(newUser.email, otp, newUser.name);
  
    // Create the profile information
    const profileInfo = new this.profileModel({
      gender: createUserDto.gender,
      userID: newUser._id,
      height: createUserDto.height,
      dOB: createUserDto.dOB,  // Corrected from createUserDto.height
    });
  
    // Save the profile first to get the profile ID (_id)
    const savedProfile = await profileInfo.save();
  
    // Now that the profile is saved, assign the profile ID to the user
    newUser.profileID = savedProfile._id as ObjectId;  // Cast _id to ObjectId if necessary
  
    // Prepare JWT payload
    const payload = {
      email: newUser.email,
      id: newUser._id,
      role: newUser.role,
      profileID: savedProfile._id,  // Ensure to use the saved profile ID
      name: newUser.name,
    };
  
    // Sign the JWT token
    const token = this.jwtService.sign(payload);
  
    // Save the user, OTP, and profile information
    const savedUser = await newUser.save();
    await saveOtp.save();
  
    // Remove password before sending user data in the response
    savedUser.password = undefined;
  
    // Return the saved user and JWT token
    return { data: savedUser, token };
  }
  
  
  async find(authDto) {
    let user = await this.userModel.findOne({ email: authDto.email });
    if (!user) {
      throw new BadRequestException('User not Found!');
    }
    let isMatch = await comparePassword(authDto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid Credential!');
    }
    // Sign the JWT and return it
    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
      profileID: user.profileID,
      name: user.name,
    };
    const token = this.jwtService.sign(payload); // Sign the JWT
    user.password = undefined;
    return { message: 'Logged In Successfully', data: user, token };
  }
  async verifyOtp(user: Omit<IUser, 'password'>, code: string) {
    let otpValue = await this.otpModel.findOne({ userID: user.id });
    if (otpValue.attempts > 2) {
      throw new BadRequestException("You're Otp has been expired !");
    }
    if (otpValue.oneTimePassword !== code) {
      otpValue.attempts++;
      await otpValue.save();
      throw new NotFoundException('OTP not found!');
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(user.id, {
      isEmailVerified: true,
    });
    await this.otpModel.deleteOne({ userID: user.id, code: code });
    let payload = {};
    if (updatedUser.isEmailVerified) {
      payload = {
        id: user.id,
        role: user.role,
        tokenFor: 'email-verification',
      };
    }
    payload = {
      id: user.id,
      role: user.role,
      tokenFor: 'forget-password',
    };
    const token = this.jwtService.sign(payload);
    return { message: 'OTP Verified Successfully', data: {}, token };
  }
  async resendOtp(user: Omit<IUser, 'password'>) {
    // Retrieve the last OTP entry for the user
    let otpData: otp = await this.otpModel.findOne({ userID: user.id });
    // If OTP data exists, check the time difference
    if (otpData && otpData.updatedAt) {
      const timeDifference = Date.now() - otpData.updatedAt.getTime();
      // Check if the last OTP was sent less than 30 seconds ago
      if (timeDifference < 30000) {
        throw new BadRequestException(
          'You can resend the OTP only after 30 seconds.',
        );
      }
    }
    await this.otpModel.deleteOne({ userID: user.id });
    // Generate a new OTP
    let otp = generateOtp();
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 3);
    // Create a new OTP document
    const saveOtp = new this.otpModel({
      oneTimePassword: otp,
      userID: user.id,
      expiredAt: currentDate,
    });
    // Send OTP to the user's email
    await this.emailService.sendOtpEmail(user.email, otp, user.name);
    // Save the new OTP in the database
    await saveOtp.save();

    return { message: 'OTP sent successfully', data: {} };
  }
  async resetPassword(user: Partial<IUser>, resetPasswordDto) {
    let id = user.id;
    let userInfo = await this.userModel.findById(id).select('password');
    if (!userInfo) {
      throw new NotFoundException('User not Found!');
    }
    let isMatch = await comparePassword(
      resetPasswordDto.oldPassword,
      userInfo.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Password Not Matched!');
    }
    userInfo.password = resetPasswordDto.newPassword;
    await userInfo.save();
    return { message: 'Password Updated Successfully', data: {} };
  }
  async forgetPassword(payload, forgetPasswordDto) {
    if (payload.tokenFor === 'email-verification') {
      throw new BadGatewayException('Verification was for email verification!');
    }
    if (forgetPasswordDto.password !== forgetPasswordDto.confirmPassword) {
      throw new BadRequestException(
        'Password and Confirm Password not matched!!',
      );
    }
    let user = await this.userModel.findOne({ _id: payload.id });
    // const hashedPassword = await hashPassword(forgetPasswordDto.password)
    user.password = forgetPasswordDto.password;
    await user.save();
    return { message: 'Password Updated Successfully', data: {} };
  }
}
