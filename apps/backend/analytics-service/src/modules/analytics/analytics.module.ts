import { Module } from '@nestjs/common';
import { PrismaModule } from '@omnicommerce/database';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRpcController } from './controllers/analytics.rpc.controller';
import { AnalyticsEventController } from './controllers/analytics.event.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsRpcController, AnalyticsEventController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
