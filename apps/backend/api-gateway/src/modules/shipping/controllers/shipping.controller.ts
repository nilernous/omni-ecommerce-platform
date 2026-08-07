import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingService } from '../services/shipping.service';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.constant';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @Post('rates')
  @ApiOperation({ summary: 'Calculate shipping rates' })
  calculateRates(@Body() data: any) {
    return this.shippingService.calculateRates(data);
  }

  @Public()
  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track shipment status' })
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.track(trackingNumber);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('shipments')
  @ApiOperation({ summary: 'Create shipment label (Admin)' })
  createShipment(@Body() data: any) {
    return this.shippingService.createShipment(data);
  }
}
