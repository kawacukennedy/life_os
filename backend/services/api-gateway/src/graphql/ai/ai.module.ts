import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIResolver } from './ai.resolver';
import { AIService } from './ai.service';

@Module({
  imports: [HttpModule],
  providers: [AIResolver, AIService],
  exports: [AIService],
})
export class AIModule {}