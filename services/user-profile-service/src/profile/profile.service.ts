import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MonitoringService } from '../common/monitoring.service';
import { LoggingService } from '../common/logging.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class ProfileService {
  private prisma = new PrismaClient();

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getProfile(userId: string) {
    const startTime = Date.now();
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      this.monitoringService.recordDbQuery('findUnique', 'profile', Date.now() - startTime, true);

      if (!profile) {
        this.loggingService.logBusinessEvent('profile_not_found', { userId });
        throw new NotFoundException('Profile not found');
      }

      this.loggingService.logBusinessEvent('profile_retrieved', { userId });
      return profile;
    } catch (error) {
      this.monitoringService.recordDbQuery('findUnique', 'profile', Date.now() - startTime, false);
      this.loggingService.logError(error, 'getProfile', userId);
      throw error;
    }
  }

  async createProfile(userId: string, data: any) {
    const startTime = Date.now();
    try {
      const profile = await this.prisma.profile.create({
        data: {
          userId,
          preferences: {
            theme: 'light',
            language: 'en-US',
            timezone: 'UTC',
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
            privacy: {
              profileVisibility: 'private',
              dataSharing: false,
              analytics: true,
            },
          },
          metadata: {
            onboardingCompleted: false,
            lastActiveAt: new Date(),
            accountType: 'free',
          },
          connectedIntegrations: {
            google: false,
            fitbit: false,
            plaid: false,
            twitter: false,
            linkedin: false,
          },
          ...data,
        },
      });

      this.monitoringService.recordDbQuery('create', 'profile', Date.now() - startTime, true);
      this.loggingService.logBusinessEvent('profile_created', { userId, displayName: data.displayName });

      return profile;
    } catch (error) {
      this.monitoringService.recordDbQuery('create', 'profile', Date.now() - startTime, false);
      this.loggingService.logError(error, 'createProfile', userId);
      throw error;
    }
  }

  async updateProfile(userId: string, data: any) {
    const startTime = Date.now();
    try {
      const profile = await this.prisma.profile.update({
        where: { userId },
        data,
      });

      this.monitoringService.recordDbQuery('update', 'profile', Date.now() - startTime, true);
      this.loggingService.logBusinessEvent('profile_updated', { userId, updatedFields: Object.keys(data) });

      return profile;
    } catch (error) {
      this.monitoringService.recordDbQuery('update', 'profile', Date.now() - startTime, false);
      this.loggingService.logError(error, 'updateProfile', userId);
      throw error;
    }
  }

  async updatePreferences(userId: string, preferences: any) {
    const profile = await this.getProfile(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: {
        preferences: { ...profile.preferences, ...preferences },
      },
    });
  }

  async updatePrivacySettings(userId: string, privacy: any) {
    const profile = await this.getProfile(userId);
    const updatedPreferences = {
      ...profile.preferences,
      privacy: { ...profile.preferences.privacy, ...privacy },
    };
    return this.prisma.profile.update({
      where: { userId },
      data: {
        preferences: updatedPreferences,
      },
    });
  }

  async updateIntegrations(userId: string, integrations: any) {
    const profile = await this.getProfile(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: {
        connectedIntegrations: { ...profile.connectedIntegrations, ...integrations },
      },
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.prisma.profile.delete({
        where: { userId },
      });

      this.monitoringService.recordDbQuery('delete', 'profile', Date.now() - startTime, true);
      this.loggingService.logBusinessEvent('profile_deleted', { userId });
    } catch (error) {
      this.monitoringService.recordDbQuery('delete', 'profile', Date.now() - startTime, false);
      if (error.code === 'P2025') {
        this.loggingService.logBusinessEvent('profile_delete_not_found', { userId });
        throw new NotFoundException('Profile not found');
      }
      this.loggingService.logError(error, 'deleteProfile', userId);
      throw error;
    }
  }

  async exportProfileData(userId: string, format: 'json' | 'csv' = 'json') {
    const profile = await this.getProfile(userId);

    this.loggingService.logBusinessEvent('profile_data_exported', { userId, format });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Field', 'Value'],
        ['User ID', this.encryptionService.hashData(profile.userId)], // Hash sensitive data
        ['Display Name', profile.displayName || ''],
        ['Bio', profile.bio || ''],
        ['Role', profile.role],
        ['Created At', profile.createdAt.toISOString()],
        ['Updated At', profile.updatedAt.toISOString()],
      ];

      // Add preferences as flattened rows
      if (profile.preferences) {
        Object.entries(profile.preferences).forEach(([key, value]) => {
          csvData.push([`Preference: ${key}`, JSON.stringify(value)]);
        });
      }

      return {
        data: csvData.map(row => row.join(',')).join('\n'),
        contentType: 'text/csv',
        filename: `profile-${this.encryptionService.hashData(userId)}.csv`,
        exportDate: new Date(),
        dataRetention: '7 years',
      };
    }

    return {
      profile: {
        ...profile,
        userId: this.encryptionService.hashData(profile.userId), // Hash sensitive data in export
      },
      exportDate: new Date(),
      dataRetention: '7 years',
      gdprCompliant: true,
    };
  }

  async importProfileData(userId: string, importData: any) {
    // Validate import data structure
    if (!importData.profile) {
      throw new Error('Invalid import data format');
    }

    const { displayName, bio, avatarUrl, preferences, connectedIntegrations } = importData.profile;

    return this.prisma.profile.update({
      where: { userId },
      data: {
        displayName,
        bio,
        avatarUrl,
        preferences,
        connectedIntegrations,
      },
    });
  }

  async anonymizeProfile(userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      const profile = await this.getProfile(userId);
      const updatedPreferences = {
        ...profile.preferences,
        privacy: {
          ...profile.preferences.privacy,
          dataSharing: false,
          analytics: false,
        },
      };

      await this.prisma.profile.update({
        where: { userId },
        data: {
          displayName: 'Anonymous User',
          bio: null,
          avatarUrl: null,
          preferences: updatedPreferences,
        },
      });

      this.monitoringService.recordDbQuery('update', 'profile', Date.now() - startTime, true);
      this.loggingService.logBusinessEvent('profile_anonymized', { userId });
    } catch (error) {
      this.monitoringService.recordDbQuery('update', 'profile', Date.now() - startTime, false);
      this.loggingService.logError(error, 'anonymizeProfile', userId);
      throw error;
    }
  }

  async updateRole(userId: string, role: string) {
    const startTime = Date.now();
    const validRoles = ['end_user', 'admin', 'enterprise_admin', 'support_agent'];
    if (!validRoles.includes(role)) {
      this.loggingService.logSecurityEvent('invalid_role_update_attempt', { userId, attemptedRole: role });
      throw new Error('Invalid role');
    }

    try {
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { role },
      });

      this.monitoringService.recordDbQuery('update', 'profile', Date.now() - startTime, true);
      this.loggingService.logBusinessEvent('role_updated', { userId, newRole: role });

      return result;
    } catch (error) {
      this.monitoringService.recordDbQuery('update', 'profile', Date.now() - startTime, false);
      this.loggingService.logError(error, 'updateRole', userId);
      throw error;
    }
  }

  async getRole(userId: string): Promise<string> {
    const profile = await this.getProfile(userId);
    return profile.role;
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const role = await this.getRole(userId);
    const permissions = this.getPermissionsForRole(role);
    return permissions[resource]?.includes(action) || false;
  }

  private getPermissionsForRole(role: string) {
    const permissionMatrix = {
      end_user: {
        profile: ['read', 'update'],
        tasks: ['read', 'create', 'update', 'delete'],
        subscriptions: ['read', 'update'],
        integrations: ['read', 'create', 'delete'],
        ai_suggestions: ['create', 'read'],
      },
      admin: {
        profile: ['read'],
        tasks: ['read'],
        subscriptions: ['read', 'update'],
        integrations: ['read', 'delete'],
        ai_suggestions: ['read', 'manage'],
      },
      enterprise_admin: {
        profile: ['read', 'update'],
        tasks: ['read', 'create', 'update', 'delete'],
        subscriptions: ['read', 'update'],
        integrations: ['read', 'create', 'delete'],
        ai_suggestions: ['create', 'read', 'manage'],
      },
      support_agent: {
        profile: ['read'],
        tasks: ['read'],
        subscriptions: ['read'],
        integrations: ['read'],
        ai_suggestions: ['read'],
      },
    };
    return permissionMatrix[role] || {};
  }
}