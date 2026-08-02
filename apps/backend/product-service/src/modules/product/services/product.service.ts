import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async browse(filters: any = {}): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        isActive: filters.includeInactive ? undefined : true,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        price: {
          gte: filters.minPrice,
          lte: filters.maxPrice,
        },
        name: filters.query
          ? {
              contains: filters.query,
              mode: 'insensitive',
            }
          : undefined,
      },
      include: { category: true, brand: true, variants: true },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  async findById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, variants: true, reviews: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
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

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.name ? generateSlug(dto.name) : undefined,
        description: dto.description,
        price: dto.price,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
      },
    });
  }

  async setApprovalStatus(id: string, approved: boolean): Promise<Product> {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: approved },
    });
  }

  async archive(id: string): Promise<Product> {
    return this.setApprovalStatus(id, false);
  }

  async createCategory(data: { name: string; description?: string; parentId?: string }): Promise<any> {
    if (!data.name) {
      throw new BadRequestException('Category name is required');
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description,
        parentId: data.parentId,
      },
    });
  }
}
