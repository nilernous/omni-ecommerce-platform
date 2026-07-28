import { Injectable } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, productId: string, rating: number, comment?: string): Promise<any> {
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
}
