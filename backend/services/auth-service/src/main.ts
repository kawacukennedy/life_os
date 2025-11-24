import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("LifeOS Auth Service")
    .setDescription("Authentication and user management service for LifeOS")
    .setVersion("1.0")
    .addTag("auth")
    .addTag("users")
    .addTag("integrations")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(3001);
  console.log("Auth service running on port 3001");
}
bootstrap();
