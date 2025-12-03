import { Resolver, Query, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class Suggestion {
  id: string;
  type: string;
  confidence: number;
  payload: string;
  createdAt: string;
}

export class SuggestionsResponse {
  suggestions: Suggestion[];
  modelMeta: any;
}

@Resolver()
export class AIResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => SuggestionsResponse)
  async getSuggestions(
    @Args('userId') userId: string,
    @Args('context') context: string,
    @Args('maxResults', { nullable: true, type: () => Number }) maxResults?: number,
  ) {
    const serviceUrl = this.gatewayService.getServiceUrl('ai');
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    queryParams.append('context', context);
    if (maxResults) queryParams.append('maxResults', maxResults.toString());

    return this.gatewayService.proxyToService(
      `${serviceUrl}/ai/suggest?${queryParams.toString()}`,
      'GET'
    );
  }
}