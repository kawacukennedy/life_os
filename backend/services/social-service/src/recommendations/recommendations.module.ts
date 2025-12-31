import { Module } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { RecommendationsController } from "./recommendations.controller";
import { ConnectionsModule } from "../connections/connections.module";

@Module({
  imports: [ConnectionsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}