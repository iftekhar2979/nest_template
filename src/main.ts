import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ValidationExceptionFilter } from './common/filters/validationError';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';
// import { MongoDuplicateKeyExceptionFilter } from './common/filters/duplicateFilter';
import { UnauthorizedExceptionFilter } from './common/filters/unAuthorizedExectionError';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SeederService } from './seed/seedService';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { json, urlencoded } from "express";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ConnectivityValidator } from './common/utils/connectivity.validator';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const seederService = app.get(SeederService);
  app.setGlobalPrefix("/api");

  app.enableVersioning({
    defaultVersion: "1",
    type: VersioningType.URI,
  });
  app.useStaticAssets(join(__dirname, "..", "..", "public"));
  app.enableCors({
    origin: "*",
    // credentials: true,
  });
  // app.use(
  //   // helmet({
  //   //   hsts: {
  //   //     includeSubDomains: true,
  //   //     preload: true,
  //   //     maxAge: 63072000, // 2 years in seconds
  //   //   },
  //   //   contentSecurityPolicy: {
  //   //     useDefaults: true,
  //   //     directives: {
  //   //       defaultSrc: ["'self'", "https://polyfill.io", "https://*.cloudflare.com", "http://127.0.0.1:3000/"],
  //   //       baseUri: ["'self'"],
  //   //       scriptSrc: [
  //   //         "'self'",
  //   //         "http://127.0.0.1:3000/",
  //   //         "https://*.cloudflare.com",
  //   //         "https://polyfill.io",
  //   //         `https: 'unsafe-inline'`, // FIXME: use script-src CSP NONCES
  //   //         /* 
  //   //           CSP NONCES https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline
  //   //          */
  //   //       ],
  //   //       styleSrc: ["'self'", "https:", "http:", "'unsafe-inline'"],
  //   //       imgSrc: ["'self'", "blob:", "validator.swagger.io", "*"],
  //   //       fontSrc: ["'self'", "https:", "data:"],
  //   //       childSrc: ["'self'", "blob:"],
  //   //       styleSrcAttr: ["'self'", "'unsafe-inline'", "http:"],
  //   //       frameSrc: ["'self'"],
  //   //     },
  //   //   },
  //   //   // you don't control the link on the pages, or know that you don't want to leak information to other domains
  //   //   dnsPrefetchControl: { allow: false }, // Changed based on the last middleware to disable DNS prefetching
  //   //   frameguard: { action: "deny" }, // Disable clickjacking
  //   //   hidePoweredBy: true, // Hides the X-Powered-By header to make the server less identifiable.
  //   //   ieNoOpen: true, // Prevents Internet Explorer from executing downloads in the site’s context.
  //   //   noSniff: true, // Prevents browsers from MIME type sniffing, reducing exposure to certain attacks.
  //   //   permittedCrossDomainPolicies: { permittedPolicies: "none" }, // Prevents Adobe Flash and Acrobat from loading cross-domain data.
  //   //   referrerPolicy: { policy: "no-referrer" }, // Protects against referrer leakage.
  //   //   xssFilter: true, // Enables the basic XSS protection in older browsers.

  //   //   // Configures Cross-Origin settings to strengthen resource isolation and mitigate certain side-channel attacks.  crossOriginEmbedderPolicy: true,
  //   //   crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  //   //   crossOriginResourcePolicy: { policy: "same-site" },
  //   //   originAgentCluster: true,
  //   // })
  // );
  // app.use(cookieParser());
  // app.use(compression());
  // await seederService.seedData();
  // await seederService.seedAdminUser();
  app.setBaseViewsDir(join(__dirname, "..", "..", "src", "views"));
  app.setViewEngine("ejs");
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/v1/stripe/webhook") {
      return next();
    }
    json({ limit: "500kb" })(req, res, next);
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/v1/stripe/webhook") {
      return next();
    }
    urlencoded({ extended: true, limit: "500kb" })(req, res, next);
  });

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  // app.useGlobalFilters(new MongoDuplicateKeyExceptionFilter());
  app.useGlobalFilters(new ValidationExceptionFilter());
  app.useGlobalFilters(new UnauthorizedExceptionFilter());
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  if (!["prod", "production"].includes(configService.get<string>("STAGE").toLowerCase())) {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(configService.get<string>("npm_package_name").replaceAll("-", " ").toUpperCase())
      .setDescription("DESCRIPTION")
      .setVersion(configService.get<string>("npm_package_version"))
      .build();

    const document = SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });
    SwaggerModule.setup("api", app, document, {
      swaggerOptions: {
        tagsSorter: "alpha",
      },
    });
  }
  try {
    await ConnectivityValidator.validate(configService);
  } catch (error) {
    app.get(WINSTON_MODULE_NEST_PROVIDER).error(`Application failed to start due to connectivity issues: ${error.message}`);
    process.exit(1);
  }

  await app.listen(configService.get<number>("PORT"));
}
bootstrap();
