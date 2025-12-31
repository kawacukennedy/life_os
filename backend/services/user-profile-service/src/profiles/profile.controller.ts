import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UserProfile } from './profile.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully', type: UserProfile })
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: UserProfile })
  getMyProfile(@Request() req) {
    return this.profileService.findOne(req.user.userId);
  }

  @Get('public/:userId')
  @ApiOperation({ summary: 'Get public profile information' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved successfully' })
  getPublicProfile(@Param('userId') userId: string) {
    return this.profileService.findOnePublic(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserProfile })
  updateMyProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(req.user.userId, updateProfileDto);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully', type: UserProfile })
  updatePreferences(@Request() req, @Body() updatePreferencesDto: UpdatePreferencesDto) {
    return this.profileService.updatePreferences(req.user.userId, updatePreferencesDto);
  }

  @Patch('me/privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated successfully', type: UserProfile })
  updatePrivacy(@Request() req, @Body() updatePrivacyDto: UpdatePrivacyDto) {
    return this.profileService.updatePrivacy(req.user.userId, updatePrivacyDto);
  }

  @Get('me/privacy')
  @ApiOperation({ summary: 'Get privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings retrieved successfully' })
  getPrivacySettings(@Request() req) {
    return this.profileService.getPrivacySettings(req.user.userId);
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  getPreferences(@Request() req) {
    return this.profileService.getUserPreferences(req.user.userId);
  }

  @Get('me/notifications')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  getNotificationSettings(@Request() req) {
    return this.profileService.getNotificationSettings(req.user.userId);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    // In a real implementation, this would upload to cloud storage
    // For now, return the file path
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.profileService.update(req.user.userId, { avatarUrl });
  }

  @Post('me/onboarding/complete')
  @ApiOperation({ summary: 'Complete user onboarding' })
  @ApiResponse({ status: 200, description: 'Onboarding completed successfully' })
  completeOnboarding(@Request() req) {
    return this.profileService.completeOnboarding(req.user.userId);
  }

  @Patch('me/onboarding/progress')
  @ApiOperation({ summary: 'Update onboarding progress' })
  @ApiResponse({ status: 200, description: 'Onboarding progress updated successfully' })
  updateOnboardingProgress(
    @Request() req,
    @Body() progress: {
      step: number;
      completedSteps: string[];
      preferences: Record<string, any>;
    },
  ) {
    return this.profileService.updateOnboardingProgress(req.user.userId, progress);
  }

  @Post('me/export')
  @ApiOperation({ summary: 'Export user data' })
  @ApiResponse({ status: 200, description: 'Data export initiated' })
  exportData(@Request() req) {
    return this.profileService.exportUserData(req.user.userId);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user profile and data' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  deleteProfile(@Request() req) {
    return this.profileService.deleteUserData(req.user.userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search public profiles' })
  @ApiResponse({ status: 200, description: 'Profiles found successfully' })
  searchProfiles(
    @Request() req,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.profileService.searchProfiles(query, req.user.userId, limitNum);
  }
}