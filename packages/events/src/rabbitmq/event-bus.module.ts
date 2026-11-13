import { DynamicModule, Global, Module } from '@nestjs/common';
import { DomainEventPublisher, EVENT_BUS_OPTIONS, EventBusOptions } from './domain-event.publisher';

/** Registers a global DomainEventPublisher for the service. Import once in AppModule. */
@Global()
@Module({})
export class EventBusModule {
  static forRoot(options: EventBusOptions): DynamicModule {
    return {
      module: EventBusModule,
      providers: [{ provide: EVENT_BUS_OPTIONS, useValue: options }, DomainEventPublisher],
      exports: [DomainEventPublisher],
    };
  }
}
