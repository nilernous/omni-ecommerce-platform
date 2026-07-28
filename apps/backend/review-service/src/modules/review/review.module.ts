import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { JwtStrategy } from '@omnicommerce/auth';
import { ReviewController } from './presentation/controllers/review.controller';
import { ReviewService } from './application/services/review.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, PrismaService, JwtStrategy],
})
export class ReviewModule {}
