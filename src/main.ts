import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './common/filters/validationError';
import { HttpExceptionFilter } from './common/filters/ExceptionFilter';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';
import { MongoDuplicateKeyExceptionFilter } from './common/filters/duplicateFilter';
import { AllExceptionsFilter } from './common/filters/allValidationException';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configure global validation (for DTOs, for example)
  // app.useGlobalPipes(new ValidationPipe());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform plain objects into DTOs
      whitelist: true, // Remove properties not in the DTO
      forbidNonWhitelisted: true, // Throws error if unknown properties are passed
    }),
  );
  // Apply global exception filter
  // app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalFilters(new MongoDuplicateKeyExceptionFilter());
  app.useGlobalFilters(new ValidationExceptionFilter());
  // app.useGlobalFilters(new HttpExceptionFilter());
  // app.useGlobalGuards(new JwtAuthGuard());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
