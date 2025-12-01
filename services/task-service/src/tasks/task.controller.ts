import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: Partial<Task>): Promise<Task> {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  findAll(
    @Query('userId') userId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Task[]> {
    return this.taskService.findAll(userId, { status, priority, limit: limit ? +limit : undefined, offset: offset ? +offset : undefined });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: Partial<Task>): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(id);
  }

  @Get('user/:userId')
  getTasksByUser(@Param('userId') userId: string): Promise<Task[]> {
    return this.taskService.getTasksByUser(userId);
  }

  @Get('user/:userId/overdue')
  getOverdueTasks(@Param('userId') userId: string): Promise<Task[]> {
    return this.taskService.getOverdueTasks(userId);
  }

  @Get('user/:userId/priority/:priority')
  getTasksByPriority(@Param('userId') userId: string, @Param('priority') priority: TaskPriority): Promise<Task[]> {
    return this.taskService.getTasksByPriority(userId, priority);
  }
}