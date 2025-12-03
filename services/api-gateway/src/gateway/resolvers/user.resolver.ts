import { Resolver, Query, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class User {
  id: string;
  email: string;
  name?: string;
  locale: string;
  timezone: string;
}

export class UserProfile {
  user: User;
  profile: {
    displayName?: string;
    bio?: string;
    preferences?: any;
    connectedIntegrations?: any[];
  };
  connectedIntegrations: any[];
}

@Resolver(() => User)
export class UserResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => UserProfile)
  async userProfile(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('user');
    return this.gatewayService.proxyToService(`${serviceUrl}/users/${userId}/profile`, 'GET');
  }
}