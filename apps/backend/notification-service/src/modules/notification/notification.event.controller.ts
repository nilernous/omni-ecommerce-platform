import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import {
  OrderCreatedPayload,
  PasswordChangedPayload,
  PaymentCompletedPayload,
  ShipmentPayload,
  UserRegisteredPayload,
} from '@omnicommerce/events';
import { NotificationService } from './notification.service';
import { RecipientResolver } from './recipient.resolver';

/**
 * Domain event consumers (NOTIF-BR-08 .. NOTIF-BR-12). All of these are transactional
 * notifications, so the marketing opt-out check (NOTIF-BR-05) does not apply (NOTIF-BR-04).
 */
@Controller()
export class NotificationEventController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly recipients: RecipientResolver,
  ) {}

  // NOTIF-BR-08
  @EventPattern(DomainEvents.AUTH_USER_REGISTERED)
  async handleUserRegistered(@Payload() data: UserRegisteredPayload) {
    await this.notificationService.send('EMAIL', {
      userId: data.userId,
      to: data.email,
      template: 'welcome',
      subject: 'Welcome to OmniCommerce',
      body: `Hi ${data.firstName}, your account is ready.`,
      payload: data,
    });
  }

  // NOTIF-BR-09
  @EventPattern(DomainEvents.AUTH_PASSWORD_CHANGED)
  async handlePasswordChanged(@Payload() data: PasswordChangedPayload) {
    await this.notificationService.send('EMAIL', {
      userId: data.userId,
      to: data.email,
      template: 'password-changed',
      subject: 'Your password was changed',
      body: 'If this was not you, reset your password immediately.',
      payload: data,
    });
  }

  // NOTIF-BR-10
  @EventPattern(DomainEvents.ORDER_CREATED)
  async handleOrderCreated(@Payload() data: OrderCreatedPayload) {
    const recipient = await this.recipients.byUserId(data.userId);
    const subject = `Order ${data.orderNumber} received`;
    const body = `We received your order ${data.orderNumber} (total ${data.totalAmount}).`;
    await this.notificationService.send('EMAIL', { userId: data.userId, to: recipient.email, template: 'order-confirmation', subject, body, payload: data });
    await this.notificationService.send('PUSH', { userId: data.userId, template: 'order-confirmation', subject, body, payload: { orderId: data.orderId } });
  }

  // NOTIF-BR-11
  @EventPattern(DomainEvents.PAYMENT_COMPLETED)
  async handlePaymentCompleted(@Payload() data: PaymentCompletedPayload) {
    const recipient = await this.recipients.byOrderId(data.orderId);
    await this.notificationService.send('EMAIL', {
      userId: recipient.userId,
      to: recipient.email,
      template: 'payment-receipt',
      subject: `Payment receipt for order ${recipient.orderNumber ?? data.orderId}`,
      body: `We received your payment of ${data.amount} (transaction ${data.transactionId}).`,
      payload: data,
    });
  }

  // NOTIF-BR-12
  @EventPattern(DomainEvents.SHIPPING_DISPATCHED)
  async handleShippingDispatched(@Payload() data: ShipmentPayload) {
    const recipient = await this.recipients.byOrderId(data.orderId);
    const subject = `Order ${recipient.orderNumber ?? data.orderId} has shipped`;
    const body = `Carrier ${data.carrier}, tracking number ${data.trackingNumber ?? 'pending'}.`;
    await this.notificationService.send('EMAIL', { userId: recipient.userId, to: recipient.email, template: 'shipment-tracking', subject, body, payload: data });
    if (recipient.phoneNumber) {
      await this.notificationService.send('SMS', { userId: recipient.userId, to: recipient.phoneNumber, template: 'shipment-tracking', body: `${subject}. ${body}`, payload: data });
    }
  }
}
