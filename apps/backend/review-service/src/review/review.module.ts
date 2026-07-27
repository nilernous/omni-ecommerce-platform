import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { JwtStrategy } from '@omnicommerce/auth';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, PrismaService, JwtStrategy],
})
export class ReviewModule {}
