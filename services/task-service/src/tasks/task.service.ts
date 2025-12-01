import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
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

    return query.getMany();
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
    await this.taskRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { userId },
      relations: ['subtasks'],
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
}