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
  @MessagePattern('product.list')
  async findAll(): Promise<any> {
    return this.productService.findAll();
  }

  @MessagePattern('product.search')
  async browse(@Payload() data: any): Promise<any> {
    return this.productService.browse(data);
  }

  @MessagePattern('product.get_by_id')
  async findById(@Payload() data: { id: string }): Promise<any> {
    return this.productService.findById(data.id);
  }

  @MessagePattern('product.find_by_slug')
  async findBySlug(@Payload() data: { slug: string }): Promise<any> {
    return this.productService.findBySlug(data.slug);
  }

  @MessagePattern('product.update')
  async update(@Payload() data: { id: string; dto?: Partial<CreateProductDto>; [key: string]: any }): Promise<any> {
    return this.productService.update(data.id, data.dto || data);
  }

  @MessagePattern('product.approve')
  async approve(@Payload() data: { id: string }): Promise<any> {
    return this.productService.setApprovalStatus(data.id, true);
  }

  @MessagePattern('product.reject')
  @MessagePattern('product.delete')
  async reject(@Payload() data: { id: string }): Promise<any> {
    return this.productService.setApprovalStatus(data.id, false);
  }

  @MessagePattern('product.archive')
  async archive(@Payload() data: { id: string }): Promise<any> {
    return this.productService.archive(data.id);
  }

  @MessagePattern('category.create')
  async createCategory(@Payload() data: { name: string; description?: string; parentId?: string }): Promise<any> {
    return this.productService.createCategory(data);
  }
}
