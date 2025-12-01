import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './task.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getTasksByUser: jest.fn(),
    getOverdueTasks: jest.fn(),
    getTasksByPriority: jest.fn(),
    canStartTask: jest.fn(),
    getBlockedTasks: jest.fn(),
    getAvailableTasks: jest.fn(),
    addDependency: jest.fn(),
    removeDependency: jest.fn(),
    completeTask: jest.fn(),
    getRecurringTasks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      mockService.create.mockResolvedValue(mockTask);

      const result = await controller.create(mockTask);
      expect(result).toEqual(mockTask);
      expect(mockService.create).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks', async () => {
      mockService.findAll.mockResolvedValue([mockTask]);

      const result = await controller.findAll('user1');
      expect(result).toEqual([mockTask]);
    });
  });

  describe('findOne', () => {
    it('should return a task', async () => {
      mockService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      mockService.update.mockResolvedValue(mockTask);

      const result = await controller.update('1', { title: 'Updated' });
      expect(result).toEqual(mockTask);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('1');
      expect(mockService.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('canStartTask', () => {
    it('should check if task can start', async () => {
      mockService.canStartTask.mockResolvedValue(true);

      const result = await controller.canStartTask('1');
      expect(result).toBe(true);
    });
  });
});