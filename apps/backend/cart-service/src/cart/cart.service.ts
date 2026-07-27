import { Injectable } from '@nestjs/common';
import { AddToCartDto } from '@omnicommerce/dto';

interface CartItem {
  variantId: string;
  quantity: number;
}

@Injectable()
export class CartService {
  // In-memory / Redis abstraction for shopping cart storage
  private carts = new Map<string, CartItem[]>();

  async getCart(userId: string): Promise<CartItem[]> {
    return this.carts.get(userId) || [];
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartItem[]> {
    const userCart = this.carts.get(userId) || [];
    const existingIndex = userCart.findIndex((item) => item.variantId === dto.variantId);

    if (existingIndex > -1) {
      userCart[existingIndex].quantity += dto.quantity;
    } else {
      userCart.push({ variantId: dto.variantId, quantity: dto.quantity });
    }

    this.carts.set(userId, userCart);
    return userCart;
  }

  async removeItem(userId: string, variantId: string): Promise<CartItem[]> {
    let userCart = this.carts.get(userId) || [];
    userCart = userCart.filter((item) => item.variantId !== variantId);
    this.carts.set(userId, userCart);
    return userCart;
  }

  async clearCart(userId: string): Promise<boolean> {
    this.carts.delete(userId);
    return true;
  }
}
