import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './task.entity';

describe('TaskService', () => {
  let service: TaskService;
  let repository: Repository<Task>;

  const mockTask: Task = {
    id: '1',
    userId: 'user1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueAt: new Date(),
    durationMinutes: 60,
    isRecurring: false,
    dependencies: [],
    tags: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockTask]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(mockTask);
      expect(result).toEqual(mockTask);
      expect(mockRepository.create).toHaveBeenCalledWith(mockTask);
      expect(mockRepository.save).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks for user', async () => {
      const result = await service.findAll('user1');
      expect(result).toEqual([mockTask]);
    });

    it('should filter by status', async () => {
      await service.findAll('user1', { status: TaskStatus.PENDING });
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('1');
      expect(result).toEqual(mockTask);
    });

    it('should throw error if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow('Task not found');
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('1', { title: 'Updated Title' });
      expect(mockRepository.update).toHaveBeenCalledWith('1', { title: 'Updated Title' });
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error if task not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('1')).rejects.toThrow('Task not found');
    });
  });

  describe('canStartTask', () => {
    it('should return true if no dependencies', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockTask, dependencies: [] });

      const result = await service.canStartTask('1');
      expect(result).toBe(true);
    });

    it('should return false if dependencies not completed', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockTask, dependencies: ['dep1'] });
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ status: TaskStatus.PENDING }]),
      });

      const result = await service.canStartTask('1');
      expect(result).toBe(false);
    });
  });
});