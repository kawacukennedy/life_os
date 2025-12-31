import { IsString, IsEnum, IsNumber, IsOptional, IsObject, IsDateString } from "class-validator";
import { MetricType, MetricGranularity } from "../metric.entity";

export class CreateMetricDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MetricType)
  type: MetricType;

  @IsEnum(MetricGranularity)
  granularity: MetricGranularity;

  @IsString()
  category: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}