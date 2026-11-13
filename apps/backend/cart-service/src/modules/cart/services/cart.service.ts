import { BadRequestException, Injectable } from '@nestjs/common';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher } from '@omnicommerce/events';

export interface CartItem {
  variantId: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
}

export interface CartView {
  ownerKey: string;
  items: CartItem[];
  totalItems: number;
  distinctItems: number;
}

@Injectable()
export class CartService {
  private readonly maxDistinctItems = 50;
  private readonly maxItemQuantity = 99;
  private carts = new Map<string, CartItem[]>();

  constructor(private readonly events: DomainEventPublisher) {}

  async getCart(ownerId: string, isGuest = false): Promise<CartView> {
    return this.toCartView(this.resolveOwnerKey(ownerId, isGuest));
  }

  async addItem(ownerId: string, dto: Partial<CartItem>, isGuest = false): Promise<CartView> {
    const ownerKey = this.resolveOwnerKey(ownerId, isGuest);
    const cart = this.carts.get(ownerKey) || [];
    const item = this.normalizeItem(dto);
    const existingIndex = cart.findIndex((cartItem) => this.sameItem(cartItem, item));

    if (existingIndex > -1) {
      cart[existingIndex] = {
        ...cart[existingIndex],
        quantity: this.normalizeQuantity(cart[existingIndex].quantity + item.quantity),
      };
    } else {
      if (cart.length >= this.maxDistinctItems) {
        throw new BadRequestException('CART_LIMIT_EXCEEDED');
      }
      cart.push(item);
    }

    this.carts.set(ownerKey, cart);
    await this.events.publish(DomainEvents.CART_ITEM_ADDED, { ownerKey, variantId: item.variantId, quantity: item.quantity }); // CART-BR-10
    return this.toCartView(ownerKey);
  }

  async updateItem(ownerId: string, variantId: string, quantity: number, isGuest = false): Promise<CartView> {
    const ownerKey = this.resolveOwnerKey(ownerId, isGuest);
    const cart = this.carts.get(ownerKey) || [];
    const normalizedQuantity = Math.trunc(Number(quantity));

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 0) {
      throw new BadRequestException('Quantity must be zero or greater');
    }

    if (normalizedQuantity === 0) {
      return this.removeItem(ownerId, variantId, isGuest);
    }

    const itemIndex = cart.findIndex((item) => item.variantId === variantId || item.sku === variantId);
    if (itemIndex === -1) {
      throw new BadRequestException('Cart item not found');
    }

    cart[itemIndex] = { ...cart[itemIndex], quantity: this.normalizeQuantity(normalizedQuantity) };
    this.carts.set(ownerKey, cart);
    return this.toCartView(ownerKey);
  }

  async removeItem(ownerId: string, variantId: string, isGuest = false): Promise<CartView> {
    const ownerKey = this.resolveOwnerKey(ownerId, isGuest);
    const cart = this.carts.get(ownerKey) || [];
    const filteredCart = cart.filter((item) => item.variantId !== variantId && item.sku !== variantId);
    this.carts.set(ownerKey, filteredCart);
    return this.toCartView(ownerKey);
  }

  async mergeGuestCart(userId: string, guestCartId: string): Promise<CartView> {
    const guestKey = this.resolveOwnerKey(guestCartId, true);
    const guestCart = this.carts.get(guestKey) || [];

    for (const item of guestCart) {
      await this.addItem(userId, item);
    }

    this.carts.delete(guestKey);
    return this.toCartView(this.resolveOwnerKey(userId));
  }

  async clearCart(ownerId: string, isGuest = false): Promise<boolean> {
    const ownerKey = this.resolveOwnerKey(ownerId, isGuest);
    const existed = this.carts.delete(ownerKey);
    if (existed) {
      await this.events.publish(DomainEvents.CART_CLEARED, { ownerKey }); // CART-BR-11
    }
    return true;
  }

  /** CART-BR-12: refresh cached unit prices of items whose variant price changed. Returns updated line count. */
  async repriceVariants(variants: Array<{ variantId: string; price: number }>): Promise<number> {
    const prices = new Map(variants.map((variant) => [variant.variantId, variant.price]));
    let updated = 0;
    for (const [ownerKey, items] of this.carts) {
      const repriced = items.map((item) => {
        const price = prices.get(item.variantId);
        if (price === undefined || price === item.unitPrice) {
          return item;
        }
        updated++;
        return { ...item, unitPrice: price };
      });
      this.carts.set(ownerKey, repriced);
    }
    return updated;
  }

  private resolveOwnerKey(ownerId: string, isGuest = false): string {
    if (!ownerId) {
      throw new BadRequestException('Cart owner is required');
    }
    return isGuest ? `guest:${ownerId}` : `user:${ownerId}`;
  }

  private normalizeItem(dto: Partial<CartItem>): CartItem {
    const variantId = dto.variantId || dto.sku;
    if (!variantId) {
      throw new BadRequestException('variantId or sku is required');
    }

    return {
      variantId,
      sku: dto.sku,
      quantity: this.normalizeQuantity(dto.quantity ?? 1),
      unitPrice: dto.unitPrice,
    };
  }

  private normalizeQuantity(quantity: number): number {
    const normalized = Math.trunc(Number(quantity));
    if (!Number.isFinite(normalized) || normalized < 1) {
      throw new BadRequestException('Quantity must be greater than zero');
    }
    if (normalized > this.maxItemQuantity) {
      throw new BadRequestException('ITEM_QUANTITY_EXCEEDED');
    }
    return normalized;
  }

  private sameItem(left: CartItem, right: CartItem): boolean {
    return left.variantId === right.variantId || Boolean(left.sku && left.sku === right.sku);
  }

  private toCartView(ownerKey: string): CartView {
    const items = this.carts.get(ownerKey) || [];
    return {
      ownerKey,
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      distinctItems: items.length,
    };
  }
}
