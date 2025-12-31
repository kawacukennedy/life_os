import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from "@nestjs/bull";
import { PluginService } from "./plugin.service";
import { PluginController } from "./plugin.controller";
import { Plugin } from "./plugin.entity";
import { UserPlugin } from "./user-plugin.entity";
import { JwtStrategy } from "../auth/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([Plugin, UserPlugin]),
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
      { name: "plugin-install" },
      { name: "plugin-update" },
    ),
  ],
  controllers: [PluginController],
  providers: [PluginService, JwtStrategy],
  exports: [PluginService],
})
export class PluginModule {}