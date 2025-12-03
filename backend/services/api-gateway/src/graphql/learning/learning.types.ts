import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Course {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => Float)
  progress: number;

  @Field(() => Int)
  totalModules: number;

  @Field(() => Int)
  completedModules: number;

  @Field(() => Int)
  estimatedTime: number;

  @Field()
  category: string;

  @Field()
  difficulty: string;

  @Field()
  lastAccessedAt: string;
}

@ObjectType()
export class Achievement {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  earnedAt: string;

  @Field()
  type: string;
}

@ObjectType()
export class LearningProgress {
  @Field()
  userId: string;

  @Field(() => Int)
  totalCourses: number;

  @Field(() => Int)
  completedCourses: number;

  @Field(() => Int)
  totalTimeSpent: number;

  @Field(() => Int)
  currentStreak: number;

  @Field(() => Float)
  averageProgress: number;

  @Field(() => [Course])
  courses: Course[];

  @Field(() => [Achievement])
  recentAchievements: Achievement[];
}

@ObjectType()
export class LearningRecommendation {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field()
  difficulty: string;

  @Field(() => Int)
  estimatedTime: number;

  @Field()
  reason: string;

  @Field()
  priority: string;
}

@ObjectType()
export class LearningRecommendations {
  @Field(() => [LearningRecommendation])
  recommendations: LearningRecommendation[];
}