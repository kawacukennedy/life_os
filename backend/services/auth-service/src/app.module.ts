import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { User } from "./users/user.entity";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "lifeos",
      entities: [User],
      migrations: ["dist/migrations/*.js"],
      synchronize: process.env.NODE_ENV !== "production", // Only sync in development
      migrationsRun: process.env.NODE_ENV === "production", // Run migrations in production
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "15m" },
    }),
    AuthModule,
  ],
})
export class AppModule {}
