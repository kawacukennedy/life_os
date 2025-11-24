import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';
import { LoggerService } from '../auth/logger.service';
import { CacheService } from '../auth/cache.service';
import { BackgroundJobService } from '../auth/background-job.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Repository<Notification>;
  let loggerService: LoggerService;
  let cacheService: CacheService;
  let backgroundJobService: BackgroundJobService;

  const mockNotification = {
    id: 'notification-uuid',
    userId: 'user-uuid',
    title: 'Welcome!',
    message: 'Welcome to LifeOS',
    type: 'welcome',
    priority: 'normal',
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockBackgroundJobService = {
    addNotificationJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: BackgroundJobService,
          useValue: mockBackgroundJobService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    loggerService = module.get<LoggerService>(LoggerService);
    cacheService = module.get<CacheService>(CacheService);
    backgroundJobService = module.get<BackgroundJobService>(BackgroundJobService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create and save a notification', async () => {
      const notificationData = {
        userId: 'user-uuid',
        title: 'Test Notification',
        message: 'This is a test',
        type: 'system' as const,
        priority: 'normal' as const,
        channels: {
          in_app: true,
          email: false,
          sms: false,
          push: false,
        },
      };

      const createdNotification = { ...mockNotification, ...notificationData };
      mockNotificationRepository.create.mockReturnValue(createdNotification);
      mockNotificationRepository.save.mockResolvedValue(createdNotification);

      const result = await service.createNotification(notificationData);

      expect(result).toEqual(createdNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(notificationData);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(createdNotification);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Notification created',
        expect.objectContaining({
          notificationId: createdNotification.id,
          userId: notificationData.userId,
          type: notificationData.type,
        })
      );
    });

    it('should queue notification delivery job', async () => {
      const notificationData = {
        userId: 'user-uuid',
        title: 'Test Notification',
        message: 'This is a test',
        type: 'system' as const,
        priority: 'normal' as const,
        channels: {
          in_app: true,
          email: true,
          sms: false,
          push: false,
        },
      };

      const createdNotification = { ...mockNotification, ...notificationData };
      mockNotificationRepository.create.mockReturnValue(createdNotification);
      mockNotificationRepository.save.mockResolvedValue(createdNotification);
      mockBackgroundJobService.addNotificationJob.mockResolvedValue('job-123');

      await service.createNotification(notificationData);

      expect(mockBackgroundJobService.addNotificationJob).toHaveBeenCalledWith({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        channels: ['in_app', 'email'],
        priority: notificationData.priority,
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications for user', async () => {
      const mockNotifications = [mockNotification];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockNotifications, 1]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserNotifications('user-uuid', {
        page: 1,
        limit: 20,
        status: 'unread',
      });

      expect(result).toEqual({
        notifications: mockNotifications,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        unreadCount: undefined, // Would be calculated separately
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.userId = :userId', {
        userId: 'user-uuid',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.read = :read', {
        read: false,
      });
    });

    it('should apply status filter correctly', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUserNotifications('user-uuid', { status: 'read' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.read = :read', {
        read: true,
      });
    });

    it('should handle all status filter', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUserNotifications('user-uuid', { status: 'all' });

      // Should not add read filter for 'all' status
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('notification.read'),
        expect.any(Object)
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { ...mockNotification, read: false };
      mockNotificationRepository.findOne.mockResolvedValue(notification);
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.markAsRead('notification-uuid', 'user-uuid');

      expect(result).toBe(true);
      expect(mockNotificationRepository.update).toHaveBeenCalledWith('notification-uuid', {
        read: true,
        readAt: expect.any(Date),
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Notification marked as read',
        expect.objectContaining({
          notificationId: 'notification-uuid',
          userId: 'user-uuid',
        })
      );
    });

    it('should return false if notification not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      const result = await service.markAsRead('notification-uuid', 'user-uuid');

      expect(result).toBe(false);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Notification not found or access denied',
        expect.objectContaining({
          notificationId: 'notification-uuid',
          userId: 'user-uuid',
        })
      );
    });

    it('should return false if user does not own notification', async () => {
      const notification = { ...mockNotification, userId: 'different-user' };
      mockNotificationRepository.findOne.mockResolvedValue(notification);

      const result = await service.markAsRead('notification-uuid', 'user-uuid');

      expect(result).toBe(false);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification if user owns it', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteNotification('notification-uuid', 'user-uuid');

      expect(result).toBe(true);
      expect(mockNotificationRepository.delete).toHaveBeenCalledWith('notification-uuid');
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Notification deleted',
        expect.objectContaining({
          notificationId: 'notification-uuid',
          userId: 'user-uuid',
        })
      );
    });

    it('should return false if notification not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteNotification('notification-uuid', 'user-uuid');

      expect(result).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUnreadCount('user-uuid');

      expect(result).toBe(5);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.userId = :userId', {
        userId: 'user-uuid',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.read = :read', {
        read: false,
      });
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should delete expired notifications', async () => {
      const expiredNotification = {
        ...mockNotification,
        expiresAt: new Date(Date.now() - 86400000), // Expired 1 day ago
      };

      mockNotificationRepository.find.mockResolvedValue([expiredNotification]);
      mockNotificationRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.cleanupExpiredNotifications();

      expect(result).toBe(1);
      expect(mockNotificationRepository.delete).toHaveBeenCalledWith(expiredNotification.id);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Cleaned up 1 expired notifications',
        expect.any(Object)
      );
    });

    it('should not delete non-expired notifications', async () => {
      const validNotification = {
        ...mockNotification,
        expiresAt: new Date(Date.now() + 86400000), // Expires in 1 day
      };

      mockNotificationRepository.find.mockResolvedValue([validNotification]);

      const result = await service.cleanupExpiredNotifications();

      expect(result).toBe(0);
      expect(mockNotificationRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const mockStats = [
        { type: 'system', count: 10 },
        { type: 'achievement', count: 5 },
        { type: 'reminder', count: 3 },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStats),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getNotificationStats('user-uuid');

      expect(result).toEqual(mockStats);
    });
  });

  describe('bulkMarkAsRead', () => {
    it('should mark multiple notifications as read', async () => {
      const notificationIds = ['notif-1', 'notif-2', 'notif-3'];
      const notifications = notificationIds.map(id => ({
        ...mockNotification,
        id,
        userId: 'user-uuid',
        read: false,
      }));

      mockNotificationRepository.find.mockResolvedValue(notifications);
      mockNotificationRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.bulkMarkAsRead(notificationIds, 'user-uuid');

      expect(result).toBe(3);
      expect(mockNotificationRepository.update).toHaveBeenCalledTimes(3);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Bulk marked 3 notifications as read',
        expect.objectContaining({ userId: 'user-uuid' })
      );
    });

    it('should only mark notifications owned by user', async () => {
      const notificationIds = ['notif-1', 'notif-2'];
      const notifications = [
        { ...mockNotification, id: 'notif-1', userId: 'user-uuid' },
        { ...mockNotification, id: 'notif-2', userId: 'different-user' },
      ];

      mockNotificationRepository.find.mockResolvedValue(notifications);
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.bulkMarkAsRead(notificationIds, 'user-uuid');

      expect(result).toBe(1);
      expect(mockNotificationRepository.update).toHaveBeenCalledTimes(1);
      expect(mockNotificationRepository.update).toHaveBeenCalledWith('notif-1', expect.any(Object));
    });
  });
});