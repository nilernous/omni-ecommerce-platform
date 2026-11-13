export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  SUPPORT = 'SUPPORT',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ShippingStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

/**
 * Routing keys of every domain event published on AMQP_EXCHANGES.DOMAIN_EVENTS.
 * Source of truth: docs/02-backend/EVENT_LIST.md (built from .agent/business-rules).
 */
export enum DomainEvents {
  // identity-service: Auth module
  AUTH_USER_REGISTERED = 'auth.user.registered',
  AUTH_PASSWORD_CHANGED = 'auth.password.changed',
  AUTH_SESSION_REVOKED = 'auth.session.revoked',
  // identity-service: User module
  USER_PROFILE_UPDATED = 'user.profile.updated',
  USER_ADDRESS_UPDATED = 'user.address.updated',
  // product-service: Catalog module
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_APPROVED = 'product.approved',
  // product-service: Review module
  REVIEW_SUBMITTED = 'review.submitted',
  REVIEW_APPROVED = 'review.approved',
  // inventory-service
  INVENTORY_RESERVED = 'inventory.reserved',
  INVENTORY_RELEASED = 'inventory.released',
  INVENTORY_DEDUCTED = 'inventory.deducted',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  // cart-service
  CART_ITEM_ADDED = 'cart.item_added',
  CART_CLEARED = 'cart.cleared',
  // order-service
  ORDER_CREATED = 'order.created',
  ORDER_PAID = 'order.paid',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  // payment-service
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  // shipping-service
  SHIPPING_LABEL_CREATED = 'shipping.label_created',
  SHIPPING_DISPATCHED = 'shipping.dispatched',
  SHIPPING_DELIVERED = 'shipping.delivered',
  // promotion-service
  PROMOTION_COUPON_REDEEMED = 'promotion.coupon_redeemed',
  PROMOTION_FLASH_SALE_STARTED = 'promotion.flash_sale_started',
  // media-service
  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_DELETED = 'media.deleted',
}

export const AMQP_EXCHANGES = {
  /** Topic exchange for all domain events (routing key = DomainEvents value). */
  DOMAIN_EVENTS: 'omni.domain.events',
  /** Direct exchange receiving rejected domain events (routing key = consumer DLQ name). */
  DEAD_LETTER: 'omni.dead.letter',
};

/** RabbitMQ queues used for request/response (RPC) calls from the API Gateway to each service. */
export const RPC_QUEUES = {
  IDENTITY: 'identity_queue',
  PRODUCT: 'product_queue',
  INVENTORY: 'inventory_queue',
  CART: 'cart_queue',
  ORDER: 'order_queue',
  PAYMENT: 'payment_queue',
  SHIPPING: 'shipping_queue',
  PROMOTION: 'promotion_queue',
  MEDIA: 'media_queue',
  SEARCH: 'search_queue',
  NOTIFICATION: 'notification_queue',
  ANALYTICS: 'analytics_queue',
} as const;

export const CORRELATION_ID_HEADER = 'x-correlation-id';
