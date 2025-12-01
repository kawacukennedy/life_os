import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class HealthSummary {
  @Field()
  userId: string;

  @Field(() => Float, { nullable: true })
  averageHeartRate?: number;

  @Field(() => Float, { nullable: true })
  averageSteps?: number;

  @Field(() => Float, { nullable: true })
  averageSleepHours?: number;

  @Field()
  lastUpdated: Date;
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