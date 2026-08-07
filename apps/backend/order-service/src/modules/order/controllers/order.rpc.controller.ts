import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '@omnicommerce/dto';

@Controller()
export class OrderRpcController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async createOrder(@Payload() data: { userId: string; dto?: CreateOrderDto; [key: string]: any }) {
    return this.orderService.createOrder(data.userId, data.dto || data);
  }

  @MessagePattern('order.get_user_orders')
  @MessagePattern('order.list_by_user')
  async getUserOrders(@Payload() data: { userId: string }) {
    return this.orderService.getUserOrders(data.userId);
  }

  @MessagePattern('order.get_by_id')
  async getOrderById(@Payload() data: { orderId?: string; id?: string }) {
    return this.orderService.getOrderById(data.orderId || data.id || '');
  }

  @MessagePattern('order.update_status')
  async updateOrderStatus(@Payload() data: { orderId?: string; id?: string; status: any }) {
    return this.orderService.updateOrderStatus(data.orderId || data.id || '', data.status);
  }

  @MessagePattern('order.cancel')
  async cancelOrder(@Payload() data: { orderId?: string; id?: string; userId?: string }) {
    return this.orderService.cancelOrder(data.orderId || data.id || '', data.userId);
  }

  @MessagePattern('order.payment_completed')
  async markPaymentCompleted(@Payload() data: { orderId?: string; id?: string }) {
    return this.orderService.markPaymentCompleted(data.orderId || data.id || '');
  }

  @MessagePattern('order.shipped')
  async markShipped(@Payload() data: { orderId?: string; id?: string }) {
    return this.orderService.markShipped(data.orderId || data.id || '');
  }

  @MessagePattern('order.delivered')
  async markDelivered(@Payload() data: { orderId?: string; id?: string }) {
    return this.orderService.markDelivered(data.orderId || data.id || '');
  }
}
