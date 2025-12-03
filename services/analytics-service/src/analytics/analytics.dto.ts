import { IsString, IsObject, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class TrackEventDto {
  @IsUUID()
  userId: string;

  @IsString()
  eventType: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;
}

export class TrackEventsDto extends Array<TrackEventDto> {}

export class UserActivityReportDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class ProductMetricsReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class RetentionReportDto {
  @IsString()
  cohort: string;

  @IsString()
  periods: number;
}