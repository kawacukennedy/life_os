import { IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { Theme, Language } from '../profile.entity';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  aiSuggestions?: boolean;

  @IsOptional()
  @IsObject()
  customPreferences?: any;

  @IsOptional()
  @IsObject()
  notificationSettings?: any;
}