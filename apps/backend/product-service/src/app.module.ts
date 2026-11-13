import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { ProductModule } from './modules/product/product.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'product-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    ProductModule,
    ReviewModule,
  ],
})
export class AppModule {}
