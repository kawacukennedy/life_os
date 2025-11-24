import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Injectable()
export class BackgroundJobService {
  constructor(
    @InjectQueue("email") private emailQueue: Queue,
    @InjectQueue("notification") private notificationQueue: Queue,
    @InjectQueue("sync") private syncQueue: Queue,
  ) {}

  // Email jobs
  async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }) {
    await this.emailQueue.add("send-email", data, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });
  }

  // Notification jobs
  async addNotificationJob(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    channels?: string[];
  }) {
    await this.notificationQueue.add("send-notification", data);
  }

  // Data sync jobs
  async addSyncJob(data: { userId: string; service: string; action: string }) {
    await this.syncQueue.add("sync-data", data, {
      priority: 1, // High priority for sync jobs
    });
  }

  // Analytics jobs
  async addAnalyticsJob(data: {
    userId: string;
    event: string;
    properties: any;
  }) {
    await this.syncQueue.add("track-analytics", data, {
      delay: 5000, // Delay analytics to not block main flow
    });
  }
}
