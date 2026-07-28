import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CART_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CartService {
  constructor(@Inject(CART_SERVICE) private readonly cartClient: ClientProxy) {}

  getCart(userId: string) {
    return lastValueFrom(this.cartClient.send(PATTERNS.CART.GET, { userId }));
  }

  addItem(userId: string, item: any) {
    return lastValueFrom(this.cartClient.send(PATTERNS.CART.ADD_ITEM, { userId, item }));
  }

  updateItem(userId: string, itemId: string, quantity: number) {
    return lastValueFrom(this.cartClient.send(PATTERNS.CART.UPDATE_ITEM, { userId, itemId, quantity }));
  }

  removeItem(userId: string, itemId: string) {
    return lastValueFrom(this.cartClient.send(PATTERNS.CART.REMOVE_ITEM, { userId, itemId }));
  }

  clearCart(userId: string) {
    return lastValueFrom(this.cartClient.send(PATTERNS.CART.CLEAR, { userId }));
  }
}
