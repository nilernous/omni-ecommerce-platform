import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [HealthModule, ReviewModule],
})
export class AppModule {}
