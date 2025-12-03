import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Transaction {
  @Field()
  id: string;

  @Field()
  description: string;

  @Field(() => Float)
  amount: number;

  @Field()
  category: string;

  @Field()
  date: string;

  @Field()
  type: string;
}

@ObjectType()
export class BudgetAlert {
  @Field()
  id: string;

  @Field()
  category: string;

  @Field(() => Float)
  budgetAmount: number;

  @Field(() => Float)
  spentAmount: number;

  @Field(() => Float)
  percentage: number;

  @Field()
  message: string;
}

@ObjectType()
export class CategorySpending {
  @Field()
  category: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class FinanceSummary {
  @Field()
  userId: string;

  @Field(() => Float)
  totalBalance: number;

  @Field(() => Float)
  monthlyIncome: number;

  @Field(() => Float)
  monthlyExpenses: number;

  @Field(() => Float)
  savingsRate: number;

  @Field(() => [CategorySpending])
  topCategories: CategorySpending[];

  @Field(() => [Transaction])
  recentTransactions: Transaction[];

  @Field(() => [BudgetAlert])
  budgetAlerts: BudgetAlert[];
}

@ObjectType()
export class FinanceInsight {
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
export class FinanceInsights {
  @Field(() => [FinanceInsight])
  insights: FinanceInsight[];
}