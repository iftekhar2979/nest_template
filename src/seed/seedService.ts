// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from 'src/settings/settings.schema';
import { SettingsService } from 'src/settings/settings.service';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { IUser } from 'src/users/users.interface';
import { UserService } from 'src/users/users.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    private readonly settingService: SettingsService,
    private readonly configService: ConfigService
    // @InjectModel(Settings.name) private settingModel: Model<Settings>,
  ) {}

  async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL'); 
    const existingAdmin = await this.userService.findByEmail(adminEmail);

    if (!existingAdmin) {
      const adminDto : {
        email:string,
        password:string,
        role:string,
        name:string,
        profilePicture:string,
        phone:string,
        isEmailVerified:boolean
      } = {
        email: adminEmail,
        password: this.configService.get<string>('ADMIN_PASSWORD'), // Set your preferred password or generate one
        role: this.configService.get<string>('ADMIN_ROLE'), // Adjust if you have roles set up
        name: this.configService.get<string>('ADMIN_NAME'),
        profilePicture: this.configService.get<string>('ADMIN_PROFILE_PICTURE'),
        phone: this.configService.get<string>('ADMIN_PHONE'),
        isEmailVerified: true,
      };

      await this.userService.create(adminDto);

      // await this.userService.create(adminDto);
      console.log('Admin created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
  }
  async seedData() {
    const seedData = [
      {
        key: 'privacy_policy',
        content: `
          **Privacy Policy**
          Effective Date: 12-28-2024
          Vibley ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application or website. Please read this policy carefully to understand our views and practices regarding your personal data.
          ...
        `,
      },
      {
        key: 'about_us',
        content: `
          **About Us**
          Welcome to JOtter!
          At [Your Company Name], we are dedicated to [briefly describe your mission or purpose]. Our goal is to [state your company's primary objective or vision].
          ...
        `,
      },
      {
        key: 'terms_and_condition',
        content: `
          **Terms and Conditions**
          Effective Date: 12-28-2024
          Welcome to Vibley! By using our services, you agree to comply with and be bound by the following terms and conditions.
          ...
        `,
      },
    ];
    
    await this.settingService.seed(seedData);
  }
}
