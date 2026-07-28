import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app/app.config';
import { HealthModule } from './health/health.module';
import { PromotionModule } from './modules/promotion/promotion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    HealthModule,
    PromotionModule,
  ],
})
export class AppModule {}
