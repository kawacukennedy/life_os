import { ObjectType, Field, ID, Float, InputType } from '@nestjs/graphql';

@ObjectType()
export class AISuggestion {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field(() => Float)
  confidence: number;

  @Field()
  payload: string; // JSON string

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AIRecommendation {
  @Field(() => [AISuggestion])
  suggestions: AISuggestion[];

  @Field()
  modelMeta: string; // JSON string
}

@ObjectType()
export class OptimizedTask {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  suggestedTime?: string;

  @Field(() => Float, { nullable: true })
  priority?: number;
}

@ObjectType()
export class ScheduleOptimization {
  @Field(() => [OptimizedTask])
  optimizedTasks: OptimizedTask[];

  @Field()
  reasoning: string;

  @Field()
  modelMeta: string;
}

@ObjectType()
export class Recommendation {
  @Field(() => ID)
  id: string;

  @Field()
  category: string;

  @Field()
  priority: string;

  @Field()
  advice: string;

  @Field()
  actionable: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PersonalizedRecommendations {
  @Field(() => [Recommendation])
  recommendations: Recommendation[];

  @Field()
  modelMeta: string;
}

@ObjectType()
export class ChatResponse {
  @Field()
  message: string;

  @Field()
  conversationId: string;

  @Field()
  timestamp: Date;
}

@InputType()
export class TaskInput {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => Float, { nullable: true })
  priority?: number;

  @Field({ nullable: true })
  dueAt?: Date;
}