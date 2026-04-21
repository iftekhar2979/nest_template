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
import { CategoriesModule } from './categories/categories.module';
import { LearningTopicsModule } from './learning_topics/learning_topics.module';
import { LearningMaterialsModule } from './learning_materials/learning_materials.module';
import { UserLearningsModule } from './user_learnings/user_learnings.module';
import { QuizTemplatesModule } from './quiz_templates/quiz_templates.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { QuestionsModule } from './questions/questions.module';
import { OptionsService } from './options/options.service';
import { OptionsModule } from './options/options.module';
import { QuizQuestionsModule } from './quiz_questions/quiz_questions.module';
import { QuizAttemptsModule } from './quiz_attempts/quiz_attempts.module';
import { BadgesController } from './badges/badges.controller';
import { BadgesModule } from './badges/badges.module';
import { SubscriptionPlansModule } from './subscription_plans/subscription_plans.module';
import { UserAnswersModule } from './user_answers/user_answers.module';
import { UserSubscriptionsController } from './user_subscriptions/user_subscriptions.controller';
import { UserSubscriptionsModule } from './user_subscriptions/user_subscriptions.module';
import { EmailVerificationTokensModule } from './email_verification_tokens/email_verification_tokens.module';
import { RefreshTokensModule } from './refresh_tokens/refresh_tokens.module';
import { UserBadgesService } from './user_badges/user_badges.service';
import { UserBadgesModule } from './user_badges/user_badges.module';
import * as mongoose from 'mongoose';
import { BullModule } from '@nestjs/bullmq';

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
    SettingsModule,
    CategoriesModule,
    LearningTopicsModule,
    LearningMaterialsModule,
    UserLearningsModule,
    QuizTemplatesModule,
    QuizzesModule,
    QuestionsModule,
    OptionsModule,
    QuizQuestionsModule,
    QuizAttemptsModule,
    BadgesModule,
    SubscriptionPlansModule,
    UserAnswersModule,
    UserSubscriptionsModule,
    EmailVerificationTokensModule,
    RefreshTokensModule,
    UserBadgesModule,
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
  controllers: [AppController, BadgesController, UserSubscriptionsController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    AppService,
    SeederService,
    OptionsService,
    UserBadgesService
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
