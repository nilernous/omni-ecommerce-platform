import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'analytics-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    AnalyticsModule,
  ],
})
export class AppModule {}
