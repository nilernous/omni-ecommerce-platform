import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from '../services/cart.service';

@Controller()
export class CartRpcController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern('cart.get')
  async getCart(@Payload() data: { userId: string }) {
    return this.cartService.getCart(data.userId);
  }

  @MessagePattern('cart.add_item')
  async addItem(@Payload() data: { userId: string; dto: any }) {
    return this.cartService.addItem(data.userId, data.dto);
  }

  @MessagePattern('cart.remove_item')
  async removeItem(@Payload() data: { userId: string; variantId: string }) {
    return this.cartService.removeItem(data.userId, data.variantId);
  }

  @MessagePattern('cart.clear')
  async clearCart(@Payload() data: { userId: string }) {
    return this.cartService.clearCart(data.userId);
  }
}
