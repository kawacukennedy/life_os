import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
   async exportProfileData(@Param('userId') userId: string, @Query('format') format: 'json' | 'csv' = 'json') {
     return this.profileService.exportProfileData(userId, format);
   }

   @Post(':userId/import')
   @UseGuards(JwtAuthGuard)
   async importProfileData(@Param('userId') userId: string, @Body() importData: any) {
     return this.profileService.importProfileData(userId, importData);
   }

  @Post(':userId/anonymize')
  @UseGuards(JwtAuthGuard)
  async anonymizeProfile(@Param('userId') userId: string) {
    await this.profileService.anonymizeProfile(userId);
    return { message: 'Profile anonymized successfully' };
  }

   @Put(':userId/role')
   @UseGuards(JwtAuthGuard)
   async updateRole(@Param('userId') userId: string, @Body() body: { role: string }) {
     return this.profileService.updateRole(userId, body.role);
   }

   @Get(':userId/role')
   @UseGuards(JwtAuthGuard)
   async getRole(@Param('userId') userId: string) {
     const role = await this.profileService.getRole(userId);
     return { role };
   }

   @Get(':userId/permissions')
   @UseGuards(JwtAuthGuard)
   async getPermissions(@Param('userId') userId: string, @Body() body: { resource: string; action: string }) {
     const hasPermission = await this.profileService.hasPermission(userId, body.resource, body.action);
     return { hasPermission };
   }

   @Delete(':userId')
   @UseGuards(JwtAuthGuard)
   async deleteProfile(@Param('userId') userId: string) {
     await this.profileService.deleteProfile(userId);
     return { message: 'Profile deleted successfully' };
   }
 }