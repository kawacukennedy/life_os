import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { Event } from "./event.entity";
import { Metric } from "./metric.entity";
import { Dashboard } from "./dashboard.entity";
import { JwtStrategy } from "../auth/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Metric, Dashboard]),
    PassportModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtStrategy],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}