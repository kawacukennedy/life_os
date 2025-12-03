import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Task, TaskStatus, TaskPriority, RecurrenceType } from './task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(taskData);
    return this.taskRepository.save(task);
  }

  async findAll(userId: string, options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    limit?: number;
    offset?: number;
  }): Promise<Task[]> {
    const cacheKey = `tasks:${userId}:${JSON.stringify(options)}`;

    // Try to get from cache first
    const cachedTasks = await this.cacheManager.get<Task[]>(cacheKey);
    if (cachedTasks) {
      return cachedTasks;
    }

    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    if (options?.status) {
      query.andWhere('task.status = :status', { status: options.status });
    }

    if (options?.priority) {
      query.andWhere('task.priority = :priority', { priority: options.priority });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy('task.priority', 'DESC')
         .addOrderBy('task.dueAt', 'ASC')
         .addOrderBy('task.createdAt', 'DESC');

    const tasks = await query.getMany();

    // Cache the result for 5 minutes
    await this.cacheManager.set(cacheKey, tasks, 300000);

    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['subtasks', 'parentTask'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, updateData: Partial<Task>): Promise<Task> {
    const task = await this.findOne(id);
    await this.taskRepository.update(id, updateData);

    // Invalidate cache for this user
    await this.invalidateUserCache(task.userId);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  async getTasks(userId: string) {
    const tasks = await this.taskRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() || null,
        durationMinutes: task.durationMinutes,
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString() || null,
        tags: task.tags || [],
      })),
      totalCount: tasks.length,
    };
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    return this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueAt < :now', { now: new Date() })
      .andWhere('task.status != :completed', { completed: TaskStatus.COMPLETED })
      .orderBy('task.dueAt', 'ASC')
      .getMany();
  }

  async getTasksByPriority(userId: string, priority: TaskPriority): Promise<Task[]> {
    return this.taskRepository.find({
      where: { userId, priority },
      order: { dueAt: 'ASC' },
    });
  }

  async canStartTask(taskId: string): Promise<boolean> {
    const task = await this.findOne(taskId);
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    const dependencyTasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.id IN (:...ids)', { ids: task.dependencies })
      .getMany();

    return dependencyTasks.every(dep => dep.status === TaskStatus.COMPLETED);
  }

  async getBlockedTasks(userId: string): Promise<Task[]> {
    const tasks = await this.getTasksByUser(userId);
    const blockedTasks: Task[] = [];

    for (const task of tasks) {
      if (task.status !== TaskStatus.COMPLETED && !(await this.canStartTask(task.id))) {
        blockedTasks.push(task);
      }
    }

    return blockedTasks;
  }

  async getAvailableTasks(userId: string): Promise<Task[]> {
    const tasks = await this.getTasksByUser(userId);
    const availableTasks: Task[] = [];

    for (const task of tasks) {
      if (task.status !== TaskStatus.COMPLETED && await this.canStartTask(task.id)) {
        availableTasks.push(task);
      }
    }

    return availableTasks;
  }

  async addDependency(taskId: string, dependencyId: string): Promise<Task> {
    const task = await this.findOne(taskId);
    if (!task.dependencies) {
      task.dependencies = [];
    }
    if (!task.dependencies.includes(dependencyId)) {
      task.dependencies.push(dependencyId);
    }
    return this.taskRepository.save(task);
  }

  async removeDependency(taskId: string, dependencyId: string): Promise<Task> {
    const task = await this.findOne(taskId);
    if (task.dependencies) {
      task.dependencies = task.dependencies.filter(id => id !== dependencyId);
    }
    return this.taskRepository.save(task);
  }

  async completeTask(taskId: string): Promise<Task> {
    const task = await this.findOne(taskId);
    task.status = TaskStatus.COMPLETED;

    const updatedTask = await this.taskRepository.save(task);

    // If recurring, create next instance
    if (task.isRecurring && (!task.recurrenceEndAt || task.dueAt < task.recurrenceEndAt)) {
      await this.createNextRecurringTask(task);
    }

    return updatedTask;
  }

  private async createNextRecurringTask(task: Task): Promise<void> {
    const nextDueAt = this.calculateNextDueDate(task.dueAt, task.recurrenceType, task.recurrenceInterval);

    if (!nextDueAt || (task.recurrenceEndAt && nextDueAt > task.recurrenceEndAt)) {
      return;
    }

    const nextTask = this.taskRepository.create({
      userId: task.userId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueAt: nextDueAt,
      durationMinutes: task.durationMinutes,
      isRecurring: true,
      recurrenceType: task.recurrenceType,
      recurrenceInterval: task.recurrenceInterval,
      recurrenceEndAt: task.recurrenceEndAt,
      tags: task.tags,
      metadata: task.metadata,
    });

    await this.taskRepository.save(nextTask);
  }

  private calculateNextDueDate(currentDueAt: Date, type: RecurrenceType, interval: number): Date | null {
    const nextDate = new Date(currentDueAt);

    switch (type) {
      case RecurrenceType.DAILY:
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case RecurrenceType.WEEKLY:
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;
      case RecurrenceType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case RecurrenceType.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
      default:
        return null;
    }

    return nextDate;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    // Invalidate all cache keys for this user
    // This is a simple implementation - in production, you might want to use Redis key patterns
    await this.cacheManager.reset();
  }

  async getRecurringTasks(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { userId, isRecurring: true },
      order: { dueAt: 'ASC' },
    });
  }
}