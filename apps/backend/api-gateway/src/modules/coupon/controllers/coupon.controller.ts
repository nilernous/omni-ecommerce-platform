import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponService } from '../services/coupon.service';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.constant';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @ApiBearerAuth()
  @Post('apply')
  @ApiOperation({ summary: 'Apply coupon code to cart' })
  apply(@Body() body: { code: string; cartTotal: number }) {
    return this.couponService.apply(body.code, body.cartTotal);
  }

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon code' })
  validate(@Body('code') code: string) {
    return this.couponService.validate(code);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create promotional coupon (Admin)' })
  create(@Body() data: any) {
    return this.couponService.create(data);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all coupons (Admin)' })
  list() {
    return this.couponService.list();
  }
}
