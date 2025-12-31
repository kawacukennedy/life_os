import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { VectorDbModule } from "../vector-db/vector-db.module";
import { LlmModule } from "../llm/llm.module";
import { JwtStrategy } from "../auth/jwt.strategy";

@Module({
  imports: [VectorDbModule, LlmModule],
  controllers: [AiController],
  providers: [AiService, JwtStrategy],
  exports: [AiService],
})
export class AiModule {}