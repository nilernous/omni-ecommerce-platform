import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CATEGORY_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CategoryService {
  constructor(@Inject(CATEGORY_SERVICE) private readonly categoryClient: ClientProxy) {}

  list() {
    return lastValueFrom(this.categoryClient.send(PATTERNS.CATEGORY.LIST, {}));
  }

  getById(id: string) {
    return lastValueFrom(this.categoryClient.send(PATTERNS.CATEGORY.GET_BY_ID, { id }));
  }

  create(data: any) {
    return lastValueFrom(this.categoryClient.send(PATTERNS.CATEGORY.CREATE, data));
  }

  update(id: string, data: any) {
    return lastValueFrom(this.categoryClient.send(PATTERNS.CATEGORY.UPDATE, { id, ...data }));
  }

  delete(id: string) {
    return lastValueFrom(this.categoryClient.send(PATTERNS.CATEGORY.DELETE, { id }));
  }
}
