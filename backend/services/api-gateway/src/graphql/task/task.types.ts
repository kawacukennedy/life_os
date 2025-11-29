import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field(() => Int)
  priority: number;

  @Field({ nullable: true })
  dueAt?: Date;

  @Field(() => Int, { nullable: true })
  durationMinutes?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TaskList {
  @Field(() => [Task])
  tasks: Task[];

  @Field(() => Int)
  totalCount: number;
}