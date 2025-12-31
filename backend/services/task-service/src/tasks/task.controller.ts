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
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus, TaskPriority } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: Task })
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.taskService.create(createTaskDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for the user' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully', type: [Task] })
  findAll(
    @Request() req,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options: any = {};
    if (status) options.status = status;
    if (priority) options.priority = priority;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    return this.taskService.findAll(req.user.userId, options);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiResponse({ status: 200, description: 'Overdue tasks retrieved successfully', type: [Task] })
  getOverdue(@Request() req) {
    return this.taskService.getOverdueTasks(req.user.userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming tasks' })
  @ApiResponse({ status: 200, description: 'Upcoming tasks retrieved successfully', type: [Task] })
  getUpcoming(@Request() req, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 7;
    return this.taskService.getUpcomingTasks(req.user.userId, daysNum);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get tasks within a date range' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully', type: [Task] })
  getByDateRange(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    return this.taskService.getTasksByDateRange(
      req.user.userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully', type: Task })
  findOne(@Param('id') id: string, @Request() req) {
    return this.taskService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: Task })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.taskService.update(id, updateTaskDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.taskService.remove(id, req.user.userId);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update tasks' })
  @ApiResponse({ status: 200, description: 'Tasks updated successfully', type: [Task] })
  bulkUpdate(
    @Body() body: { ids: string[]; updates: UpdateTaskDto },
    @Request() req,
  ) {
    return this.taskService.bulkUpdate(body.ids, body.updates, req.user.userId);
  }
}