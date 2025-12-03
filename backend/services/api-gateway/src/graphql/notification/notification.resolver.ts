import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { NotificationGraphQLService } from './notification.service';
import {
  Notification,
  UnreadCount,
  CreateNotificationResponse,
  BulkNotificationResponse,
  NotificationType,
  NotificationChannel
} from './notification.types';

@Resolver()
export class NotificationResolver {
  constructor(private notificationService: NotificationGraphQLService) {}

  @Query(() => [Notification])
  async getUserNotifications(
    @Args('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Notification[]> {
    return this.notificationService.getUserNotifications(userId, limit, offset);
  }

  @Query(() => UnreadCount)
  async getUnreadCount(@Args('userId') userId: string): Promise<UnreadCount> {
    return this.notificationService.getUnreadCount(userId);
  }

  @Mutation(() => CreateNotificationResponse)
  async createNotification(
    @Args('userId') userId: string,
    @Args('title') title: string,
    @Args('message') message: string,
    @Args('type', { type: () => NotificationType, nullable: true }) type?: NotificationType,
    @Args('channel', { type: () => NotificationChannel, nullable: true }) channel?: NotificationChannel,
    @Args('actionUrl', { nullable: true }) actionUrl?: string,
    @Args('metadata', { nullable: true }) metadata?: any,
  ): Promise<CreateNotificationResponse> {
    return this.notificationService.createNotification(
      userId,
      title,
      message,
      type,
      channel,
      actionUrl,
      metadata,
    );
  }

  @Mutation(() => Notification)
  async markAsRead(
    @Args('notificationId') notificationId: string,
    @Args('userId') userId: string,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Mutation(() => CreateNotificationResponse)
  async markAllAsRead(@Args('userId') userId: string): Promise<CreateNotificationResponse> {
    const result = await this.notificationService.markAllAsRead(userId);
    return {
      success: result.success,
      message: 'All notifications marked as read',
    };
  }

  @Mutation(() => CreateNotificationResponse)
  async deleteNotification(
    @Args('notificationId') notificationId: string,
    @Args('userId') userId: string,
  ): Promise<CreateNotificationResponse> {
    return this.notificationService.deleteNotification(notificationId, userId);
  }

  @Mutation(() => BulkNotificationResponse)
  async sendBulkNotification(
    @Args('userIds', { type: () => [String] }) userIds: string[],
    @Args('title') title: string,
    @Args('message') message: string,
    @Args('type', { type: () => NotificationType, nullable: true }) type?: NotificationType,
    @Args('channel', { type: () => NotificationChannel, nullable: true }) channel?: NotificationChannel,
  ): Promise<BulkNotificationResponse> {
    return this.notificationService.sendBulkNotification(
      userIds,
      title,
      message,
      type,
      channel,
    );
  }
}