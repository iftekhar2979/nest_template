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
import { DataSource } from 'typeorm';
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
  await seederService.seedAuthData();
  app.setBaseViewsDir(join(__dirname, "..", "..", "src", "views"));
  app.setViewEngine("ejs");
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/v1/stripe/webhook") {
      return next();
    }
    json({ limit: "500kb" })(req, res, next);
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
 

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

    // Swagger UI inlines the spec into swagger-ui-init.js. That .js asset is
    // edge-cached by CDNs (e.g. Cloudflare) by extension, which serves a stale
    // spec through tunnels/proxies. Mark the spec-bearing routes non-cacheable.
    app.use((req, res, next) => {
      if (["/api", "/api-json", "/api-yaml", "/api/swagger-ui-init.js"].includes(req.path)) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      }
      next();
    });

    const document = SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });
    SwaggerModule.setup("api", app, document, {
      swaggerOptions: {
        tagsSorter: "alpha",
      },
    });
  }
  try {
    await ConnectivityValidator.validate(configService, app.get(DataSource));
  } catch (error) {
    app.get(WINSTON_MODULE_NEST_PROVIDER).error(`Application failed to start due to connectivity issues: ${error.message}`);
    process.exit(1);
  }

  await app.listen(configService.get<number>("PORT"));
}
bootstrap();
