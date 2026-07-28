import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { ReviewRpcController } from './controllers/review.rpc.controller';
import { ReviewEventController } from './controllers/review.event.controller';
import { ReviewService } from './services/review.service';

@Module({
  controllers: [ReviewRpcController, ReviewEventController],
  providers: [ReviewService, PrismaService],
  exports: [ReviewService],
})
export class ReviewModule {}
