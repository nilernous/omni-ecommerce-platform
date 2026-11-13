import { registerAs } from '@nestjs/config';
import { RPC_QUEUES } from '@omnicommerce/constants';

export default registerAs('rabbitmq', () => ({
  // RABBITMQ_URL is shared with the backend services; RABBITMQ_URI is kept for backward compatibility.
  uri: process.env.RABBITMQ_URL || process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  identityQueue: process.env.RABBITMQ_IDENTITY_QUEUE || RPC_QUEUES.IDENTITY,
  productQueue: process.env.RABBITMQ_PRODUCT_QUEUE || RPC_QUEUES.PRODUCT,
  categoryQueue: process.env.RABBITMQ_CATEGORY_QUEUE || RPC_QUEUES.PRODUCT,
  inventoryQueue: process.env.RABBITMQ_INVENTORY_QUEUE || RPC_QUEUES.INVENTORY,
  cartQueue: process.env.RABBITMQ_CART_QUEUE || RPC_QUEUES.CART,
  orderQueue: process.env.RABBITMQ_ORDER_QUEUE || RPC_QUEUES.ORDER,
  paymentQueue: process.env.RABBITMQ_PAYMENT_QUEUE || RPC_QUEUES.PAYMENT,
  shippingQueue: process.env.RABBITMQ_SHIPPING_QUEUE || RPC_QUEUES.SHIPPING,
  couponQueue: process.env.RABBITMQ_COUPON_QUEUE || RPC_QUEUES.PROMOTION,
  notificationQueue: process.env.RABBITMQ_NOTIFICATION_QUEUE || RPC_QUEUES.NOTIFICATION,
  analyticsQueue: process.env.RABBITMQ_ANALYTICS_QUEUE || RPC_QUEUES.ANALYTICS,
}));
