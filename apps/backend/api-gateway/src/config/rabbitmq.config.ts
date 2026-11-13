import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  identityQueue: process.env.RABBITMQ_IDENTITY_QUEUE || 'identity_queue',
  productQueue: process.env.RABBITMQ_PRODUCT_QUEUE || 'product_queue',
  categoryQueue: process.env.RABBITMQ_CATEGORY_QUEUE || 'category_queue',
  inventoryQueue: process.env.RABBITMQ_INVENTORY_QUEUE || 'inventory_queue',
  cartQueue: process.env.RABBITMQ_CART_QUEUE || 'cart_queue',
  orderQueue: process.env.RABBITMQ_ORDER_QUEUE || 'order_queue',
  paymentQueue: process.env.RABBITMQ_PAYMENT_QUEUE || 'payment_queue',
  shippingQueue: process.env.RABBITMQ_SHIPPING_QUEUE || 'shipping_queue',
  couponQueue: process.env.RABBITMQ_COUPON_QUEUE || 'coupon_queue',
  notificationQueue: process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification_queue',
}));
