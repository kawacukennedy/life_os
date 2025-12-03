import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PluginResolver } from './plugin.resolver';
import { PluginGraphQLService } from './plugin.service';

@Module({
  imports: [HttpModule],
  providers: [PluginResolver, PluginGraphQLService],
  exports: [PluginGraphQLService],
})
export class PluginModule {}