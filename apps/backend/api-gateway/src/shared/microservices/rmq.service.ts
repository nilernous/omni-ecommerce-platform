import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  getOptions(queue: string, noAck = false): RmqOptions {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('rabbitmq.uri') || 'amqp://localhost:5672'],
        queue: this.configService.get<string>(`rabbitmq.${queue}`) || queue,
        noAck,
        queueOptions: {
          durable: true,
        },
      },
    };
  }
}
