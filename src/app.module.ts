import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, } from '@nestjs/core';
import { ValidationExceptionFilter } from './common/filters/validationError';
import { AuthModule } from './auth/auth.module';
import { EmailserviceModule } from './emailservice/emailservice.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeederService } from './seed/seedService';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';
import { envSchema } from './utils/env.validation';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerConfig } from './common/configs/winston.config';
import * as mongoose from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    WinstonModule.forRoot(winstonLoggerConfig),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("DB_URL"),
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),  // Serve from the 'public' directory
    }),
    EmailserviceModule,
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
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger('Mongoose');

  onModuleInit() {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      this.logger.log(`${collectionName}.${method}(${JSON.stringify(query)}) ${doc ? JSON.stringify(doc) : ''}`);
    });
  }
}
