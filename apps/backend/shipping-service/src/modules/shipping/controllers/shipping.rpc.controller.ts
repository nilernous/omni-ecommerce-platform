import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShippingService } from '../services/shipping.service';

@Controller()
export class ShippingRpcController {
  constructor(private readonly shippingService: ShippingService) {}

  @MessagePattern('shipping.calculate_rates')
  async calculateRates(@Payload() data: any): Promise<any> {
    return this.shippingService.calculateRates(data);
  }

  @MessagePattern('shipping.create')
  @MessagePattern('shipping.create_shipment')
  async createShipment(@Payload() data: { orderId: string; carrier?: string }): Promise<any> {
    return this.shippingService.createShipment(data.orderId, data.carrier || 'STANDARD');
  }

  @MessagePattern('shipping.get_by_order')
  async getShippingByOrder(@Payload() data: { orderId: string }): Promise<any> {
    return this.shippingService.getShippingByOrder(data.orderId);
  }

  @MessagePattern('shipping.generate_label')
  async generateLabel(@Payload() data: { orderId: string; carrier?: string }): Promise<any> {
    return this.shippingService.generateLabel(data.orderId, data.carrier);
  }

  @MessagePattern('shipping.track')
  async track(@Payload() data: { trackingNumber: string; status?: string; payload?: any }): Promise<any> {
    if (data.status) {
      return this.shippingService.ingestTrackingUpdate(data.trackingNumber, data.status, data.payload);
    }
    return this.shippingService.getTrackingEvents(data.trackingNumber);
  }

  @MessagePattern('shipping.delivered')
  async confirmDelivery(@Payload() data: { orderId: string }): Promise<any> {
    return this.shippingService.confirmDelivery(data.orderId);
  }
}
