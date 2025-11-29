import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel } from './notification.entity';
import { PushSubscription } from './push-subscription.entity';
import { NotificationGateway } from './notification.gateway';
import * as nodemailer from 'nodemailer';
import * as webpush from 'web-push';
import * as twilio from 'twilio';

@Injectable()
export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(PushSubscription)
    private pushSubscriptionRepository: Repository<PushSubscription>,
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

    // Initialize web-push
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'test@example.com'),
      process.env.VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || '',
    );

    // Initialize Twilio
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
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
    } else if (channel === NotificationChannel.SMS) {
      await this.sendSMSNotification(savedNotification);
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
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { userId: notification.userId, isActive: true },
    });

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: notification.actionUrl || '/',
        notificationId: notification.id,
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map(subscription =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        ),
      ),
    );

    // Handle failed subscriptions (expired, etc.)
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error('Push notification failed:', result.reason);
        // In production, mark subscription as inactive if it's expired
        if (result.reason.statusCode === 410) {
          this.pushSubscriptionRepository.update(subscriptions[index].id, {
            isActive: false,
          });
        }
      }
    });
  }

  private async sendSMSNotification(notification: Notification): Promise<void> {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('Twilio phone number not configured, skipping SMS notification');
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: `${notification.title}: ${notification.message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.metadata?.phoneNumber || '+1234567890', // In real app, get from user profile
      });
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  // Push subscription management
  async savePushSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ): Promise<PushSubscription> {
    // Check if subscription already exists
    const existing = await this.pushSubscriptionRepository.findOne({
      where: { userId, endpoint: subscription.endpoint },
    });

    if (existing) {
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      existing.isActive = true;
      existing.userAgent = userAgent;
      return this.pushSubscriptionRepository.save(existing);
    }

    const pushSubscription = this.pushSubscriptionRepository.create({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    });

    return this.pushSubscriptionRepository.save(pushSubscription);
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.update(
      { userId, endpoint },
      { isActive: false },
    );
  }

  async sendScheduledNotification(
    userId: string,
    title: string,
    message: string,
    scheduledTime: Date,
    channel: NotificationChannel = NotificationChannel.PUSH,
  ): Promise<Notification> {
    // In production, use a job queue like Bull
    const delay = scheduledTime.getTime() - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        this.createNotification(userId, title, message, NotificationType.INFO, channel);
      }, delay);
    }

    // Create the notification record now
    return this.createNotification(userId, title, message, NotificationType.INFO, channel);
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
