import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LearningResolver } from './learning.resolver';
import { LearningService } from './learning.service';

@Module({
  imports: [HttpModule],
  providers: [LearningResolver, LearningService],
  exports: [LearningService],
})
export class LearningModule {}