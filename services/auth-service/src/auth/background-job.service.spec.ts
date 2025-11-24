import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { BackgroundJobService } from './background-job.service';
import { LoggerService } from './logger.service';

describe('BackgroundJobService', () => {
  let service: BackgroundJobService;
  let emailQueue: Queue;
  let notificationQueue: Queue;
  let syncQueue: Queue;
  let loggerService: LoggerService;

  const mockEmailQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
    removeJobs: jest.fn(),
  };

  const mockNotificationQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
    removeJobs: jest.fn(),
  };

  const mockSyncQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
    removeJobs: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackgroundJobService,
        {
          provide: getQueueToken('email'),
          useValue: mockEmailQueue,
        },
        {
          provide: getQueueToken('notification'),
          useValue: mockNotificationQueue,
        },
        {
          provide: getQueueToken('sync'),
          useValue: mockSyncQueue,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<BackgroundJobService>(BackgroundJobService);
    emailQueue = module.get<Queue>(getQueueToken('email'));
    notificationQueue = module.get<Queue>(getQueueToken('notification'));
    syncQueue = module.get<Queue>(getQueueToken('sync'));
    loggerService = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addEmailJob', () => {
    it('should add email job to queue', async () => {
      const jobData = {
        to: 'user@example.com',
        subject: 'Welcome!',
        template: 'welcome',
        context: { name: 'John' },
      };
      const jobId = 'job-123';
      mockEmailQueue.add.mockResolvedValue({ id: jobId } as any);

      const result = await service.addEmailJob(jobData);

      expect(result).toBe(jobId);
      expect(mockEmailQueue.add).toHaveBeenCalledWith('send-email', jobData, {
        priority: 1,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Email job added to queue',
        expect.objectContaining({ jobId, email: jobData.to })
      );
    });

    it('should handle queue errors gracefully', async () => {
      const jobData = {
        to: 'user@example.com',
        subject: 'Welcome!',
        template: 'welcome',
        context: { name: 'John' },
      };
      mockEmailQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(service.addEmailJob(jobData)).rejects.toThrow('Queue error');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('addNotificationJob', () => {
    it('should add notification job to queue', async () => {
      const jobData = {
        userId: 'user-123',
        type: 'achievement',
        title: 'Goal Completed!',
        message: 'Congratulations on completing your goal.',
        channels: ['in_app', 'email'],
        priority: 'normal' as const,
      };
      const jobId = 'job-456';
      mockNotificationQueue.add.mockResolvedValue({ id: jobId } as any);

      const result = await service.addNotificationJob(jobData);

      expect(result).toBe(jobId);
      expect(mockNotificationQueue.add).toHaveBeenCalledWith('send-notification', jobData, {
        priority: 2,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Notification job added to queue',
        expect.objectContaining({ jobId, userId: jobData.userId, type: jobData.type })
      );
    });

    it('should set higher priority for urgent notifications', async () => {
      const jobData = {
        userId: 'user-123',
        type: 'system',
        title: 'Security Alert',
        message: 'Your account security has been updated.',
        channels: ['in_app', 'email', 'sms'],
        priority: 'urgent' as const,
      };
      mockNotificationQueue.add.mockResolvedValue({ id: 'job-789' } as any);

      await service.addNotificationJob(jobData);

      expect(mockNotificationQueue.add).toHaveBeenCalledWith('send-notification', jobData, {
        priority: 10, // Higher priority for urgent
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
    });
  });

  describe('addSyncJob', () => {
    it('should add sync job to queue', async () => {
      const jobData = {
        userId: 'user-123',
        service: 'fitbit',
        action: 'sync-activities',
        priority: 'normal' as const,
      };
      const jobId = 'job-101';
      mockSyncQueue.add.mockResolvedValue({ id: jobId } as any);

      const result = await service.addSyncJob(jobData);

      expect(result).toBe(jobId);
      expect(mockSyncQueue.add).toHaveBeenCalledWith('sync-data', jobData, {
        priority: 3,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Sync job added to queue',
        expect.objectContaining({
          jobId,
          userId: jobData.userId,
          service: jobData.service,
          action: jobData.action
        })
      );
    });

    it('should set higher priority for high priority sync jobs', async () => {
      const jobData = {
        userId: 'user-123',
        service: 'plaid',
        action: 'sync-transactions',
        priority: 'high' as const,
      };
      mockSyncQueue.add.mockResolvedValue({ id: 'job-202' } as any);

      await service.addSyncJob(jobData);

      expect(mockSyncQueue.add).toHaveBeenCalledWith('sync-data', jobData, {
        priority: 8, // Higher priority for high priority jobs
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status from email queue', async () => {
      const mockJob = {
        id: 'job-123',
        finishedOn: Date.now(),
        processedOn: Date.now() - 1000,
        failedReason: null,
        opts: { attempts: 3 },
        attemptsMade: 1,
        finished: jest.fn().mockReturnValue(true),
        failed: jest.fn().mockReturnValue(false),
      };
      mockEmailQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await service.getJobStatus('email', 'job-123');

      expect(result).toEqual({
        id: 'job-123',
        status: 'completed',
        finishedOn: expect.any(Number),
        processedOn: expect.any(Number),
        attemptsMade: 1,
        attemptsRemaining: 2,
      });
      expect(mockEmailQueue.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return job status from notification queue', async () => {
      const mockJob = {
        id: 'job-456',
        finishedOn: null,
        processedOn: null,
        failedReason: null,
        opts: { attempts: 3 },
        attemptsMade: 0,
        finished: jest.fn().mockReturnValue(false),
        failed: jest.fn().mockReturnValue(false),
      };
      mockNotificationQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await service.getJobStatus('notification', 'job-456');

      expect(result).toEqual({
        id: 'job-456',
        status: 'waiting',
        finishedOn: null,
        processedOn: null,
        attemptsMade: 0,
        attemptsRemaining: 3,
      });
    });

    it('should return null for non-existent job', async () => {
      mockEmailQueue.getJob.mockResolvedValue(null);

      const result = await service.getJobStatus('email', 'nonexistent-job');

      expect(result).toBeNull();
    });

    it('should throw error for invalid queue name', async () => {
      await expect(service.getJobStatus('invalid-queue', 'job-123')).rejects.toThrow(
        'Invalid queue name: invalid-queue'
      );
    });
  });

  describe('cancelJob', () => {
    it('should cancel job from email queue', async () => {
      const mockJob = {
        id: 'job-123',
        remove: jest.fn().mockResolvedValue(true),
      };
      mockEmailQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await service.cancelJob('email', 'job-123');

      expect(result).toBe(true);
      expect(mockJob.remove).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Job cancelled successfully',
        expect.objectContaining({ queue: 'email', jobId: 'job-123' })
      );
    });

    it('should return false for non-existent job', async () => {
      mockEmailQueue.getJob.mockResolvedValue(null);

      const result = await service.cancelJob('email', 'nonexistent-job');

      expect(result).toBe(false);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Job not found for cancellation',
        expect.objectContaining({ queue: 'email', jobId: 'nonexistent-job' })
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockJobs = [
        { id: 'job-1', finished: jest.fn().mockReturnValue(true) },
        { id: 'job-2', finished: jest.fn().mockReturnValue(false) },
      ];
      mockEmailQueue.getJobs.mockResolvedValue(mockJobs as any);

      const result = await service.getQueueStats('email');

      expect(result).toEqual({
        queue: 'email',
        totalJobs: 2,
        completedJobs: 1,
        failedJobs: 0,
        activeJobs: 0,
        waitingJobs: 1,
      });
      expect(mockEmailQueue.getJobs).toHaveBeenCalledWith([], { start: 0, end: -1 });
    });

    it('should handle queue errors gracefully', async () => {
      mockEmailQueue.getJobs.mockRejectedValue(new Error('Queue error'));

      const result = await service.getQueueStats('email');

      expect(result).toEqual({
        queue: 'email',
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        activeJobs: 0,
        waitingJobs: 0,
      });
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});