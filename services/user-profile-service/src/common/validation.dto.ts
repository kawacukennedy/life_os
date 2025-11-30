import { IsString, IsOptional, IsObject, IsBoolean, IsEnum, Length, IsEmail, IsUrl, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}-[A-Z]{2}$/, { message: 'Locale must be in format xx-XX' })
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  @IsOptional()
  @IsObject()
  privacy?: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataSharing: boolean;
    analytics: boolean;
  };
}

export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(['public', 'private', 'friends'])
  profileVisibility?: 'public' | 'private' | 'friends';

  @IsOptional()
  @IsBoolean()
  dataSharing?: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;
}

export class UpdateIntegrationsDto {
  @IsOptional()
  @IsBoolean()
  google?: boolean;

  @IsOptional()
  @IsBoolean()
  fitbit?: boolean;

  @IsOptional()
  @IsBoolean()
  plaid?: boolean;

  @IsOptional()
  @IsBoolean()
  twitter?: boolean;

  @IsOptional()
  @IsBoolean()
  linkedin?: boolean;
}

export class CreateProfileDto {
  @IsString()
  @Length(1, 100)
  displayName: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class UpdateRoleDto {
  @IsEnum(['end_user', 'admin', 'enterprise_admin', 'support_agent'])
  role: 'end_user' | 'admin' | 'enterprise_admin' | 'support_agent';
}