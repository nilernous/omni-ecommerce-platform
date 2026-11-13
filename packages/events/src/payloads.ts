import { DomainEvents } from '@omnicommerce/constants';

/** Line item shared by order / inventory events. */
export interface EventLineItem {
  variantId: string;
  quantity: number;
  unitPrice?: number;
}

// ---------------------------------------------------------------------------
// identity-service
// ---------------------------------------------------------------------------
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface PasswordChangedPayload {
  userId: string;
  email: string;
}

export interface SessionRevokedPayload {
  userId: string;
}

export interface UserProfileUpdatedPayload {
  userId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
}

export interface UserAddressUpdatedPayload {
  userId: string;
  addressId: string;
  action: 'ADDED' | 'UPDATED' | 'DELETED';
  isDefault?: boolean;
}

// ---------------------------------------------------------------------------
// product-service
// ---------------------------------------------------------------------------
export interface ProductChangedPayload {
  productId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  categoryId: string;
  brandId?: string | null;
  isActive: boolean;
  variants?: Array<{ variantId: string; sku: string; price: number; stock: number }>;
}

export interface ProductDeletedPayload {
  productId: string;
}

export interface ProductApprovedPayload {
  productId: string;
}

export interface ReviewSubmittedPayload {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  verifiedPurchase: boolean;
}

export interface ReviewApprovedPayload {
  reviewId: string;
  productId: string;
  rating: number;
}

// ---------------------------------------------------------------------------
// inventory-service
// ---------------------------------------------------------------------------
export interface InventoryOrderPayload {
  orderId: string;
  items: Array<{ variantId: string; quantity: number; reservationId: string }>;
}

export interface InventoryLowStockPayload {
  variantId: string;
  sku: string;
  stock: number;
  threshold: number;
}

// ---------------------------------------------------------------------------
// cart-service
// ---------------------------------------------------------------------------
export interface CartItemAddedPayload {
  ownerKey: string;
  variantId: string;
  quantity: number;
}

export interface CartClearedPayload {
  ownerKey: string;
}

// ---------------------------------------------------------------------------
// order-service
// ---------------------------------------------------------------------------
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  paymentMethod?: string;
  couponCode?: string;
  items: EventLineItem[];
}

export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  items: EventLineItem[];
}

export interface OrderCancelledPayload extends OrderStatusPayload {
  reason?: string;
}

// ---------------------------------------------------------------------------
// payment-service
// ---------------------------------------------------------------------------
export interface PaymentCompletedPayload {
  paymentId: string;
  orderId: string;
  transactionId: string;
  amount: number;
}

export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  reason: string;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  orderId: string;
  refundId: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// shipping-service
// ---------------------------------------------------------------------------
export interface ShipmentPayload {
  shipmentId: string;
  orderId: string;
  carrier: string;
  trackingNumber: string | null;
}

export interface ShippingLabelCreatedPayload extends ShipmentPayload {
  labelUrl: string;
}

// ---------------------------------------------------------------------------
// promotion-service
// ---------------------------------------------------------------------------
export interface CouponRedeemedPayload {
  code: string;
  userId: string;
  orderId: string;
  discountAmount: number;
}

export interface FlashSaleStartedPayload {
  flashSaleId: string;
  startsAt?: string;
  endsAt?: string;
}

// ---------------------------------------------------------------------------
// media-service
// ---------------------------------------------------------------------------
export interface MediaUploadedPayload {
  mediaId: string;
  ownerId?: string;
  url: string;
  mimeType: string;
  thumbnails: Record<string, string>;
}

export interface MediaDeletedPayload {
  mediaId: string;
}

/** Maps every routing key to its payload contract, so publishers are type-checked. */
export interface DomainEventPayloadMap {
  [DomainEvents.AUTH_USER_REGISTERED]: UserRegisteredPayload;
  [DomainEvents.AUTH_PASSWORD_CHANGED]: PasswordChangedPayload;
  [DomainEvents.AUTH_SESSION_REVOKED]: SessionRevokedPayload;
  [DomainEvents.USER_PROFILE_UPDATED]: UserProfileUpdatedPayload;
  [DomainEvents.USER_ADDRESS_UPDATED]: UserAddressUpdatedPayload;
  [DomainEvents.PRODUCT_CREATED]: ProductChangedPayload;
  [DomainEvents.PRODUCT_UPDATED]: ProductChangedPayload;
  [DomainEvents.PRODUCT_DELETED]: ProductDeletedPayload;
  [DomainEvents.PRODUCT_APPROVED]: ProductApprovedPayload;
  [DomainEvents.REVIEW_SUBMITTED]: ReviewSubmittedPayload;
  [DomainEvents.REVIEW_APPROVED]: ReviewApprovedPayload;
  [DomainEvents.INVENTORY_RESERVED]: InventoryOrderPayload;
  [DomainEvents.INVENTORY_RELEASED]: InventoryOrderPayload;
  [DomainEvents.INVENTORY_DEDUCTED]: InventoryOrderPayload;
  [DomainEvents.INVENTORY_LOW_STOCK]: InventoryLowStockPayload;
  [DomainEvents.CART_ITEM_ADDED]: CartItemAddedPayload;
  [DomainEvents.CART_CLEARED]: CartClearedPayload;
  [DomainEvents.ORDER_CREATED]: OrderCreatedPayload;
  [DomainEvents.ORDER_PAID]: OrderStatusPayload;
  [DomainEvents.ORDER_SHIPPED]: OrderStatusPayload;
  [DomainEvents.ORDER_DELIVERED]: OrderStatusPayload;
  [DomainEvents.ORDER_CANCELLED]: OrderCancelledPayload;
  [DomainEvents.PAYMENT_COMPLETED]: PaymentCompletedPayload;
  [DomainEvents.PAYMENT_FAILED]: PaymentFailedPayload;
  [DomainEvents.PAYMENT_REFUNDED]: PaymentRefundedPayload;
  [DomainEvents.SHIPPING_LABEL_CREATED]: ShippingLabelCreatedPayload;
  [DomainEvents.SHIPPING_DISPATCHED]: ShipmentPayload;
  [DomainEvents.SHIPPING_DELIVERED]: ShipmentPayload;
  [DomainEvents.PROMOTION_COUPON_REDEEMED]: CouponRedeemedPayload;
  [DomainEvents.PROMOTION_FLASH_SALE_STARTED]: FlashSaleStartedPayload;
  [DomainEvents.MEDIA_UPLOADED]: MediaUploadedPayload;
  [DomainEvents.MEDIA_DELETED]: MediaDeletedPayload;
}
