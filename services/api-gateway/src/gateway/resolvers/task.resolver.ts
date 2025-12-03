import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueAt?: string;
  durationMinutes?: number;
  isRecurring: boolean;
  recurrenceType?: string;
  tags?: string[];
  createdAt: string;
}

export class CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  priority?: string;
  dueAt?: string;
  durationMinutes?: number;
  tags?: string[];
}

export class UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueAt?: string;
  durationMinutes?: number;
  tags?: string[];
}

@Resolver(() => Task)
export class TaskResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => [Task])
  async tasks(
    @Args('userId') userId: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
  ) {
    const serviceUrl = this.gatewayService.getServiceUrl('task');
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());

    return this.gatewayService.proxyToService(
      `${serviceUrl}/tasks?${queryParams.toString()}`,
      'GET'
    );
  }

  @Query(() => Task)
  async task(@Args('id') id: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('task');
    return this.gatewayService.proxyToService(`${serviceUrl}/tasks/${id}`, 'GET');
  }

  @Mutation(() => Task)
  async createTask(@Args('input') input: CreateTaskInput) {
    const serviceUrl = this.gatewayService.getServiceUrl('task');
    return this.gatewayService.proxyToService(`${serviceUrl}/tasks`, 'POST', input);
  }

  @Mutation(() => Task)
  async updateTask(@Args('id') id: string, @Args('input') input: UpdateTaskInput) {
    const serviceUrl = this.gatewayService.getServiceUrl('task');
    return this.gatewayService.proxyToService(`${serviceUrl}/tasks/${id}`, 'PATCH', input);
  }

  @Mutation(() => Boolean)
  async deleteTask(@Args('id') id: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('task');
    await this.gatewayService.proxyToService(`${serviceUrl}/tasks/${id}`, 'DELETE');
    return true;
  }
}