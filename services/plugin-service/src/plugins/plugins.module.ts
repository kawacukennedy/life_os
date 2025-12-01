import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { Plugin } from './plugin.entity';
import { UserPlugin } from './user-plugin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plugin, UserPlugin])],
  providers: [PluginsService],
  controllers: [PluginsController],
  exports: [PluginsService],
})
export class PluginsModule {}