import { Module, Global } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { HealthController } from './health.controller';
import { EncryptionService } from './encryption.service';
import { SecurityMiddleware } from './security.middleware';

@Global()
@Module({
  providers: [
    MonitoringService,
    LoggingService,
    EncryptionService,
  ],
  controllers: [HealthController],
  exports: [
    MonitoringService,
    LoggingService,
    EncryptionService,
  ],
})
export class CommonModule {}