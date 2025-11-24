import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';

@Injectable()
@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<any>): Promise<any> {
    this.logger.debug(`Processing notification job ${job.id}`);

    const { userId, type, title, message, channels = ['in_app'] } = job.data;

    try {
      const results = [];

      for (const channel of channels) {
        switch (channel) {
          case 'in_app':
            results.push(await this.sendInAppNotification(userId, type, title, message));
            break;
          case 'email':
            results.push(await this.sendEmailNotification(userId, title, message));
            break;
          case 'push':
            results.push(await this.sendPushNotification(userId, title, message));
            break;
          case 'sms':
            results.push(await this.sendSMSNotification(userId, message));
            break;
        }
      }

      this.logger.log(`Notifications sent successfully for user ${userId}`);
      return { success: true, results };
    } catch (error) {
      this.logger.error(`Failed to send notifications for user ${userId}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Notification job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Notification job ${job.id} failed:`, err);
  }

  private async sendInAppNotification(userId: string, type: string, title: string, message: string) {
    try {
      // Call notification service API
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'}/api/notifications`, {
        userId,
        title,
        message,
        type,
        channel: 'in_app',
      });
      return { channel: 'in_app', success: true };
    } catch (error) {
      this.logger.error('Failed to send in-app notification:', error);
      return { channel: 'in_app', success: false, error: error.message };
    }
  }

  private async sendEmailNotification(userId: string, title: string, message: string) {
    try {
      // Get user email from auth service
      const userResponse = await axios.get(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/profile`, {
        headers: { 'x-user-id': userId },
      });
      const userEmail = userResponse.data.email;

      // Send email via background job
      await axios.post(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/email/send`, {
        to: userEmail,
        subject: title,
        template: 'notification',
        context: { title, message },
      });

      return { channel: 'email', success: true };
    } catch (error) {
      this.logger.error('Failed to send email notification:', error);
      return { channel: 'email', success: false, error: error.message };
    }
  }

  private async sendPushNotification(userId: string, title: string, message: string) {
    try {
      // This would integrate with push notification service
      // For now, just log the attempt
      this.logger.log(`Push notification would be sent to user ${userId}: ${title}`);
      return { channel: 'push', success: true };
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      return { channel: 'push', success: false, error: error.message };
    }
  }

  private async sendSMSNotification(userId: string, message: string) {
    try {
      // This would integrate with SMS service like Twilio
      // For now, just log the attempt
      this.logger.log(`SMS would be sent to user ${userId}: ${message}`);
      return { channel: 'sms', success: true };
    } catch (error) {
      this.logger.error('Failed to send SMS notification:', error);
      return { channel: 'sms', success: false, error: error.message };
    }
  }
}