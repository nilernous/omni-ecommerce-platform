import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { ProductController } from './presentation/controllers/product.controller';
import { ProductService } from './application/services/product.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
})
export class ProductModule {}
