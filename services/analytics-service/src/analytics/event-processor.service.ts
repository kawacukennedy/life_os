import { Injectable } from '@nestjs/common';

@Injectable()
export class EventProcessorService {
  async processEvent(rawEvent: any) {
    // Validate and normalize event data
    const processedEvent = {
      userId: rawEvent.userId,
      eventType: rawEvent.eventType,
      properties: rawEvent.properties || {},
      sessionId: rawEvent.sessionId,
      deviceInfo: rawEvent.deviceInfo,
      userAgent: rawEvent.userAgent,
      ipAddress: rawEvent.ipAddress,
      timestamp: rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date(),
    };

    // Add processing metadata
    processedEvent.properties._processed_at = new Date().toISOString();
    processedEvent.properties._version = '1.0';

    // Validate required fields
    if (!processedEvent.userId || !processedEvent.eventType) {
      throw new Error('Missing required fields: userId or eventType');
    }

    return processedEvent;
  }
}