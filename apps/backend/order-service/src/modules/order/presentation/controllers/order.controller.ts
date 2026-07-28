import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { CreateOrderDto } from '@omnicommerce/dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@omnicommerce/auth';
import { OrderStatus, UserRole } from '@omnicommerce/constants';
import { AuthenticatedUser } from '@omnicommerce/types';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ): Promise<any> {
    return this.orderService.createOrder(user.userId, dto);
  }

  @Get()
  async getUserOrders(@CurrentUser() user: AuthenticatedUser): Promise<any[]> {
    return this.orderService.getUserOrders(user.userId);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string): Promise<any> {
    return this.orderService.getOrderById(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.SUPER_ADMIN)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ): Promise<any> {
    return this.orderService.updateOrderStatus(id, status);
  }
}
