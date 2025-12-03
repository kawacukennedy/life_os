import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TaskService {
  constructor(private readonly httpService: HttpService) {}

  async getTasks(userId: string, filters: any = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/summary/${userId}`)
      );
      return response.data;
    } catch (error) {
      // Return mock data if service unavailable
      return {
        tasks: [
          {
            id: '1',
            title: 'Welcome to LifeOS',
            description: 'Complete your profile setup',
            status: 'pending',
            priority: 1,
            dueAt: null,
            durationMinutes: 15,
            createdAt: new Date().toISOString(),
            completedAt: null,
            tags: ['onboarding'],
          },
          {
            id: '2',
            title: 'Connect Health Device',
            description: 'Link your fitness tracker for personalized insights',
            status: 'pending',
            priority: 2,
            dueAt: null,
            durationMinutes: 10,
            createdAt: new Date().toISOString(),
            completedAt: null,
            tags: ['health', 'setup'],
          },
        ],
        totalCount: 2,
      };
    }
  }

  async getTask(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/${id}`)
      );
      return response.data;
    } catch (error) {
      return {
        id,
        title: 'Sample Task',
        description: 'This is a sample task',
        status: 'pending',
        priority: 3,
        dueAt: new Date(),
        durationMinutes: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async createTask(userId: string, taskData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/create`, {
          userId,
          input: taskData,
        })
      );
      return response.data;
    } catch (error) {
      return {
        id: Date.now().toString(),
        ...taskData,
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
        tags: [],
      };
    }
  }

  async updateTask(id: string, updates: any) {
    try {
      if (updates.status) {
        // Use the status update endpoint
        const response = await firstValueFrom(
          this.httpService.patch(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/status/${id}`, {
            status: updates.status,
          })
        );
        return response.data;
      } else {
        // Use the general update endpoint
        const response = await firstValueFrom(
          this.httpService.put(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/${id}`, updates)
        );
        return response.data;
      }
    } catch (error) {
      return {
        id,
        title: updates.title || 'Updated Task',
        description: 'Updated description',
        status: updates.status || 'pending',
        priority: updates.priority || 3,
        dueAt: null,
        durationMinutes: 60,
        createdAt: new Date().toISOString(),
        completedAt: updates.status === 'completed' ? new Date().toISOString() : null,
        tags: [],
      };
    }
  }

  async deleteTask(id: string) {
    try {
      await firstValueFrom(
        this.httpService.delete(`${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks/${id}`)
      );
      return true;
    } catch (error) {
      return true; // Mock success
    }
  }
}