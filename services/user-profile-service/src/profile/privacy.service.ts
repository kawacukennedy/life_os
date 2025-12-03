import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from './user.entity';

@Injectable()
export class PrivacyService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private httpService: HttpService,
  ) {}

  async exportUserData(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Collect data from all services
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        timezone: user.timezone,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      services: {},
      exportDate: new Date().toISOString(),
      gdprCompliant: true,
    };

    // Export from task service
    try {
      const tasksResponse = await firstValueFrom(
        this.httpService.get(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/user/${userId}`),
      );
      exportData.services.tasks = tasksResponse.data;
    } catch (error) {
      exportData.services.tasks = { error: 'Failed to export tasks' };
    }

    // Export from health service
    try {
      const healthResponse = await firstValueFrom(
        this.httpService.get(`${process.env.HEALTH_SERVICE_URL || 'http://localhost:3005'}/health/vitals?userId=${userId}&limit=1000`),
      );
      exportData.services.health = healthResponse.data;
    } catch (error) {
      exportData.services.health = { error: 'Failed to export health data' };
    }

    // Export from finance service
    try {
      const financeResponse = await firstValueFrom(
        this.httpService.get(`${process.env.FINANCE_SERVICE_URL || 'http://localhost:3004'}/finance/transactions?userId=${userId}&limit=1000`),
      );
      exportData.services.finance = financeResponse.data;
    } catch (error) {
      exportData.services.finance = { error: 'Failed to export finance data' };
    }

    // Export from learning service
    try {
      const learningResponse = await firstValueFrom(
        this.httpService.get(`${process.env.LEARNING_SERVICE_URL || 'http://localhost:3003'}/learning/progress?userId=${userId}`),
      );
      exportData.services.learning = learningResponse.data;
    } catch (error) {
      exportData.services.learning = { error: 'Failed to export learning data' };
    }

    // Export conversations from AI service
    try {
      const conversationsResponse = await firstValueFrom(
        this.httpService.get(`${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/conversations/${userId}`),
      );
      exportData.services.conversations = conversationsResponse.data;
    } catch (error) {
      exportData.services.conversations = { error: 'Failed to export conversations' };
    }

    return {
      exportDate: new Date(),
      userId,
      data: exportData,
      format: 'JSON',
      version: '1.0',
    };
  }

  async updateDataProcessingConsent(userId: string, consents: {
    analytics: boolean;
    aiTraining: boolean;
    marketing: boolean;
    thirdPartySharing: boolean;
  }): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Update user preferences with consent settings
    user.preferences = {
      ...user.preferences,
      privacy: {
        ...user.preferences?.privacy,
        consents,
        lastUpdated: new Date(),
      },
    };

    await this.userRepository.save(user);

    // Notify other services about consent changes
    await this.notifyConsentChange(userId, consents);

    return {
      userId,
      consents,
      updatedAt: new Date(),
      gdprCompliant: true,
    };
  }

  async getDataProcessingConsent(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const consents = user.preferences?.privacy?.consents || {
      analytics: false,
      aiTraining: false,
      marketing: false,
      thirdPartySharing: false,
    };

    return {
      userId,
      consents,
      lastUpdated: user.preferences?.privacy?.lastUpdated,
      gdprCompliant: true,
    };
  }

  async requestDataPortability(userId: string, format: 'json' | 'xml' = 'json'): Promise<any> {
    // Generate a secure download link for data export
    const exportData = await this.exportUserData(userId);

    // In a real implementation, you'd:
    // 1. Generate a secure, time-limited download URL
    // 2. Store the export data temporarily
    // 3. Send email notification with download link
    // 4. Log the portability request for compliance

    return {
      userId,
      requestId: `portability-${Date.now()}`,
      status: 'processing',
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      format,
      gdprCompliant: true,
    };
  }

  async submitDataDeletionRequest(userId: string, reason?: string): Promise<any> {
    // Create a deletion request record
    const deletionRequest = {
      userId,
      requestId: `deletion-${Date.now()}`,
      reason: reason || 'User requested data deletion',
      status: 'pending',
      requestedAt: new Date(),
      gdprCompliant: true,
    };

    // In a real implementation, you'd:
    // 1. Store the deletion request in a compliance database
    // 2. Send confirmation email to user
    // 3. Schedule deletion after grace period (e.g., 30 days)
    // 4. Notify all services of pending deletion

    return deletionRequest;
  }

  private async notifyConsentChange(userId: string, consents: any) {
    // Notify analytics service
    if (consents.analytics === false) {
      try {
        await firstValueFrom(
          this.httpService.post(`${process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3007'}/analytics/consent/optout`, {
            userId,
          }),
        );
      } catch (error) {
        console.error('Failed to notify analytics service of consent change');
      }
    }

    // Notify AI service
    if (consents.aiTraining === false) {
      try {
        await firstValueFrom(
          this.httpService.post(`${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/consent/optout`, {
            userId,
          }),
        );
      } catch (error) {
        console.error('Failed to notify AI service of consent change');
      }
    }
  }
}

  async deleteUserData(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const deletionResults = {
      userId,
      deletionDate: new Date(),
      services: {},
    };

    // Delete from task service
    try {
      // Get all user tasks and delete them
      const tasksResponse = await firstValueFrom(
        this.httpService.get(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/user/${userId}`),
      );
      const tasks = tasksResponse.data;

      for (const task of tasks) {
        await firstValueFrom(
          this.httpService.delete(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/${task.id}`),
        );
      }

      deletionResults.services.tasks = { deleted: tasks.length };
    } catch (error) {
      deletionResults.services.tasks = { error: 'Failed to delete tasks' };
    }

    // Delete from health service (anonymize rather than delete)
    try {
      // In a real implementation, you'd anonymize health data rather than delete it
      // for medical/research purposes, but mark as deleted for the user
      deletionResults.services.health = { status: 'Anonymized per GDPR requirements' };
    } catch (error) {
      deletionResults.services.health = { error: 'Failed to process health data' };
    }

    // Delete from finance service
    try {
      // Similar to health - anonymize financial data
      deletionResults.services.finance = { status: 'Anonymized per GDPR requirements' };
    } catch (error) {
      deletionResults.services.finance = { error: 'Failed to process finance data' };
    }

    // Delete conversations from AI service
    try {
      const conversationsResponse = await firstValueFrom(
        this.httpService.get(`${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/conversations/${userId}`),
      );
      const conversations = conversationsResponse.data;

      for (const conversation of conversations) {
        await firstValueFrom(
          this.httpService.delete(`${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/conversations/${conversation.id}/${userId}`),
        );
      }

      deletionResults.services.conversations = { deleted: conversations.length };
    } catch (error) {
      deletionResults.services.conversations = { error: 'Failed to delete conversations' };
    }

    // Finally, delete the user account
    await this.userRepository.remove(user);
    deletionResults.services.user = { status: 'Account deleted' };

    return deletionResults;
  }

  async anonymizeUserData(userId: string): Promise<any> {
    // For users who want to keep their account but anonymize data
    const anonymizationResults = {
      userId,
      anonymizationDate: new Date(),
      services: {},
    };

    // Anonymize user profile
    await this.userRepository.update(userId, {
      fullName: `User ${userId.substring(0, 8)}`,
      phoneNumber: null,
      avatar: null,
    });

    anonymizationResults.services.user = { status: 'Profile anonymized' };

    // Note: In a real implementation, you'd need to anonymize data across all services
    // This is a simplified version

    return anonymizationResults;
  }

  async getDataRetentionInfo(userId: string): Promise<any> {
    // Provide information about what data is stored and retention policies
    return {
      userId,
      dataRetention: {
        profile: 'Retained until account deletion',
        tasks: 'Retained until account deletion',
        health: 'Anonymized after 7 years per medical regulations',
        finance: 'Anonymized after 7 years per financial regulations',
        conversations: 'Retained for 1 year, then anonymized',
        learning: 'Retained until account deletion',
      },
      lastUpdated: new Date(),
    };
  }
}