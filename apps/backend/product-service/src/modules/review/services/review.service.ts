import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class ReviewService {
  private moderation = new Map<string, { status: 'APPROVED' | 'REJECTED'; reason?: string }>();

  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, productId: string, rating: number, comment?: string): Promise<any> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Review rating must be between 1 and 5');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });
  }

  async getProductReviews(productId: string): Promise<any[]> {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateReview(reviewId: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<any> {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const moderation = { status, reason };
    this.moderation.set(reviewId, moderation);

    return {
      ...review,
      moderation,
    };
  }

  async getProductReviewSummary(productId: string): Promise<any> {
    const reviews = await this.prisma.review.findMany({ where: { productId } });
    const approvedReviews = reviews.filter((review) => this.moderation.get(review.id)?.status !== 'REJECTED');
    const averageRating =
      approvedReviews.length === 0
        ? 0
        : Number((approvedReviews.reduce((total, review) => total + review.rating, 0) / approvedReviews.length).toFixed(2));

    return {
      productId,
      averageRating,
      reviewCount: approvedReviews.length,
    };
  }
}
