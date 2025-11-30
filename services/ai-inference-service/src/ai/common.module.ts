import { Module, Global } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { HealthController } from './health.controller';

@Global()
@Module({
  providers: [
    MonitoringService,
    LoggingService,
  ],
  controllers: [HealthController],
  exports: [
    MonitoringService,
    LoggingService,
  ],
})
export class CommonModule {}