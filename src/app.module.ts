import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ValidationExceptionFilter } from './common/filters/validationError';
import { AuthModule } from './auth/auth.module';
import { EmailserviceModule } from './emailservice/emailservice.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';
import { envSchema } from './utils/env.validation';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerConfig } from './common/configs/winston.config';
import { EmailVerificationTokensModule } from './email_verification_tokens/email_verification_tokens.module';
import { RefreshTokensModule } from './refresh_tokens/refresh_tokens.module';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { ShiftsModule } from './shifts/shifts.module';
import { HolidaysModule } from './holidays/holidays.module';
import { AttendanceModule } from './attendance/attendance.module';
import { EmployeesModule } from './employees/employees.module';
import { CompanyModule } from './company/company.module';
import { BranchModule } from './branch/branch.module';
import { LeaveModule } from './leave/leave.module';
import { WorkweeksModule } from './workweeks/workweeks.module';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envSchema,
    }),
    WinstonModule.forRoot(winstonLoggerConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL') * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT'),
        },
      ],
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Serve from the 'public' directory
    }),
    EmailserviceModule,
    SeedModule,
    SettingsModule,

    EmailVerificationTokensModule,
    RefreshTokensModule,
    DepartmentsModule,
    DesignationsModule,
    ShiftsModule,
    HolidaysModule,
    AttendanceModule,
    EmployeesModule,
    CompanyModule,
    BranchModule,
    LeaveModule,
    WorkweeksModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
