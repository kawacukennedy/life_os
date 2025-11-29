import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Param('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  async createProfile(@Param('userId') userId: string, @Body() data: any) {
    return this.profileService.createProfile(userId, data);
  }

  @Put(':userId')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Param('userId') userId: string, @Body() data: any) {
    return this.profileService.updateProfile(userId, data);
  }

  @Put(':userId/preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(@Param('userId') userId: string, @Body() preferences: any) {
    return this.profileService.updatePreferences(userId, preferences);
  }

  @Put(':userId/privacy')
  @UseGuards(JwtAuthGuard)
  async updatePrivacySettings(@Param('userId') userId: string, @Body() privacy: any) {
    return this.profileService.updatePrivacySettings(userId, privacy);
  }

  @Put(':userId/integrations')
  @UseGuards(JwtAuthGuard)
  async updateIntegrations(@Param('userId') userId: string, @Body() integrations: any) {
    return this.profileService.updateIntegrations(userId, integrations);
  }

  @Get(':userId/export')
  @UseGuards(JwtAuthGuard)
  async exportProfileData(@Param('userId') userId: string) {
    return this.profileService.exportProfileData(userId);
  }

  @Post(':userId/anonymize')
  @UseGuards(JwtAuthGuard)
  async anonymizeProfile(@Param('userId') userId: string) {
    await this.profileService.anonymizeProfile(userId);
    return { message: 'Profile anonymized successfully' };
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@Param('userId') userId: string) {
    await this.profileService.deleteProfile(userId);
    return { message: 'Profile deleted successfully' };
  }
}