import { IsString, IsOptional, IsEnum, IsObject, IsUUID, IsDateString } from "class-validator";
import { EventType } from "../event.entity";

export class CreateEventDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsString()
  eventName: string;

  @IsObject()
  properties: Record<string, any>;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}