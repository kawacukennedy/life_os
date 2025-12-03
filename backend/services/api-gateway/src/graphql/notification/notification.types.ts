import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  REMINDER = 'reminder',
  ACHIEVEMENT = 'achievement',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

registerEnumType(NotificationChannel, {
  name: 'NotificationChannel',
});

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field(() => NotificationChannel)
  channel: NotificationChannel;

  @Field({ nullable: true })
  actionUrl?: string;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  isRead: boolean;

  @Field({ nullable: true })
  readAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UnreadCount {
  @Field(() => Int)
  count: number;
}

@ObjectType()
export class CreateNotificationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Notification, { nullable: true })
  notification?: Notification;
}

@ObjectType()
export class BulkNotificationResponse {
  @Field()
  success: boolean;

  @Field(() => Int)
  sentCount: number;

  @Field(() => Int)
  failedCount: number;
}