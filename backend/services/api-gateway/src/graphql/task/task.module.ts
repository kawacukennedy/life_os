import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TaskResolver } from './task.resolver';
import { TaskService } from './task.service';

@Module({
  imports: [HttpModule],
  providers: [TaskResolver, TaskService],
  exports: [TaskService],
})
export class TaskModule {}