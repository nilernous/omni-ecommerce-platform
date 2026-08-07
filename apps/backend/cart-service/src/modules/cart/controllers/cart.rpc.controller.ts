import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from '../services/cart.service';

@Controller()
export class CartRpcController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern('cart.get')
  async getCart(@Payload() data: { userId?: string; guestCartId?: string }) {
    return this.cartService.getCart(data.userId || data.guestCartId || '', Boolean(data.guestCartId && !data.userId));
  }

  @MessagePattern('cart.add_item')
  async addItem(@Payload() data: { userId?: string; guestCartId?: string; dto?: any; item?: any }) {
    return this.cartService.addItem(
      data.userId || data.guestCartId || '',
      data.dto || data.item,
      Boolean(data.guestCartId && !data.userId),
    );
  }

  @MessagePattern('cart.update_item')
  async updateItem(@Payload() data: { userId?: string; guestCartId?: string; variantId?: string; itemId?: string; quantity: number }) {
    return this.cartService.updateItem(
      data.userId || data.guestCartId || '',
      data.variantId || data.itemId || '',
      data.quantity,
      Boolean(data.guestCartId && !data.userId),
    );
  }

  @MessagePattern('cart.remove_item')
  async removeItem(@Payload() data: { userId?: string; guestCartId?: string; variantId?: string; itemId?: string }) {
    return this.cartService.removeItem(
      data.userId || data.guestCartId || '',
      data.variantId || data.itemId || '',
      Boolean(data.guestCartId && !data.userId),
    );
  }

  @MessagePattern('cart.merge')
  async mergeGuestCart(@Payload() data: { userId: string; guestCartId: string }) {
    return this.cartService.mergeGuestCart(data.userId, data.guestCartId);
  }

  @MessagePattern('cart.clear')
  async clearCart(@Payload() data: { userId: string }) {
    return this.cartService.clearCart(data.userId);
  }
}
