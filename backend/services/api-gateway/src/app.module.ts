import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GatewayModule } from './gateway/gateway.module';
import { UserModule } from './graphql/user/user.module';
import { TaskModule } from './graphql/task/task.module';
import { AIModule } from './graphql/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    GatewayModule,
    UserModule,
    TaskModule,
    AIModule,
  ],
})
export class AppModule {}