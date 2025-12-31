import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { BullModule } from "@nestjs/bull";
import { HttpModule } from "@nestjs/axios";
import { PluginModule } from "./plugins/plugin.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { Plugin } from "./plugins/plugin.entity";
import { UserPlugin } from "./plugins/user-plugin.entity";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "lifeos_plugins",
      entities: [Plugin, UserPlugin],
      migrations: ["dist/migrations/*.js"],
      synchronize: process.env.NODE_ENV !== "production",
      migrationsRun: process.env.NODE_ENV === "production",
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "15m" },
    }),
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 1000,
    }),
    BullModule.registerQueue(
      { name: "plugin-install" },
      { name: "plugin-update" },
      { name: "marketplace-sync" },
    ),
    HttpModule,
    PluginModule,
    MarketplaceModule,
  ],
})
export class AppModule {}