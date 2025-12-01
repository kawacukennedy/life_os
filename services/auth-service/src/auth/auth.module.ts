import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
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
import { PerformanceService } from "./performance.service";
import { EventEntity } from "./event.entity";
import { EventStoreService } from "./event-store.service";
import { Tenant } from "./tenant.entity";
import { TenantService } from "./tenant.service";
import { TenantMiddleware } from "./tenant.middleware";

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, SecurityEvent, EventEntity, Tenant]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "15m" },
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD,
          database: parseInt(process.env.REDIS_DB) || 0,
          ttl: 300000, // 5 minutes default TTL
        }),
      }),
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
    PerformanceService,
    EventStoreService,
    TenantService,
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
