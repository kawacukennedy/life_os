import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class HealthSummary {
  @Field()
  userId: string;

  @Field()
  date: string;

  @Field(() => Float)
  steps: number;

  @Field(() => Float)
  heartRate: number;

  @Field(() => Float)
  sleepHours: number;

  @Field(() => Float)
  calories: number;

  @Field(() => Float)
  activeMinutes: number;

  @Field(() => [Vital])
  vitals: Vital[];

  @Field(() => [HealthAnomaly])
  anomalies: HealthAnomaly[];
}

@ObjectType()
export class HealthAnomaly {
  @Field()
  id: string;

  @Field()
  vitalType: string;

  @Field()
  severity: string;

  @Field()
  message: string;

  @Field()
  timestamp: string;
}

@ObjectType()
export class HealthInsight {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  actionable: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class HealthInsights {
  @Field(() => [HealthInsight])
  insights: HealthInsight[];
}

@ObjectType()
export class Vital {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  type: string;

  @Field(() => Float)
  value: number;

  @Field()
  unit: string;

  @Field()
  timestamp: Date;

  @Field({ nullable: true })
  source?: string;
}