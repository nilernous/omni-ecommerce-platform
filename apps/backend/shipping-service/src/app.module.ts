import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'shipping-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    ShippingModule,
  ],
})
export class AppModule {}
