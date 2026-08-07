import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SearchService } from './search.service';

@Controller()
export class SearchRpcController {
  constructor(private readonly searchService: SearchService) {}

  @MessagePattern('search.query')
  @MessagePattern('search.fulltext')
  async search(@Payload() data: any) {
    return this.searchService.search(data);
  }

  @MessagePattern('search.autocomplete')
  async autocomplete(@Payload() data: { prefix?: string; query?: string }) {
    return this.searchService.autocomplete(data.prefix || data.query || '');
  }

  @MessagePattern('search.sync_product')
  async syncProduct(@Payload() data: any) {
    return this.searchService.syncProduct(data);
  }

  @MessagePattern('search.reindex')
  async reindex(@Payload() data: { products: any[] }) {
    return this.searchService.reindex(data.products || []);
  }
}
