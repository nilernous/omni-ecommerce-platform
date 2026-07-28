import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  constructor(@Inject(PRODUCT_SERVICE) private readonly productClient: ClientProxy) {}

  list(query: any) {
    return lastValueFrom(this.productClient.send(PATTERNS.PRODUCT.LIST, query));
  }

  search(query: any) {
    return lastValueFrom(this.productClient.send(PATTERNS.PRODUCT.SEARCH, query));
  }

  getById(id: string) {
    return lastValueFrom(this.productClient.send(PATTERNS.PRODUCT.GET_BY_ID, { id }));
  }

  create(data: any) {
    return lastValueFrom(this.productClient.send(PATTERNS.PRODUCT.CREATE, data));
  }

  update(id: string, data: any) {
    return lastValueFrom(this.productClient.send(PATTERNS.PRODUCT.UPDATE, { id, ...data }));
  }

  delete(id: string) {
    return lastValueFrom(this.productClient.send(PATTERNS.PRODUCT.DELETE, { id }));
  }
}
