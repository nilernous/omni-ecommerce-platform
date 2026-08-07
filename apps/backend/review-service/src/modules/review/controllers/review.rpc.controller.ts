import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewService } from '../services/review.service';

@Controller()
export class ReviewRpcController {
  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern('review.create')
  async createReview(@Payload() data: { userId: string; productId: string; rating: number; comment?: string }): Promise<any> {
    return this.reviewService.createReview(data.userId, data.productId, data.rating, data.comment);
  }

  @MessagePattern('review.get_by_product')
  @MessagePattern('review.list_by_product')
  async getProductReviews(@Payload() data: { productId: string }): Promise<any> {
    return this.reviewService.getProductReviews(data.productId);
  }

  @MessagePattern('review.moderate')
  async moderateReview(@Payload() data: { reviewId?: string; id?: string; status: 'APPROVED' | 'REJECTED'; reason?: string }): Promise<any> {
    return this.reviewService.moderateReview(data.reviewId || data.id || '', data.status, data.reason);
  }

  @MessagePattern('review.summary')
  async getProductReviewSummary(@Payload() data: { productId: string }): Promise<any> {
    return this.reviewService.getProductReviewSummary(data.productId);
  }
}
