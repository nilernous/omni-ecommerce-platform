import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.constant';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products' })
  list(@Query() query: any) {
    return this.productService.list(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  search(@Query() query: any) {
    return this.productService.search(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  getById(@Param('id') id: string) {
    return this.productService.getById(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SELLER)
  @Post()
  @ApiOperation({ summary: 'Create product' })
  create(@Body() data: any) {
    return this.productService.create(data);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SELLER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.productService.update(id, data);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SELLER)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
