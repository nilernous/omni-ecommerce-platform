# OmniCommerce Platform - Domain Event List

> **Document Version:** `1.1.0`  
> **Last Updated:** `2026-11-13`  
> **Status:** `DRAFT`  
> **Scope:** Every RabbitMQ domain event: producer, consumers, business rules, and implementation status in code  
> **Target Directory:** `docs/02-backend/`  
> **Related Architecture Docs:** [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md), [BUSINESS_RULE_CATALOG.md](./BUSINESS_RULE_CATALOG.md), [USE_CASE_CATALOG.md](./USE_CASE_CATALOG.md)

---

## 1. Purpose & Source of Truth

This document is the **single list of domain events** for the platform. Use it to look up an event's exact routing key, the service that publishes it, and every service that consumes it.

- **Source of truth:** each event's routing key, producer, and consumers come from the business rules in [`.agent/business-rules/`](../../.agent/business-rules/README.md). When documents conflict, business rules win over other documentation (see [`.agent/workflows/context.md`](../../.agent/workflows/context.md)).
- **Topology, envelope, retries:** see [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md). This list does not repeat them.
- **Code status:** the *Code* columns reflect the repository on the date above (`packages/constants`, `packages/events`, `@EventPattern` handlers).
- **Keep it in sync:** a new or renamed event must update, in the same change:
  - this list,
  - the producing and consuming business rules,
  - `DomainEvents` in `packages/constants/src/index.ts`,
  - `DomainEventPayloadMap` in `packages/events/src/payloads.ts`.

---

## 2. Broker Conventions (as implemented)

| Item | Value | Code reference |
|---|---|---|
| Domain event exchange | `omni.domain.events` (`topic`) | `AMQP_EXCHANGES.DOMAIN_EVENTS` |
| Dead letter exchange | `omni.dead.letter` (`direct`) | `AMQP_EXCHANGES.DEAD_LETTER` |
| Routing key | Equal to the event name, e.g. `order.created` | `DomainEvents` enum |
| Consumer queue | `omni.{consumer}.{event-name}.queue`, e.g. `omni.inventory.order-created.queue` | `eventQueueName()` |
| Consumer DLQ | `omni.{consumer}.{event-name}.dlq` | `eventDeadLetterQueueName()` |
| Envelope | `eventId`, `eventType`, `eventVersion`, `producer`, `timestamp`, `correlationId`, `payload` | `BaseDomainEvent`, `createEnvelope()` |
| Publisher | `DomainEventPublisher.publish(eventType, payload)`, typed by `DomainEventPayloadMap` | `EventBusModule.forRoot({ serviceName })` |
| Consumer | Any `@EventPattern(DomainEvents.X)` handler. `DomainEventServer` declares and binds its queue | `connectRabbitMq()` in each `main.ts` |
| Consumer retries | 5 attempts (immediately, then after 2s / 4s / 8s / 16s), then `NACK` → DLQ | `DomainEventServer` |
| RPC (gateway → service) | RabbitMQ request/response on the service's queue in `RPC_QUEUES` | `connectRabbitMq()` |

**Delivery semantics:** events are published **after** the local state change is committed. The transactional outbox is not implemented yet, so:
- if the broker is unreachable for longer than the publish timeout (5s), the event is logged and lost;
- the business operation still succeeds.

Consumers are written to tolerate redelivery: they are idempotent per `orderId` / `reservationId` and skip invalid state transitions.

Notification dispatch uses its own internal exchanges (`omni.notification.dispatch`, `omni.notification.retry`). These carry jobs, not domain events. See [EVENT_ARCHITECTURE.md §7.4](./EVENT_ARCHITECTURE.md).

---

## 3. Event Index

Every routing key below exists in `DomainEvents` and has a payload contract in `packages/events/src/payloads.ts`.

- **Published:** whether the producer service publishes the event today.
- **Handled by:** the consumers that have an `@EventPattern` handler.
- ✅ implemented, ❌ missing.

### 3.1 Identity Service: Auth module (`identity-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `auth.user.registered` | `AUTH-BR-16` | ✅ `AuthService.register` | Notification (`NOTIF-BR-08`), Analytics (`ANL-BR-12`, see §5.1) | ✅ Notification, ✅ Analytics | `UserRegisteredPayload` |
| `auth.password.changed` | `AUTH-BR-17` | ✅ `AuthService.resetPassword` | Notification (`NOTIF-BR-09`) | ✅ Notification | `PasswordChangedPayload` |
| `auth.session.revoked` | `AUTH-BR-18` | ✅ `AuthService.logout` | — | — | `SessionRevokedPayload` |

### 3.2 Identity Service: User module (`identity-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `user.profile.updated` | `USER-BR-14` | ✅ `UserService.updateProfile` | — | — | `UserProfileUpdatedPayload` |
| `user.address.updated` | `USER-BR-15` | ✅ add / update / delete address | — | — | `UserAddressUpdatedPayload` |

### 3.3 Product Service: Catalog module (`product-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `product.created` | `PRD-BR-13` | ✅ `ProductService.create` | Search (`SRCH-BR-08`), Analytics (`ANL-BR-13`) | ✅ Search, ✅ Analytics | `ProductChangedPayload` |
| `product.updated` | `PRD-BR-14` | ✅ `update`, approval | Search (`SRCH-BR-09`), Cart (`CART-BR-12`) | ✅ Search, ✅ Cart | `ProductChangedPayload` (includes variant prices) |
| `product.deleted` | `PRD-BR-15` | ✅ reject / delete / archive | Search (`SRCH-BR-10`) | ✅ Search | `ProductDeletedPayload` |
| `product.approved` | `PRD-BR-16` | ✅ `setApprovalStatus(true)` | — | — | `ProductApprovedPayload` |

### 3.4 Product Service: Review module (`product-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `review.submitted` | `REV-BR-10` | ✅ `ReviewService.createReview` | — | — | `ReviewSubmittedPayload` |
| `review.approved` | `REV-BR-11` | ✅ `moderateReview(APPROVED)` | — (rating update is in-transaction, `REV-BR-09`) | — | `ReviewApprovedPayload` |

### 3.5 Inventory Service (`inventory-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `inventory.reserved` | `INV-BR-09` | ✅ on `order.created` | — | — | `InventoryOrderPayload` |
| `inventory.released` | `INV-BR-10` | ✅ on `order.cancelled` | — | — | `InventoryOrderPayload` |
| `inventory.deducted` | `INV-BR-11` | ✅ on `payment.completed` | — | — | `InventoryOrderPayload` |
| `inventory.low_stock` | `INV-BR-12` | ✅ after deduction, stock ≤ threshold | — | — | `InventoryLowStockPayload` |

### 3.6 Cart Service (`cart-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `cart.item_added` | `CART-BR-10` | ✅ `CartService.addItem` | Analytics (mentioned in `CART-BR-10`, no `ANL-BR` rule) | ❌ | `CartItemAddedPayload` |
| `cart.cleared` | `CART-BR-11` | ✅ `CartService.clearCart` | — | — | `CartClearedPayload` |

### 3.7 Order Service (`order-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `order.created` | `ORD-BR-15` | ✅ `OrderService.createOrder` | Inventory (`INV-BR-13`), Payment (`PAY-BR-19`), Promotion (`PROM-BR-13`), Notification (`NOTIF-BR-10`), Analytics (`ANL-BR-09`), Cart (`CART-BR-13`, see §5.1) | ✅ all six | `OrderCreatedPayload` |
| `order.paid` | `ORD-BR-16` | ✅ status → `PAID` | Shipping (`SHIP-BR-18`), Analytics (`ANL-BR-10`) | ✅ Shipping, ✅ Analytics | `OrderStatusPayload` |
| `order.shipped` | `ORD-BR-17` | ✅ status → `SHIPPED` | — | — | `OrderStatusPayload` |
| `order.delivered` | `ORD-BR-18` | ✅ status → `DELIVERED` | Product · Review (`REV-BR-12`) | ✅ Review | `OrderStatusPayload` |
| `order.cancelled` | `ORD-BR-19` | ✅ status → `CANCELLED` | Inventory (`INV-BR-15`), Payment (`PAY-BR-20`), Promotion (`PROM-BR-14`), Analytics (`ANL-BR-11`) | ✅ all four | `OrderCancelledPayload` |

### 3.8 Payment Service (`payment-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `payment.completed` | `PAY-BR-16` | ✅ `processPayment`, webhook `COMPLETED` | Order (`ORD-BR-20`), Inventory (`INV-BR-14`), Notification (`NOTIF-BR-11`) | ✅ all three | `PaymentCompletedPayload` |
| `payment.failed` | `PAY-BR-17` | ✅ `markPaymentFailed`, webhook `FAILED` | Order (`ORD-BR-21`) | ✅ Order | `PaymentFailedPayload` |
| `payment.refunded` | `PAY-BR-18` | ✅ `refundPayment` | — | — | `PaymentRefundedPayload` |

### 3.9 Shipping Service (`shipping-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `shipping.label_created` | `SHIP-BR-15` | ✅ `generateLabel` | — | — | `ShippingLabelCreatedPayload` |
| `shipping.dispatched` | `SHIP-BR-16` | ✅ shipment → `IN_TRANSIT` | Order (`ORD-BR-22`), Notification (`NOTIF-BR-12`) | ✅ Order, ✅ Notification | `ShipmentPayload` |
| `shipping.delivered` | `SHIP-BR-17` | ✅ shipment → `DELIVERED` | Order (implied by `SHIP-BR-17`, see §5.1) | ✅ Order | `ShipmentPayload` |

### 3.10 Promotion Service (`promotion-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `promotion.coupon_redeemed` | `PROM-BR-11` | ✅ `redeemCoupon` | — | — | `CouponRedeemedPayload` |
| `promotion.flash_sale_started` | `PROM-BR-12` | ✅ `scheduleFlashSale` (when active now) | — | — | `FlashSaleStartedPayload` |

### 3.11 Media Service (`media-service`)

| Routing Key | Producer Rule | Published | Consumers (Rule) | Handled by | Payload |
|---|---|---|---|---|---|
| `media.uploaded` | `MED-BR-08` | ✅ `MediaService.upload` | — | — | `MediaUploadedPayload` |
| `media.deleted` | `MED-BR-09` | ✅ `MediaService.delete` | — | — | `MediaDeletedPayload` |

### 3.12 Search, Notification & Analytics Services

These services publish no domain events in the business rules. They only consume.

---

## 4. Consumer View

The events each service subscribes to in code. Each event gets its own `omni.{consumer}.{event}.queue`.

| Consumer Service | Subscribes To |
|---|---|
| `identity-service` | — |
| `product-service` | `order.delivered` (Review module) |
| `inventory-service` | `order.created`, `order.cancelled`, `payment.completed` |
| `cart-service` | `order.created`, `product.updated` |
| `order-service` | `payment.completed`, `payment.failed`, `shipping.dispatched`, `shipping.delivered` |
| `payment-service` | `order.created`, `order.cancelled` |
| `shipping-service` | `order.paid` |
| `promotion-service` | `order.created`, `order.cancelled` |
| `search-service` | `product.created`, `product.updated`, `product.deleted` |
| `notification-service` | `auth.user.registered`, `auth.password.changed`, `order.created`, `payment.completed`, `shipping.dispatched` |
| `analytics-service` | `auth.user.registered`, `order.created`, `order.paid`, `order.cancelled`, `product.created` |

---

## 5. Known Discrepancies (to resolve)

### 5.1 Business rules that disagree with the implementation

The code follows the likely intent. The rule text still needs updating.

| Rule | Rule says | Code uses | Why |
|---|---|---|---|
| `CART-BR-13` | consumes `order.placed` | `order.created` | No service publishes `order.placed` |
| `ANL-BR-12` | consumes `user.registered` | `auth.user.registered` | Producer key is `auth.user.registered` (`AUTH-BR-16`) |
| `SHIP-BR-17` / `ORD-BR-*` | `shipping.delivered` "triggers order status `DELIVERED`" but no `ORD-BR` consumer rule exists | Order consumes `shipping.delivered` | Needed so `order.delivered` (`REV-BR-12`) is ever emitted |
| `SRCH-BR-11` | consumes `inventory.updated` | not subscribed | Inventory publishes no `inventory.updated` event |

### 5.2 Events listed only in EVENT_ARCHITECTURE.md §5

[EVENT_ARCHITECTURE.md §5](./EVENT_ARCHITECTURE.md) lists these events, but no business rule defines them. Either add rules for them or remove them from §5:

`auth.user.logged-in`, `auth.password.reset-requested`, `user.created`, `user.updated`, `inventory.updated`, `cart.checked-out`, `order.confirmed`, `order.completed`, `payment.refund-completed` (rules use `payment.refunded`), `shipping.created`, `promotion.created`, `promotion.expired`, `review.created` (rules use `review.submitted`), `search.indexed`, `notification.sent`, `analytics.aggregated`.

### 5.3 Trace matrix errors in BUSINESS_RULE_CATALOG.md §4

| Row in matrix | Problem |
|---|---|
| `payment.failed` → Inventory (`INV-BR-15`) | `INV-BR-15` consumes `order.cancelled`, not `payment.failed` |
| `shipping.delivered` → Order (`ORD-BR-18`) | `ORD-BR-18` is the `order.delivered` *emission* rule, not a consumer |
| `shipping.delivered` → Product (`REV-BR-12`) | `REV-BR-12` consumes `order.delivered` |
| *(missing)* | `order.paid` → Shipping (`SHIP-BR-18`), Analytics (`ANL-BR-10`); `order.cancelled` → Analytics (`ANL-BR-11`) |

### 5.4 Naming convention

[EVENT_ARCHITECTURE.md §3.3](./EVENT_ARCHITECTURE.md) requires `kebab-case` segments, but these rule-defined keys use `snake_case`: `cart.item_added`, `inventory.low_stock`, `shipping.label_created`, `promotion.coupon_redeemed`, `promotion.flash_sale_started`.

### 5.5 Not implemented yet

- **Transactional outbox** (`EVENT_ARCHITECTURE.md §6.1`): events are published after commit, without an outbox table.
- **Consumer idempotency store** (`§7.1`, Redis `SET NX` on `eventId`): consumers are idempotent by business key only.
- **Envelope `traceContext`** (`§4.1`): not populated.

---

## 6. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.1.0 | 2026-11-13 | All rule-defined events are published and consumed over RabbitMQ. Constants and payload contracts are complete. Code-only handler patterns were removed. Discrepancies were re-scoped to the business rule text. |
| 1.0.0 | 2026-11-13 | Initial list built from business rules and cross-checked against code. Renamed `shipment.dispatched` to `shipping.dispatched` in `DomainEvents`. Exchange names aligned to `omni.domain.events` / `omni.dead.letter`. |
