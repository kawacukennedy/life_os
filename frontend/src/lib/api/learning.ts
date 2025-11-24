const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface Course {
  id: string;
  title: string;
  description?: string;
  category: string;
  totalLessons: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  completedLessons: number;
  progressPercent: number;
  lastLessonId?: string;
  lastAccessedAt?: string;
  startedAt: string;
  updatedAt: string;
}

export interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  totalTimeSpent: number;
  averageProgress: number;
}

export class LearningAPI {
  private static async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE}/api/learning${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async getCourses(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/courses${query}`);
  }

  static async getUserProgress(userId: string) {
    return this.request(`/progress?userId=${userId}`);
  }

  static async startCourse(userId: string, courseId: string) {
    return this.request(`/courses/${courseId}/start`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  static async updateProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    progressPercent: number,
  ) {
    return this.request('/progress', {
      method: 'PATCH',
      body: JSON.stringify({
        userId,
        courseId,
        lessonId,
        progressPercent,
      }),
    });
  }

  static async getRecommendations(userId: string) {
    return this.request(`/recommendations?userId=${userId}`);
  }

  static async getLearningStats(userId: string): Promise<LearningStats> {
    return this.request(`/stats?userId=${userId}`);
  }
}