import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'order-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    OrderModule,
  ],
})
export class AppModule {}
