import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { ProductChangedPayload, ProductDeletedPayload } from '@omnicommerce/events';
import { SearchService } from './search.service';

@Controller()
export class SearchEventController {
  constructor(private readonly searchService: SearchService) {}

  // SRCH-BR-08, SRCH-BR-09
  @EventPattern(DomainEvents.PRODUCT_CREATED)
  @EventPattern(DomainEvents.PRODUCT_UPDATED)
  async handleProductChanged(@Payload() data: ProductChangedPayload) {
    await this.searchService.syncProduct({ ...data, id: data.productId });
  }

  // SRCH-BR-10 (PRD-BR-15 covers archiving too)
  @EventPattern(DomainEvents.PRODUCT_DELETED)
  async handleProductDeleted(@Payload() data: ProductDeletedPayload) {
    await this.searchService.syncProduct({ id: data.productId, deleted: true });
  }
}
