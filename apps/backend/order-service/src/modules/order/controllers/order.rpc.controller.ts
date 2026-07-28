import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '@omnicommerce/dto';

@Controller()
export class OrderRpcController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async createOrder(@Payload() data: { userId: string; dto: CreateOrderDto }) {
    return this.orderService.createOrder(data.userId, data.dto);
  }

  @MessagePattern('order.get_user_orders')
  async getUserOrders(@Payload() data: { userId: string }) {
    return this.orderService.getUserOrders(data.userId);
  }

  @MessagePattern('order.get_by_id')
  async getOrderById(@Payload() data: { orderId: string }) {
    return this.orderService.getOrderById(data.orderId);
  }

  @MessagePattern('order.update_status')
  async updateOrderStatus(@Payload() data: { orderId: string; status: any }) {
    return this.orderService.updateOrderStatus(data.orderId, data.status);
  }
}
