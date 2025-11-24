import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel } from './notification.entity';
import { NotificationGateway } from './notification.gateway';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationGateway: NotificationGateway,
  ) {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    actionUrl?: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      message,
      type,
      channel,
      actionUrl,
      metadata,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Send real-time notification via WebSocket
    await this.notificationGateway.sendNotificationToUser(userId, {
      id: savedNotification.id,
      title: savedNotification.title,
      message: savedNotification.message,
      type: savedNotification.type,
      channel: savedNotification.channel,
      actionUrl: savedNotification.actionUrl,
      createdAt: savedNotification.createdAt,
    });

    // Send notification based on channel
    if (channel === NotificationChannel.EMAIL) {
      await this.sendEmailNotification(savedNotification);
    } else if (channel === NotificationChannel.PUSH) {
      await this.sendPushNotification(savedNotification);
    }

    return savedNotification;
  }

  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    return this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId AND isRead = :isRead', { userId, isRead: false })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId AND notification.isRead = :isRead', {
        userId,
        isRead: false,
      })
      .getCount();
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationsRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new Error('Notification not found');
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials not configured, skipping email notification');
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: notification.metadata?.email || 'user@example.com', // In real app, get from user profile
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // In a real implementation, you would integrate with a push notification service
    // like Firebase Cloud Messaging, OneSignal, or similar
    console.log('Sending push notification:', {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
    });

    // Placeholder for push notification implementation
    // This would typically involve calling a push service API
  }

  async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ): Promise<Notification[]> {
    const notifications = userIds.map(userId =>
      this.createNotification(userId, title, message, type, channel)
    );

    return Promise.all(notifications);
  }
}
