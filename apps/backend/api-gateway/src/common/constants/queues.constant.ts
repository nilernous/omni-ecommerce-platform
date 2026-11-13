import { RPC_QUEUES } from '@omnicommerce/constants';

// RPC queues each backend service consumes (single source of truth: @omnicommerce/constants).
// identity-service owns the auth and user domains.
export const IDENTITY_QUEUE = RPC_QUEUES.IDENTITY;
// product-service owns the catalog (products + categories) and review domains.
export const PRODUCT_QUEUE = RPC_QUEUES.PRODUCT;
export const CATEGORY_QUEUE = RPC_QUEUES.PRODUCT;
export const INVENTORY_QUEUE = RPC_QUEUES.INVENTORY;
export const CART_QUEUE = RPC_QUEUES.CART;
export const ORDER_QUEUE = RPC_QUEUES.ORDER;
export const PAYMENT_QUEUE = RPC_QUEUES.PAYMENT;
export const SHIPPING_QUEUE = RPC_QUEUES.SHIPPING;
// Coupons are served by promotion-service.
export const COUPON_QUEUE = RPC_QUEUES.PROMOTION;
export const NOTIFICATION_QUEUE = RPC_QUEUES.NOTIFICATION;
export const ANALYTICS_QUEUE = RPC_QUEUES.ANALYTICS;
