import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/users.schema';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { ValidationExceptionFilter } from './common/filters/validationError';
import { AuthModule } from './auth/auth.module';
import { EmailserviceModule } from './emailservice/emailservice.module';
import { ProfileModule } from './profile/profile.module';
// import { LifestyleController } from './lifestyle/lifestyle.controller';
// import { LifestyleService } from './lifestyle/lifestyle.service';
import { LifestyleModule } from './lifestyle/lifestyle.module';
import { JwtModule } from '@nestjs/jwt';
import { GalleryModule } from './gallery/gallery.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports:  [
    // Connect to MongoDB
    MongooseModule.forRoot('mongodb://localhost:27017/vibely-db'),
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),  // Serve from the 'public' directory
    }),
    EmailserviceModule,
    ProfileModule,
    LifestyleModule,
    GalleryModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    AppService,
  // Add AppService to the providers array
  ],
})
export class AppModule {}
