import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from "@nestjs/bull";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";
import { UserProfile } from "./profile.entity";
import { JwtStrategy } from "../auth/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "15m" },
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 1000,
    }),
    BullModule.registerQueue(
      { name: "profile-updates" },
      { name: "data-export" },
    ),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, JwtStrategy],
  exports: [ProfileService],
})
export class ProfileModule {}