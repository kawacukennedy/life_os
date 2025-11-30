import { Module, Global } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggerService } from './logger.service';
import { HealthController } from './health.controller';

@Global()
@Module({
  providers: [
    MonitoringService,
    LoggerService,
  ],
  controllers: [HealthController],
  exports: [
    MonitoringService,
    LoggerService,
  ],
})
export class CommonModule {}