import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher } from '@omnicommerce/events';

@Injectable()
export class ReviewService {
  private moderation = new Map<string, { status: 'APPROVED' | 'REJECTED'; reason?: string }>();

  /** userId -> productIds the customer received (REV-BR-12). In-memory until the review schema is persisted. */
  private purchaseEligibility = new Map<string, Set<string>>();

  constructor(
    private prisma: PrismaService,
    private events: DomainEventPublisher,
  ) {}

  /** REV-BR-12: a delivered order makes its products reviewable as verified purchases. */
  async recordDeliveredOrder(userId: string, variantIds: string[]): Promise<string[]> {
    const variants = await this.prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { productId: true } });
    const productIds = [...new Set(variants.map((variant) => variant.productId))];
    const eligible = this.purchaseEligibility.get(userId) ?? new Set<string>();
    productIds.forEach((productId) => eligible.add(productId));
    this.purchaseEligibility.set(userId, eligible);
    return productIds;
  }

  isVerifiedPurchase(userId: string, productId: string): boolean {
    return this.purchaseEligibility.get(userId)?.has(productId) ?? false;
  }

  async createReview(userId: string, productId: string, rating: number, comment?: string): Promise<any> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Review rating must be between 1 and 5');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });
    const verifiedPurchase = this.isVerifiedPurchase(userId, productId);
    await this.events.publish(DomainEvents.REVIEW_SUBMITTED, { reviewId: review.id, productId, userId, rating, verifiedPurchase }); // REV-BR-10
    return { ...review, verifiedPurchase };
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
    if (status === 'APPROVED') {
      await this.events.publish(DomainEvents.REVIEW_APPROVED, { reviewId, productId: review.productId, rating: review.rating }); // REV-BR-11
    }

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
