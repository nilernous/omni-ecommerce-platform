import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, Product } from '@omnicommerce/database';
import { CreateProductDto } from '@omnicommerce/dto';
import { generateSlug } from '@omnicommerce/utils';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher, ProductChangedPayload } from '@omnicommerce/events';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private events: DomainEventPublisher,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = generateSlug(dto.name);
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
      },
    });
    await this.publishChanged(DomainEvents.PRODUCT_CREATED, product.id); // PRD-BR-13
    return product;
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
    const product = await this.prisma.product.update({
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
    await this.publishChanged(DomainEvents.PRODUCT_UPDATED, id); // PRD-BR-14
    return product;
  }

  async setApprovalStatus(id: string, approved: boolean): Promise<Product> {
    await this.findById(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: approved },
    });

    if (approved) {
      await this.events.publish(DomainEvents.PRODUCT_APPROVED, { productId: id }); // PRD-BR-16
      await this.publishChanged(DomainEvents.PRODUCT_UPDATED, id); // re-index the now active listing
    } else {
      await this.events.publish(DomainEvents.PRODUCT_DELETED, { productId: id }); // PRD-BR-15: purge from search
    }
    return product;
  }

  async archive(id: string): Promise<Product> {
    return this.setApprovalStatus(id, false);
  }

  private async publishChanged(eventType: DomainEvents.PRODUCT_CREATED | DomainEvents.PRODUCT_UPDATED, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    if (!product) {
      return;
    }
    const payload: ProductChangedPayload = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      categoryId: product.categoryId,
      brandId: product.brandId,
      isActive: product.isActive,
      variants: product.variants.map((variant) => ({
        variantId: variant.id,
        sku: variant.sku,
        price: Number(variant.price),
        stock: variant.stock,
      })),
    };
    await this.events.publish(eventType, payload);
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
