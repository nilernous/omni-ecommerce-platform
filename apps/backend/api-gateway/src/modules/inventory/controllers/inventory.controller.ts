import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.constant';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get('stock/:sku')
  @ApiOperation({ summary: 'Check stock by SKU' })
  checkStock(@Param('sku') sku: string) {
    return this.inventoryService.checkStock(sku);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SELLER)
  @Post('stock')
  @ApiOperation({ summary: 'Update stock levels' })
  updateStock(@Body() body: { sku: string; quantity: number }) {
    return this.inventoryService.updateStock(body.sku, body.quantity);
  }
}
