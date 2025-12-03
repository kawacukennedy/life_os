import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotificationType, NotificationChannel } from './notification.types';

@Injectable()
export class NotificationGraphQLService {
  constructor(private httpService: HttpService) {}

  async getUserNotifications(userId: string, limit?: number, offset?: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications`, {
          params: { userId, limit, offset },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch notifications');
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications/unread-count`, {
          params: { userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch unread count');
    }
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type?: NotificationType,
    channel?: NotificationChannel,
    actionUrl?: string,
    metadata?: any,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications`, {
          userId,
          title,
          message,
          type,
          channel,
          actionUrl,
          metadata,
        })
      );
      return {
        success: true,
        message: 'Notification created successfully',
        notification: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create notification',
      };
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications/${notificationId}/read`, {
          userId,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications/mark-all-read`, {
          userId,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      await firstValueFrom(
        this.httpService.delete(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications/${notificationId}`, {
          data: { userId },
        })
      );
      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete notification',
      };
    }
  }

  async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type?: NotificationType,
    channel?: NotificationChannel,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'}/notifications/bulk`, {
          userIds,
          title,
          message,
          type,
          channel,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to send bulk notifications');
    }
  }
}