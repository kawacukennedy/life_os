import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

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