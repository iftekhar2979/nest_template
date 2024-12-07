// import { EmailService } from './../common/mailer/sendMail';
import { JwtService } from '@nestjs/jwt';
import { authDto } from './dto/auth.dto';
import { BadRequestException, HttpStatus, Injectable, Request, UseGuards } from '@nestjs/common';
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
 
}
