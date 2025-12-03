import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class SocialConnection {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  avatar: string;

  @Field(() => [String])
  mutualInterests: string[];

  @Field(() => Float)
  connectionStrength: number;

  @Field()
  lastInteraction: string;

  @Field(() => [String])
  sharedGoals: string[];

  @Field()
  status: string;
}

@ObjectType()
export class ConnectionRecommendation {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  avatar: string;

  @Field()
  reason: string;

  @Field(() => Int)
  mutualConnections: number;

  @Field(() => [String])
  sharedInterests: string[];
}

@ObjectType()
export class SocialConnections {
  @Field(() => [SocialConnection])
  connections: SocialConnection[];

  @Field(() => [ConnectionRecommendation])
  recommendations: ConnectionRecommendation[];
}

@ObjectType()
export class SharedGoal {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [String])
  participants: string[];

  @Field(() => Float)
  progress: number;

  @Field()
  deadline: string;

  @Field()
  category: string;
}

@ObjectType()
export class SharedGoals {
  @Field(() => [SharedGoal])
  goals: SharedGoal[];
}