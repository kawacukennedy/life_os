import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsArray, IsObject } from 'class-validator';
import { TaskPriority } from '../task.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440) // 24 hours in minutes
  durationMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: {
    context?: string;
    aiGenerated?: boolean;
    source?: string;
    recurrence?: {
      frequency: string;
      interval: number;
      endDate?: Date;
    };
  };

  @IsOptional()
  @IsDateString()
  reminderAt?: string;
}