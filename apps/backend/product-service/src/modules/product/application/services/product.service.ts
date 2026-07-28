import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, Product } from '@omnicommerce/database';
import { CreateProductDto } from '@omnicommerce/dto';
import { generateSlug } from '@omnicommerce/utils';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = generateSlug(dto.name);
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
      },
    });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, brand: true, variants: true },
    });
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, brand: true, variants: true, reviews: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
