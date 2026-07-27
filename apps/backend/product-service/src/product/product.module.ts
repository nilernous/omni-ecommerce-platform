import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
})
export class ProductModule {}
