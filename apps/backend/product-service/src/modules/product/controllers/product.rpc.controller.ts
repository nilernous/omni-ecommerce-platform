import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '@omnicommerce/dto';

@Controller()
export class ProductRpcController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('product.create')
  async create(@Payload() dto: CreateProductDto): Promise<any> {
    return this.productService.create(dto);
  }

  @MessagePattern('product.find_all')
  async findAll(): Promise<any> {
    return this.productService.findAll();
  }

  @MessagePattern('product.find_by_slug')
  async findBySlug(@Payload() data: { slug: string }): Promise<any> {
    return this.productService.findBySlug(data.slug);
  }
}
