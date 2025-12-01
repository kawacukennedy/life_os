import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RoutinesService } from './routines.service';
import { RoutinesController } from './routines.controller';
import { RoutineSchedulerService } from './routine-scheduler.service';
import { Routine } from './routine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Routine]), HttpModule],
  providers: [RoutinesService, RoutineSchedulerService],
  controllers: [RoutinesController],
  exports: [RoutinesService],
})
export class RoutinesModule {}