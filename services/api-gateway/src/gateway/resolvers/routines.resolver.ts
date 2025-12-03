import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  triggers: string[];
  actions: any[];
  isActive: boolean;
  schedule?: any;
  createdAt: string;
}

export class CreateRoutineInput {
  userId: string;
  name: string;
  description?: string;
  triggers: string[];
  actions: any[];
  schedule?: any;
}

@Resolver(() => Routine)
export class RoutinesResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => [Routine])
  async routines(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('routines');
    return this.gatewayService.proxyToService(`${serviceUrl}/routines/${userId}`, 'GET');
  }

  @Mutation(() => Routine)
  async createRoutine(@Args('input') input: CreateRoutineInput) {
    const serviceUrl = this.gatewayService.getServiceUrl('routines');
    return this.gatewayService.proxyToService(`${serviceUrl}/routines`, 'POST', input);
  }

  @Mutation(() => Routine)
  async updateRoutine(@Args('id') id: string, @Args('input') input: Partial<CreateRoutineInput>) {
    const serviceUrl = this.gatewayService.getServiceUrl('routines');
    return this.gatewayService.proxyToService(`${serviceUrl}/routines/${id}`, 'PATCH', input);
  }

  @Mutation(() => Boolean)
  async deleteRoutine(@Args('id') id: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('routines');
    await this.gatewayService.proxyToService(`${serviceUrl}/routines/${id}`, 'DELETE');
    return true;
  }

  @Mutation(() => Boolean)
  async executeRoutine(@Args('id') id: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('routines');
    await this.gatewayService.proxyToService(`${serviceUrl}/routines/${id}/execute`, 'POST');
    return true;
  }
}