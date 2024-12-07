// import { EmailService } from './../common/mailer/sendMail';
import { JwtService } from '@nestjs/jwt';
import { authDto } from './dto/auth.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { comparePassword } from 'src/common/bycrypt/bycrypt';
import { User } from 'src/users/users.schema';
import { profile, error } from 'console';
import { IUser } from 'src/users/users.interface';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { generateOtp } from 'src/common/utils/generateOtp';
import { Otp } from './otp.schema';
import { EmailService } from 'src/emailservice/emailservice.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { otp } from './interface/otp.inteface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(User.name) private userModel: Model<User>, // Injecting the User model
    private jwtService: JwtService, // Injecting the JwtService for token generation
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    const newUser = new this.userModel(createUserDto);
    let otp = generateOtp();
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 3);
    const saveOtp = new this.otpModel({
      oneTimePassword: otp,
      userID: newUser._id,
      expiredAt: currentDate,
    });
    await this.emailService.sendOtpEmail(newUser.email, otp, newUser.name);
    const savedUser = await newUser.save();
    savedUser.password = undefined;
    // Sign the JWT and return it
    const payload = {
      email: newUser.email,
      id: newUser._id,
      role: newUser.role,
      profileID: newUser.profileID,
      name: newUser.name,
    }; // The payload typically contains the user's data
    const token = this.jwtService.sign(payload); // Sign the JWT
    // user.password = undefined;
    await saveOtp.save();
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
    }; // The payload typically contains the user's data
    const token = this.jwtService.sign(payload); // Sign the JWT
    user.password = undefined;
    return { message: 'Logged In Successfully', data: user, token };
  }
  async verifyOtp(user, code) {
    let otpValue  = await this.otpModel.findOne({ userID: user.id });
    if (otpValue.attempts > 2) {
      throw new BadRequestException("You're Otp has been expired !");
    }
    if (otpValue.oneTimePassword!==code) {
      otpValue.attempts++;
      await otpValue.save();
      throw new NotFoundException('OTP not found!');
    }
  
    await this.userModel.findByIdAndUpdate(user.id, { isEmailVerified: true });
    await this.otpModel.deleteOne({ userID: user.id, code: code });
    return { message: 'OTP Verified Successfully', data: {} };
  }
  async resendOtp(user) {
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
    // Set expiration time for the OTP (3 minutes from now)
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 3);

    // Create a new OTP document
    const saveOtp = new this.otpModel({
      oneTimePassword: otp,
      userID: user._id,
      expiredAt: currentDate,
    });

    // Send OTP to the user's email
    await this.emailService.sendOtpEmail(user.email, otp, user.name);

    // Save the new OTP in the database
    await saveOtp.save();

    return { message: 'OTP sent successfully', data: {} };
  }
}
