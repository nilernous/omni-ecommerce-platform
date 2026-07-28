import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { REVIEW_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ReviewService {
  constructor(@Inject(REVIEW_SERVICE) private readonly reviewClient: ClientProxy) {}

  create(userId: string, data: any) {
    return lastValueFrom(this.reviewClient.send(PATTERNS.REVIEW.CREATE, { userId, ...data }));
  }

  listByProduct(productId: string) {
    return lastValueFrom(this.reviewClient.send(PATTERNS.REVIEW.LIST_BY_PRODUCT, { productId }));
  }

  delete(id: string, userId: string) {
    return lastValueFrom(this.reviewClient.send(PATTERNS.REVIEW.DELETE, { id, userId }));
  }
}
