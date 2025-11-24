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
}