import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GatewayModule } from './gateway/gateway.module';
import { UserModule } from './graphql/user/user.module';
import { TaskModule } from './graphql/task/task.module';
import { AIModule } from './graphql/ai/ai.module';
import { HealthModule } from './graphql/health/health.module';
import { FinanceModule } from './graphql/finance/finance.module';
import { LearningModule } from './graphql/learning/learning.module';
import { SocialModule } from './graphql/social/social.module';
import { PrivacyModule } from './graphql/privacy/privacy.module';
import { PluginModule } from './graphql/plugin/plugin.module';
import { NotificationModule } from './graphql/notification/notification.module';
import { SubscriptionModule } from './graphql/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req }) => ({ req }),
    }),
    GatewayModule,
    UserModule,
    TaskModule,
    AIModule,
    HealthModule,
    FinanceModule,
    LearningModule,
    SocialModule,
    PrivacyModule,
    PluginModule,
    NotificationModule,
    SubscriptionModule,
  ],
})
export class AppModule {}