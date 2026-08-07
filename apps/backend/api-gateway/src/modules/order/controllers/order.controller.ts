import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.constant';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  create(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.orderService.create(userId, data);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'List current user orders' })
  listByUser(@CurrentUser('userId') userId: string, @Query() query: any) {
    return this.orderService.listByUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  getById(@Param('id') id: string) {
    return this.orderService.getById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  cancel(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.orderService.cancel(id, userId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateStatus(id, status);
  }
}
