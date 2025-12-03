import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { TaskResolver } from './resolvers/task.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { AIResolver } from './resolvers/ai.resolver';

@Module({
  imports: [
    HttpModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      introspection: true,
    }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, TaskResolver, UserResolver, AIResolver],
})
export class GatewayModule {}