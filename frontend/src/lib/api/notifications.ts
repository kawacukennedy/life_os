const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channel: 'in_app' | 'email' | 'push' | 'sms';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export class NotificationsAPI {
  private static async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE}/api/notifications${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type?: Notification['type'];
    channel?: Notification['channel'];
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  static async getUserNotifications(
    userId: string,
    limit?: number,
    offset?: number,
  ) {
    const params = new URLSearchParams({
      userId,
      ...(limit && { limit: limit.toString() }),
      ...(offset && { offset: offset.toString() }),
    });
    return this.request(`?${params}`);
  }

  static async getUnreadCount(userId: string) {
    const result = await this.request(`/unread-count?userId=${userId}`);
    return result.count;
  }

  static async markAsRead(notificationId: string, userId: string) {
    return this.request(`/${notificationId}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    });
  }

  static async markAllAsRead(userId: string) {
    return this.request('/mark-all-read', {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    });
  }

  static async deleteNotification(notificationId: string, userId: string) {
    return this.request(`/${notificationId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }

  static async sendBulkNotification(notifications: {
    userIds: string[];
    title: string;
    message: string;
    type?: Notification['type'];
    channel?: Notification['channel'];
  }) {
    return this.request('/bulk', {
      method: 'POST',
      body: JSON.stringify(notifications),
    });
  }

  static async getPreferences() {
    return this.request('/preferences');
  }

  static async updatePreferences(preferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    health?: boolean;
    finance?: boolean;
    learning?: boolean;
  }) {
    return this.request('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }
}