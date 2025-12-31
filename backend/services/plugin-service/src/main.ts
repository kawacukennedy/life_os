import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import helmet from "helmet";
import * as compression from "compression";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Compression
  app.use(compression());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("LifeOS Plugin Service")
    .setDescription("Plugin marketplace and management service")
    .setVersion("1.0")
    .addTag("plugins")
    .addTag("marketplace")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // Global guards
  app.useGlobalGuards(new ThrottlerGuard());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? ['https://lifeos.com'] : ['http://localhost:3000'],
    credentials: true,
  });

  await app.listen(3009);
  console.log("Plugin service running on port 3009");
}
bootstrap();