import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ShippingService } from '../../application/services/shipping.service';
import { JwtAuthGuard } from '@omnicommerce/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post()
  async createShipment(
    @Body('orderId') orderId: string,
    @Body('carrier') carrier: string,
  ): Promise<any> {
    return this.shippingService.createShipment(orderId, carrier);
  }

  @Get('order/:orderId')
  async getShippingByOrder(@Param('orderId') orderId: string): Promise<any[]> {
    return this.shippingService.getShippingByOrder(orderId);
  }
}
