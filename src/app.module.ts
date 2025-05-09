import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, } from '@nestjs/core';
import { ValidationExceptionFilter } from './common/filters/validationError';
import { AuthModule } from './auth/auth.module';
import { EmailserviceModule } from './emailservice/emailservice.module';
import { ProfileModule } from './profile/profile.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeederService } from './seed/seedService';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';

if(process.env.DB_URL){
  console.log("No Database Url Injected yet")
}
const config = new ConfigService()
@Module({
  imports:  [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forRoot(config.get("DB_URL")),
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),  // Serve from the 'public' directory
    }),
    EmailserviceModule,
    ProfileModule,
  SeedModule,
  SettingsModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    AppService,
    SeederService
  ],
})
export class AppModule {}
