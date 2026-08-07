import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  private index = new Map<string, any>();

  async search(filters: any): Promise<any> {
    const query = String(filters.query || filters.q || '').toLowerCase();
    const hits = Array.from(this.index.values()).filter((product) => {
      const matchesQuery =
        !query ||
        String(product.name || '').toLowerCase().includes(query) ||
        String(product.description || '').toLowerCase().includes(query);
      const matchesCategory = !filters.categoryId || product.categoryId === filters.categoryId;
      const matchesBrand = !filters.brandId || product.brandId === filters.brandId;
      const matchesPrice = (!filters.minPrice || product.price >= filters.minPrice) && (!filters.maxPrice || product.price <= filters.maxPrice);
      return matchesQuery && matchesCategory && matchesBrand && matchesPrice && product.isActive !== false;
    });

    return {
      total: hits.length,
      items: hits.slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20)),
      facets: this.buildFacets(hits),
    };
  }

  async autocomplete(prefix: string): Promise<string[]> {
    const normalizedPrefix = String(prefix || '').toLowerCase();
    return Array.from(
      new Set(
        Array.from(this.index.values())
          .map((product) => String(product.name || ''))
          .filter((name) => name.toLowerCase().startsWith(normalizedPrefix)),
      ),
    ).slice(0, 10);
  }

  async syncProduct(product: any): Promise<any> {
    if (product.deleted || product.isActive === false) {
      this.index.delete(product.id);
      return { indexed: false, id: product.id };
    }

    this.index.set(product.id, product);
    return { indexed: true, id: product.id };
  }

  async reindex(products: any[]): Promise<any> {
    this.index.clear();
    for (const product of products) {
      await this.syncProduct(product);
    }
    return { indexedCount: this.index.size };
  }

  private buildFacets(products: any[]): any {
    return {
      categories: this.countBy(products, 'categoryId'),
      brands: this.countBy(products, 'brandId'),
    };
  }

  private countBy(products: any[], field: string): Record<string, number> {
    return products.reduce<Record<string, number>>((counts, product) => {
      const value = product[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
      return counts;
    }, {});
  }
}
