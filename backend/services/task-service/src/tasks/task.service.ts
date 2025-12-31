import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task, TaskStatus, TaskPriority } from "./task.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
      id: uuidv4(),
    });

    return this.tasksRepository.save(task);
  }

  async findAll(userId: string, options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    limit?: number;
    offset?: number;
  }): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .orderBy('task.createdAt', 'DESC');

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

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Handle status changes
    if (updateTaskDto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateTaskDto.completedAt = new Date();
    } else if (updateTaskDto.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
      updateTaskDto.completedAt = null;
    }

    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.tasksRepository.remove(task);
  }

  async getTasksByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Task[]> {
    return this.tasksRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('task.dueAt', 'ASC')
      .getMany();
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    return this.tasksRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.status != :completed', { completed: TaskStatus.COMPLETED })
      .andWhere('task.dueAt < :now', { now: new Date() })
      .orderBy('task.dueAt', 'ASC')
      .getMany();
  }

  async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.tasksRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.status != :completed', { completed: TaskStatus.COMPLETED })
      .andWhere('task.dueAt BETWEEN :now AND :futureDate', { now, futureDate })
      .orderBy('task.dueAt', 'ASC')
      .getMany();
  }

  async bulkUpdate(ids: string[], updateData: Partial<UpdateTaskDto>, userId: string): Promise<Task[]> {
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .where('task.id IN (:...ids)', { ids })
      .andWhere('task.userId = :userId', { userId })
      .getMany();

    if (tasks.length !== ids.length) {
      throw new BadRequestException('Some tasks not found or not owned by user');
    }

    const updatedTasks = tasks.map(task => {
      Object.assign(task, updateData);
      return task;
    });

    return this.tasksRepository.save(updatedTasks);
  }
}