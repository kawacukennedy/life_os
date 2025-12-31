import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserProfile, PrivacyLevel, Theme, Language } from "./profile.entity";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { UpdatePrivacyDto } from "./dto/update-privacy.dto";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private profilesRepository: Repository<UserProfile>,
  ) {}

  async create(createProfileDto: CreateProfileDto): Promise<UserProfile> {
    const profile = this.profilesRepository.create({
      userId: createProfileDto.userId,
      ...createProfileDto,
    });

    return this.profilesRepository.save(profile);
  }

  async findOne(userId: string): Promise<UserProfile> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async findOnePublic(userId: string): Promise<Partial<UserProfile>> {
    const profile = await this.findOne(userId);

    // Return only public information based on privacy settings
    if (profile.profilePrivacy === PrivacyLevel.PRIVATE) {
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      };
    }

    return profile;
  }

  async update(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfile> {
    const profile = await this.findOne(userId);

    Object.assign(profile, updateProfileDto);
    return this.profilesRepository.save(profile);
  }

  async updatePreferences(userId: string, updatePreferencesDto: UpdatePreferencesDto): Promise<UserProfile> {
    const profile = await this.findOne(userId);

    // Merge preferences
    profile.customPreferences = {
      ...profile.customPreferences,
      ...updatePreferencesDto.customPreferences,
    };

    profile.notificationSettings = {
      ...profile.notificationSettings,
      ...updatePreferencesDto.notificationSettings,
    };

    profile.theme = updatePreferencesDto.theme || profile.theme;
    profile.language = updatePreferencesDto.language || profile.language;
    profile.emailNotifications = updatePreferencesDto.emailNotifications ?? profile.emailNotifications;
    profile.pushNotifications = updatePreferencesDto.pushNotifications ?? profile.pushNotifications;
    profile.smsNotifications = updatePreferencesDto.smsNotifications ?? profile.smsNotifications;
    profile.aiSuggestions = updatePreferencesDto.aiSuggestions ?? profile.aiSuggestions;

    return this.profilesRepository.save(profile);
  }

  async updatePrivacy(userId: string, updatePrivacyDto: UpdatePrivacyDto): Promise<UserProfile> {
    const profile = await this.findOne(userId);

    profile.privacySettings = {
      ...profile.privacySettings,
      ...updatePrivacyDto.privacySettings,
    };

    profile.profilePrivacy = updatePrivacyDto.profilePrivacy || profile.profilePrivacy;
    profile.activityPrivacy = updatePrivacyDto.activityPrivacy || profile.activityPrivacy;
    profile.dataSharing = updatePrivacyDto.dataSharing ?? profile.dataSharing;
    profile.analyticsTracking = updatePrivacyDto.analyticsTracking ?? profile.analyticsTracking;

    return this.profilesRepository.save(profile);
  }

  async updateOnboardingProgress(userId: string, progress: {
    step: number;
    completedSteps: string[];
    preferences: Record<string, any>;
  }): Promise<UserProfile> {
    const profile = await this.findOne(userId);

    profile.onboardingProgress = progress;
    profile.onboardingCompleted = progress.step >= 5; // Assuming 5 steps

    return this.profilesRepository.save(profile);
  }

  async completeOnboarding(userId: string): Promise<UserProfile> {
    const profile = await this.findOne(userId);

    profile.onboardingCompleted = true;
    return this.profilesRepository.save(profile);
  }

  async exportUserData(userId: string): Promise<any> {
    const profile = await this.findOne(userId);

    // In a real implementation, this would gather data from all services
    // For now, return profile data
    return {
      profile: profile,
      exportDate: new Date(),
      dataTypes: ['profile', 'preferences', 'privacy'],
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    if (profile) {
      await this.profilesRepository.remove(profile);
    }

    // In a real implementation, this would trigger data deletion across all services
    // via events or direct API calls
  }

  async getPrivacySettings(userId: string): Promise<any> {
    const profile = await this.findOne(userId);

    return {
      profilePrivacy: profile.profilePrivacy,
      activityPrivacy: profile.activityPrivacy,
      dataSharing: profile.dataSharing,
      analyticsTracking: profile.analyticsTracking,
      privacySettings: profile.privacySettings,
    };
  }

  async getNotificationSettings(userId: string): Promise<any> {
    const profile = await this.findOne(userId);

    return {
      emailNotifications: profile.emailNotifications,
      pushNotifications: profile.pushNotifications,
      smsNotifications: profile.smsNotifications,
      notificationSettings: profile.notificationSettings,
    };
  }

  async getUserPreferences(userId: string): Promise<any> {
    const profile = await this.findOne(userId);

    return {
      theme: profile.theme,
      language: profile.language,
      timezone: profile.timezone,
      aiSuggestions: profile.aiSuggestions,
      customPreferences: profile.customPreferences,
    };
  }

  async searchProfiles(query: string, currentUserId: string, limit: number = 20): Promise<Partial<UserProfile>[]> {
    // Search profiles that are not private
    const profiles = await this.profilesRepository
      .createQueryBuilder('profile')
      .where('profile.profilePrivacy != :private', { private: PrivacyLevel.PRIVATE })
      .andWhere('(profile.displayName ILIKE :query OR profile.bio ILIKE :query)', {
        query: `%${query}%`,
      })
      .andWhere('profile.userId != :currentUserId', { currentUserId })
      .limit(limit)
      .getMany();

    // Return only public information
    return profiles.map(profile => ({
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
    }));
  }
}