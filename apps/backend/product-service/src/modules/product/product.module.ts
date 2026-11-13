import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { ProductRpcController } from './controllers/product.rpc.controller';
import { ProductService } from './services/product.service';

@Module({
  controllers: [ProductRpcController],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
