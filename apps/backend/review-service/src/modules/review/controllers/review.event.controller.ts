import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ReviewService } from '../services/review.service';

@Controller()
export class ReviewEventController {
  constructor(private readonly reviewService: ReviewService) {}

  @EventPattern('review.created')
  async handleReviewCreated(@Payload() data: any) {
    // Event handler placeholder
  }
}
