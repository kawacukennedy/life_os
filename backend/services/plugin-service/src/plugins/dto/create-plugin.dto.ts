import { IsString, IsEnum, IsObject, IsOptional, IsArray, IsUrl, IsNumber, Min, Max } from 'class-validator';
import { PluginCategory } from '../plugin.entity';

export class CreatePluginDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsString()
  version: string;

  @IsString()
  authorName: string;

  @IsEnum(PluginCategory)
  category: PluginCategory;

  @IsObject()
  manifest: {
    version: string;
    apiVersion: string;
    permissions: string[];
    hooks: string[];
    settings: any[];
    entryPoints: {
      main?: string;
      settings?: string;
      background?: string;
    };
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[];

  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsUrl()
  repositoryUrl?: string;

  @IsOptional()
  @IsUrl()
  documentationUrl?: string;

  @IsOptional()
  @IsUrl()
  supportUrl?: string;

  @IsOptional()
  @IsObject()
  compatibility?: {
    minLifeOSVersion: string;
    maxLifeOSVersion?: string;
    requiredPermissions: string[];
  };
}