import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProductService } from '../services/product.service';

@Controller()
export class ProductEventController {
  constructor(private readonly productService: ProductService) {}

  @EventPattern('category.deleted')
  async handleCategoryDeleted(@Payload() data: { categoryId: string }) {
    // Event handler placeholder
  }
}
