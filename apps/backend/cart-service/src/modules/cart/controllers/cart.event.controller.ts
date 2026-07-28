import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CartService } from '../services/cart.service';

@Controller()
export class CartEventController {
  constructor(private readonly cartService: CartService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: { userId: string }) {
    if (data?.userId) {
      await this.cartService.clearCart(data.userId);
    }
  }
}
