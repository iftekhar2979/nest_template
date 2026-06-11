// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from 'src/settings/settings.service';
import { UserService } from 'src/users/users.service';
import { RoleRepository } from '../auth/repositories/role.repository';
import { RoleType, UserStatus } from '../users/schema/users.schema';

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    private readonly settingService: SettingsService,
    private readonly configService: ConfigService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async seedAuthData() {
    await this.seedRoles();
    await this.seedAdminUser();
  }

  async seedRoles() {
    const roleSeeds: Array<{ id: RoleType; permissions: string[]; description: string }> = [
      {
        id: RoleType.SUPERADMIN,
        permissions: ['*'],
        description: 'Unrestricted platform owner access',
      },
      {
        id: RoleType.ADMIN,
        permissions: [
          'read:*',
          'write:*',
          'manage:users',
          'manage:departments',
          'manage:designations',
          'manage:shifts',
          'manage:attendance',
          'manage:holidays',
        ],
        description: 'Administrative access across operational modules',
      },
      {
        id: RoleType.HTO,
        permissions: ['read:*', 'manage:departments', 'manage:projects'],
        description: 'Head of team operations access',
      },
      {
        id: RoleType.SALES_LEADER,
        permissions: ['read:sales', 'write:sales', 'manage:sales_team'],
        description: 'Sales department leadership access',
      },
      {
        id: RoleType.SALES_TEAM_LEADER,
        permissions: ['read:sales', 'write:sales', 'manage:sales_members'],
        description: 'Sales team leadership access',
      },
      {
        id: RoleType.SALES_MEMBER,
        permissions: ['read:sales', 'write:sales'],
        description: 'Sales member access',
      },
      {
        id: RoleType.OPERATION_LEADER,
        permissions: ['read:operations', 'write:operations', 'manage:operation_team'],
        description: 'Operations leadership access',
      },
      {
        id: RoleType.OPERATION_MEMBER,
        permissions: ['read:operations', 'write:operations'],
        description: 'Operations member access',
      },
      {
        id: RoleType.EMPLOYEE,
        permissions: [
          'read:own_profile',
          'write:own_profile',
          'read:own_attendance',
          'write:own_attendance',
          'write:own_requests',
          'read:own_requests',
        ],
        description: 'Employee self-service attendance access',
      },
      {
        id: RoleType.CLIENT,
        permissions: ['read:own_profile', 'read:own_projects', 'write:own_messages'],
        description: 'Client account access',
      },
    ];

    for (const role of roleSeeds) {
      await this.roleRepository.upsert(role.id, role.permissions, role.description);
    }
  }

  async seedAdminUser() {
    const adminEmail = (
      this.configService.get<string>('SUPER_ADMIN_EMAIL') ||
      this.configService.get<string>('ADMIN_EMAIL')
    )?.toLowerCase().trim();
    const existingAdmin = await this.userService.findByEmailIncludingInactive(adminEmail);

    if (!existingAdmin) {
      const adminDto : {
        email:string,
        passwordHash:string,
        role:RoleType,
        fullName:string,
        avatarUrl:string,
        phoneNumber:string,
        isEmailVerified:boolean
        isTcPpAccepted:boolean
        status: UserStatus
      } = {
        email: adminEmail,
        passwordHash: this.configService.get<string>('SUPER_ADMIN_PASSWORD') || this.configService.get<string>('ADMIN_PASSWORD'),
        role: RoleType.SUPERADMIN,
        fullName: this.configService.get<string>('SUPER_ADMIN_NAME') || this.configService.get<string>('ADMIN_NAME'),
        avatarUrl: this.configService.get<string>('ADMIN_PROFILE_PICTURE'),
        phoneNumber: this.configService.get<string>('SUPER_ADMIN_PHONE') || this.configService.get<string>('ADMIN_PHONE'),
        isEmailVerified: true,
        isTcPpAccepted: true,
        status: UserStatus.ACTIVE,
      };

      await this.userService.createUser(adminDto);

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
