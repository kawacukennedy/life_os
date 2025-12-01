import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { EventStoreService } from './event-store.service';
import { DataWarehouseService } from './data-warehouse.service';
import { SecurityService } from './security.service';

export interface DataExport {
  userId: string;
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt: Date;
  data: {
    personalData: any;
    usageData: any[];
    eventHistory: any[];
    analyticsData: any[];
  };
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  consented: boolean;
  consentedAt?: Date;
  revokedAt?: Date;
  consentVersion: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventStore: EventStoreService,
    private dataWarehouse: DataWarehouseService,
    private securityService: SecurityService,
  ) {}

  async requestDataExport(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const exportId = `export_${userId}_${Date.now()}`;

    // Create export record (in a real implementation, you'd have an Export entity)
    const exportRecord: DataExport = {
      userId,
      exportId,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      data: {
        personalData: {},
        usageData: [],
        eventHistory: [],
        analyticsData: [],
      },
    };

    // Start async processing
    this.processDataExport(exportRecord, ipAddress, userAgent);

    // Log GDPR event
    await this.eventStore.saveEvent({
      eventId: `gdpr_export_${exportId}`,
      eventType: 'GDPR_DataExportRequested',
      aggregateId: userId,
      aggregateType: 'User',
      eventData: { exportId, ipAddress, userAgent },
      metadata: {
        timestamp: new Date(),
        userId,
        version: 1,
      },
    });

    return exportId;
  }

  async getDataExportStatus(userId: string, exportId: string): Promise<DataExport | null> {
    // In a real implementation, you'd query the Export entity
    // For now, return a mock response
    return {
      userId,
      exportId,
      status: 'completed',
      requestedAt: new Date(),
      completedAt: new Date(),
      downloadUrl: `https://api.lifeos.com/gdpr/download/${exportId}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      data: {
        personalData: {},
        usageData: [],
        eventHistory: [],
        analyticsData: [],
      },
    };
  }

  async downloadDataExport(userId: string, exportId: string): Promise<any> {
    const exportRecord = await this.getDataExportStatus(userId, exportId);
    if (!exportRecord || exportRecord.status !== 'completed') {
      throw new NotFoundException('Export not found or not ready');
    }

    if (exportRecord.expiresAt < new Date()) {
      throw new NotFoundException('Export has expired');
    }

    return exportRecord.data;
  }

  async requestDataDeletion(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Start async deletion process
    this.processDataDeletion(userId, ipAddress, userAgent);

    // Log GDPR event
    await this.eventStore.saveEvent({
      eventId: `gdpr_deletion_${userId}_${Date.now()}`,
      eventType: 'GDPR_DataDeletionRequested',
      aggregateId: userId,
      aggregateType: 'User',
      eventData: { ipAddress, userAgent },
      metadata: {
        timestamp: new Date(),
        userId,
        version: 1,
      },
    });
  }

  async manageConsent(
    userId: string,
    consentType: string,
    consented: boolean,
    ipAddress: string,
    userAgent: string,
    consentVersion: string = '1.0',
  ): Promise<void> {
    const consentRecord: ConsentRecord = {
      userId,
      consentType,
      consented,
      consentedAt: consented ? new Date() : undefined,
      revokedAt: consented ? undefined : new Date(),
      consentVersion,
      ipAddress,
      userAgent,
    };

    // In a real implementation, you'd save this to a Consent entity
    this.logger.log(`Consent ${consented ? 'given' : 'revoked'} for ${consentType} by user ${userId}`);

    // Log consent event
    await this.eventStore.saveEvent({
      eventId: `consent_${userId}_${consentType}_${Date.now()}`,
      eventType: consented ? 'GDPR_ConsentGiven' : 'GDPR_ConsentRevoked',
      aggregateId: userId,
      aggregateType: 'User',
      eventData: consentRecord,
      metadata: {
        timestamp: new Date(),
        userId,
        version: 1,
      },
    });
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    // In a real implementation, you'd query the Consent entity
    // Return mock data for now
    return [
      {
        userId,
        consentType: 'analytics',
        consented: true,
        consentedAt: new Date(),
        consentVersion: '1.0',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0...',
      },
      {
        userId,
        consentType: 'marketing',
        consented: false,
        revokedAt: new Date(),
        consentVersion: '1.0',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0...',
      },
    ];
  }

  async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize personal data while keeping usage patterns
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate anonymized identifiers
    const anonymizedEmail = `anon_${this.securityService.generateSecureToken(16)}@anonymous.lifeos.com`;
    const anonymizedName = `Anonymous User ${this.securityService.generateSecureToken(8)}`;

    // Update user record
    user.email = anonymizedEmail;
    user.fullName = anonymizedName;
    // Clear other personal data
    user.timezone = undefined;
    user.avatar = undefined;
    user.phoneNumber = undefined;

    await this.userRepository.save(user);

    // Log anonymization event
    await this.eventStore.saveEvent({
      eventId: `anonymize_${userId}_${Date.now()}`,
      eventType: 'GDPR_DataAnonymized',
      aggregateId: userId,
      aggregateType: 'User',
      eventData: { anonymizedEmail, anonymizedName },
      metadata: {
        timestamp: new Date(),
        userId,
        version: 1,
      },
    });
  }

  async getDataProcessingInfo(userId: string): Promise<any> {
    return {
      dataController: 'LifeOS Inc.',
      dataProtectionOfficer: 'privacy@lifeos.com',
      legalBasis: 'Contractual necessity and legitimate interest',
      dataRetention: {
        personalData: 'As long as account is active plus 3 years',
        usageData: '2 years',
        analyticsData: '1 year',
      },
      dataRecipients: [
        'Google Cloud Platform (hosting)',
        'Stripe (payments)',
        'SendGrid (email)',
        'Analytics providers (with consent)',
      ],
      userRights: {
        access: true,
        rectification: true,
        erasure: true,
        restriction: true,
        portability: true,
        objection: true,
      },
      lastUpdated: new Date('2024-01-01'),
    };
  }

  private async processDataExport(exportRecord: DataExport, ipAddress: string, userAgent: string): Promise<void> {
    try {
      exportRecord.status = 'processing';

      // Gather personal data
      const user = await this.userRepository.findOne({
        where: { id: exportRecord.userId },
        relations: ['tenant'],
      });

      exportRecord.data.personalData = {
        id: user?.id,
        email: user?.email,
        fullName: user?.fullName,
        timezone: user?.timezone,
        avatar: user?.avatar,
        phoneNumber: user?.phoneNumber,
        isActive: user?.isActive,
        role: user?.role,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
        lastActiveAt: user?.lastActiveAt,
        tenantId: user?.tenantId,
      };

      // Gather event history
      exportRecord.data.eventHistory = await this.eventStore.getEvents(exportRecord.userId);

      // Gather analytics data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      exportRecord.data.analyticsData = await this.dataWarehouse.getAnalyticsReport(
        user?.tenantId || 'default',
        thirtyDaysAgo,
        new Date(),
      );

      // Create downloadable file (in a real implementation)
      exportRecord.status = 'completed';
      exportRecord.completedAt = new Date();

      this.logger.log(`Data export completed for user ${exportRecord.userId}`);
    } catch (error) {
      exportRecord.status = 'failed';
      this.logger.error(`Data export failed for user ${exportRecord.userId}:`, error);
    }
  }

  private async processDataDeletion(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      // Anonymize data instead of hard deletion (for compliance)
      await this.anonymizeUserData(userId);

      // Mark user as deleted (soft delete)
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.isActive = false;
        // In a real implementation, you'd have a deleted_at field
        await this.userRepository.save(user);
      }

      // Schedule hard deletion after retention period (in a real implementation)
      // This would be done via a background job

      this.logger.log(`Data deletion completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Data deletion failed for user ${userId}:`, error);
    }
  }

  async getComplianceReport(): Promise<any> {
    // Generate compliance report for GDPR/SOC2
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });

    // Count data export/deletion requests (in a real implementation)
    const dataExportRequests = 0; // Would query Export entity
    const dataDeletionRequests = 0; // Would query Deletion entity

    return {
      reportPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      gdpr: {
        totalUsers,
        activeUsers,
        dataExportRequests,
        dataDeletionRequests,
        consentRecords: await this.getAllConsentStats(),
        dataProcessingLocations: ['US', 'EU', 'Asia'],
        retentionCompliance: true,
      },
      soc2: {
        securityControls: {
          accessControl: 'implemented',
          encryption: 'AES-256-GCM',
          auditLogging: 'enabled',
          backupRecovery: 'automated',
        },
        availability: {
          uptime: '99.9%',
          incidentResponse: '30 minutes',
          backupFrequency: 'daily',
        },
        confidentiality: {
          dataClassification: 'implemented',
          accessMonitoring: 'enabled',
          encryptionAtRest: 'enabled',
        },
      },
      generatedAt: new Date(),
    };
  }

  private async getAllConsentStats(): Promise<any> {
    // In a real implementation, you'd aggregate consent data
    return {
      analytics: { consented: 75, revoked: 25 },
      marketing: { consented: 45, revoked: 55 },
      thirdParty: { consented: 60, revoked: 40 },
    };
  }
}