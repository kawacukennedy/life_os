import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationType, NotificationChannel } from './notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(
    @Body() body: {
      userId: string;
      title: string;
      message: string;
      type?: NotificationType;
      channel?: NotificationChannel;
      actionUrl?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.notificationService.createNotification(
      body.userId,
      body.title,
      body.message,
      body.type,
      body.channel,
      body.actionUrl,
      body.metadata,
    );
  }

  @Get()
  async getUserNotifications(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.getUserNotifications(userId, limit, offset);
  }

  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @Body('userId') userId: string,
  ) {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Body('userId') userId: string) {
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
    @Body('userId') userId: string,
  ) {
    await this.notificationService.deleteNotification(notificationId, userId);
    return { success: true };
  }

  @Post('bulk')
  async sendBulkNotification(
    @Body() body: {
      userIds: string[];
      title: string;
      message: string;
      type?: NotificationType;
      channel?: NotificationChannel;
    },
  ) {
    return this.notificationService.sendBulkNotification(
      body.userIds,
      body.title,
      body.message,
      body.type,
      body.channel,
    );
  }

  // Push subscription management
  @Post('push-subscription')
  async savePushSubscription(
    @Body() body: {
      userId: string;
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      userAgent?: string;
    },
  ) {
    return this.notificationService.savePushSubscription(
      body.userId,
      body.subscription,
      body.userAgent,
    );
  }

  @Delete('push-subscription')
  async removePushSubscription(
    @Body() body: { userId: string; endpoint: string },
  ) {
    await this.notificationService.removePushSubscription(body.userId, body.endpoint);
    return { success: true };
  }

  // Scheduled notifications
  @Post('scheduled')
  async sendScheduledNotification(
    @Body() body: {
      userId: string;
      title: string;
      message: string;
      scheduledTime: string;
      channel?: NotificationChannel;
    },
  ) {
    return this.notificationService.sendScheduledNotification(
      body.userId,
      body.title,
      body.message,
      new Date(body.scheduledTime),
      body.channel,
    );
  }
}
