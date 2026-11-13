import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { OrderCreatedPayload, ProductChangedPayload } from '@omnicommerce/events';
import { CartService } from '../services/cart.service';

@Controller()
export class CartEventController {
  constructor(private readonly cartService: CartService) {}

  // CART-BR-13 names `order.placed`, which no service publishes; `order.created` is the order placement event.
  @EventPattern(DomainEvents.ORDER_CREATED)
  async handleOrderCreated(@Payload() data: OrderCreatedPayload) {
    await this.cartService.clearCart(data.userId);
  }

  // CART-BR-12
  @EventPattern(DomainEvents.PRODUCT_UPDATED)
  async handleProductUpdated(@Payload() data: ProductChangedPayload) {
    if (data.variants?.length) {
      await this.cartService.repriceVariants(data.variants);
    }
  }
}
