import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShippingService } from '../services/shipping.service';

@Controller()
export class ShippingRpcController {
  constructor(private readonly shippingService: ShippingService) {}

  @MessagePattern('shipping.create')
  async createShipment(@Payload() data: { orderId: string; carrier: string }): Promise<any> {
    return this.shippingService.createShipment(data.orderId, data.carrier);
  }

  @MessagePattern('shipping.get_by_order')
  async getShippingByOrder(@Payload() data: { orderId: string }): Promise<any> {
    return this.shippingService.getShippingByOrder(data.orderId);
  }
}
