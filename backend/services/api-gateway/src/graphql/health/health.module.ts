import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HealthResolver } from './health.resolver';
import { HealthService } from './health.service';

@Module({
  imports: [HttpModule],
  providers: [HealthResolver, HealthService],
})
export class HealthModule {}