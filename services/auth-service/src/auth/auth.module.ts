import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from "@nestjs/bull";
import { AuthService } from "./auth.service";
import { GoogleCalendarService } from "./google-calendar.service";
import { CacheService } from "./cache.service";
import { BackgroundJobService } from "./background-job.service";
import { EmailProcessor } from "./email.processor";
import { NotificationProcessor } from "./notification.processor";
import { LoggerService } from "./logger.service";
import { FileService } from "./file.service";
import { AuthController } from "./auth.controller";
import { User } from "../users/user.entity";
import { JwtStrategy } from "./jwt.strategy";
import { GoogleStrategy } from "./google.strategy";
import { LocalStrategy } from "./local.strategy";
import { CommonModule } from "./common.module";
import { SecurityService } from "./security.service";
import { SecurityMiddleware } from "./security.middleware";
import { SecurityEvent } from "./security-event.entity";

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, SecurityEvent]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "15m" },
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 1000,
    }),
    BullModule.registerQueue(
      { name: "email" },
      { name: "notification" },
      { name: "sync" },
    ),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleCalendarService,
    CacheService,
    BackgroundJobService,
    EmailProcessor,
    NotificationProcessor,
    FileService,
    SecurityService,
    JwtStrategy,
    GoogleStrategy,
    LocalStrategy,
  ],
  exports: [
    AuthService,
    CacheService,
    BackgroundJobService,
    LoggerService,
    FileService,
    SecurityService,
  ],
})
export class AuthModule {}
