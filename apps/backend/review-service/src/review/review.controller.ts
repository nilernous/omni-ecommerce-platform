import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard, CurrentUser } from '@omnicommerce/auth';
import { AuthenticatedUser } from '@omnicommerce/types';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Body('productId') productId: string,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ): Promise<any> {
    return this.reviewService.createReview(user.userId, productId, rating, comment);
  }

  @Get('product/:productId')
  async getProductReviews(@Param('productId') productId: string): Promise<any[]> {
    return this.reviewService.getProductReviews(productId);
  }
}
