import { DomainEvents } from '@omnicommerce/constants';

export interface BaseDomainEvent<T = any> {
  eventId: string;
  eventType: DomainEvents;
  timestamp: string;
  correlationId?: string;
  payload: T;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PaymentCompletedPayload {
  paymentId: string;
  orderId: string;
  transactionId: string;
  amount: number;
}
