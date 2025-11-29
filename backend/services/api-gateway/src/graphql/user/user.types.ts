import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  locale: string;

  @Field()
  timezone: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UserProfile {
  @Field(() => User)
  user: User;

  @Field(() => [Integration])
  connectedIntegrations: Integration[];
}

@ObjectType()
export class Integration {
  @Field(() => ID)
  id: string;

  @Field()
  provider: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}