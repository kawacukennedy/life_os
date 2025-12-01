import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { VectorService } from './vector.service';
import { CommonModule } from './common.module';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Conversation, Message]),
  ],
  controllers: [AIController],
  providers: [AIService, VectorService],
  exports: [AIService],
})
export class AIModule {}