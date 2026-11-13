import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRpcController } from './controllers/analytics.rpc.controller';
import { AnalyticsEventController } from './controllers/analytics.event.controller';

@Module({
  controllers: [AnalyticsRpcController, AnalyticsEventController],
  providers: [AnalyticsService, PrismaService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
