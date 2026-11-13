import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { PromotionModule } from './modules/promotion/promotion.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'promotion-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    PromotionModule,
  ],
})
export class AppModule {}
