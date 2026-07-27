import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from '@omnicommerce/dto';
import { JwtAuthGuard, CurrentUser } from '@omnicommerce/auth';
import { AuthenticatedUser } from '@omnicommerce/types';

@Controller()
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddToCartDto,
  ): Promise<any> {
    return this.cartService.addItem(user.userId, dto);
  }

  @Delete('items/:variantId')
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variantId') variantId: string,
  ): Promise<any> {
    return this.cartService.removeItem(user.userId, variantId);
  }

  @Delete()
  async clearCart(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.cartService.clearCart(user.userId);
  }
}
