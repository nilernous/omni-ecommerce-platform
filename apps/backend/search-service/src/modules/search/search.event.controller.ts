import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SearchService } from './search.service';

@Controller()
export class SearchEventController {
  constructor(private readonly searchService: SearchService) {}

  @EventPattern('product.created')
  @EventPattern('product.updated')
  async handleProductChanged(@Payload() data: any) {
    await this.searchService.syncProduct(data);
  }

  @EventPattern('product.deleted')
  @EventPattern('product.archived')
  async handleProductDeleted(@Payload() data: any) {
    await this.searchService.syncProduct({ ...data, deleted: true });
  }
}
