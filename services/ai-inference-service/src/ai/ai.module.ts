import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { VectorService } from './vector.service';

@Module({
  controllers: [AIController],
  providers: [AIService, VectorService],
  exports: [AIService],
})
export class AIModule {}