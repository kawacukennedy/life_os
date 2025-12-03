import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class EventStoreService {
  private kafka: Kafka;
  private producer: any;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.initProducer();
  }

  private async initProducer() {
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async publishEvent(topic: string, event: any) {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(event),
          key: event.userId,
        },
      ],
    });
  }

  async publishEvents(topic: string, events: any[]) {
    const messages = events.map(event => ({
      value: JSON.stringify(event),
      key: event.userId,
    }));

    await this.producer.send({
      topic,
      messages,
    });
  }
}