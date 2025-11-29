import { Module } from '@nestjs/common';
import { AIResolver } from './ai.resolver';

@Module({
  providers: [AIResolver],
})
export class AIModule {}