import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'cart-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    CartModule,
  ],
})
export class AppModule {}
