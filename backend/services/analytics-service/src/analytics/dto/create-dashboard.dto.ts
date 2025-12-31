import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from "class-validator";
import { DashboardType, WidgetType } from "../dashboard.entity";

export class CreateDashboardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DashboardType)
  type?: DashboardType;

  @IsObject()
  config: {
    widgets: Array<{
      id: string;
      type: WidgetType;
      title: string;
      position: { x: number; y: number; w: number; h: number };
      config: Record<string, any>;
    }>;
    layout: string;
    filters: Record<string, any>;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;
}