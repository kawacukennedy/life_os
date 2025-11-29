import { offlineQueue } from './offline'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface DashboardTile {
  id: string;
  type: string;
  data: any;
}

export interface DashboardData {
  tiles: DashboardTile[];
  suggestions: string[];
}

export interface AggregatedDashboard {
  health: {
    averageHeartRate: number;
    totalSteps: number;
    averageSleepHours: number;
  };
  finance: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  };
  learning: {
    averageProgress: number;
    coursesCompleted: number;
  };
  notifications: {
    unreadCount: number;
  };
  suggestions: string[];
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  description?: string;
}

export interface CreateEventData {
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  location?: string;
  description?: string;
}

export class AuthAPI {
  private static async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE}/api/auth${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async getDashboard(): Promise<DashboardData> {
    return this.request('/dashboard');
  }

  static async getAggregatedDashboard(): Promise<AggregatedDashboard> {
    // Try cache first
    const cached = await offlineQueue.getCachedApiResponse('dashboard')
    if (cached) {
      return cached
    }

    // Call gateway aggregated dashboard
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json()

    // Cache the response
    await offlineQueue.cacheApiResponse('dashboard', 'dashboard', data)

    return data
  }

  static async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  static async register(userData: { email: string; password: string; fullName: string }) {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  }

  static async googleLogin() {
    window.location.href = `${API_BASE}/api/auth/google`;
  }

  static async getGoogleCalendarAuth() {
    window.location.href = `${API_BASE}/api/auth/google/calendar/auth`;
  }

  static async getCalendarEvents(): Promise<CalendarEvent[]> {
    return this.request('/google/calendar/events');
  }

  static async createCalendarEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    return this.request('/google/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  static async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/auth/upload/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Avatar upload failed');
    }

    return response.json();
  }

  static async deleteAvatar(): Promise<void> {
    return this.request('/upload/avatar', {
      method: 'DELETE',
    });
  }

  static async updateProfile(profileData: { fullName: string; email: string; timezone: string; language: string }) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  static async updatePreferences(preferences: { notifications: boolean; analytics: boolean; aiTraining: boolean }) {
    return this.request('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  static async completeOnboarding() {
    return this.request('/onboarding/complete', {
      method: 'POST',
    });
  }
}