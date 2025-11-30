import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { Task, TaskList } from './task.types';
import { TaskService } from './task.service';

@Resolver(() => Task)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @Query(() => TaskList)
  async tasks(
    @Args('userId') userId: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('limit', { nullable: true, type: () => Number }) limit?: number,
    @Args('offset', { nullable: true, type: () => Number }) offset?: number,
    @Context() context: any,
  ): Promise<TaskList> {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.taskService.getTasks(userId, { status, limit, offset });
  }

  @Query(() => Task)
  async task(@Args('id') id: string, @Context() context: any): Promise<Task> {
    // TODO: Add authorization check for task ownership
    return this.taskService.getTask(id);
  }

  @Mutation(() => Task)
  async createTask(
    @Args('userId') userId: string,
    @Args('title') title: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('priority', { nullable: true, type: () => Number }) priority?: number,
    @Args('dueAt', { nullable: true }) dueAt?: Date,
    @Args('durationMinutes', { nullable: true, type: () => Number }) durationMinutes?: number,
    @Context() context: any,
  ): Promise<Task> {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.taskService.createTask(userId, {
      title,
      description,
      priority,
      dueAt,
      durationMinutes,
    });
  }

  @Mutation(() => Task)
  async updateTask(
    @Args('id') id: string,
    @Args('title', { nullable: true }) title?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('priority', { nullable: true, type: () => Number }) priority?: number,
    @Context() context: any,
  ): Promise<Task> {
    // TODO: Add authorization check for task ownership
    return this.taskService.updateTask(id, { title, status, priority });
  }

  @Mutation(() => Boolean)
  async deleteTask(@Args('id') id: string, @Context() context: any): Promise<boolean> {
    // TODO: Add authorization check for task ownership
    return this.taskService.deleteTask(id);
  }
}