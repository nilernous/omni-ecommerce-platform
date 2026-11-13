# OmniCommerce Platform - Domain Event List

> **Document Version:** `1.0.0`  
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
- **Code status:** columns marked *Code* reflect the repository on the date above (`packages/constants`, `packages/events`, `@EventPattern` handlers).
- **Keep it in sync:** a new event, or a renamed one, must update this list, the producing and consuming business rules, and `DomainEvents` in `packages/constants/src/index.ts` together.

---

## 2. Broker Conventions (as implemented)

| Item | Value | Code reference |
|---|---|---|
| Domain event exchange | `omni.domain.events` (`topic`) | `AMQP_EXCHANGES.DOMAIN_EVENTS` |
| Dead letter exchange | `omni.dead.letter` | `AMQP_EXCHANGES.DEAD_LETTER` |
| Routing key | Equal to the event name, e.g. `order.created` | `DomainEvents` enum |
| Consumer queue | `omni.{consumer_service}.{event-name}.queue`, e.g. `omni.inventory.order-created.queue` | — |
| Consumer DLQ | `omni.{consumer_service}.{event-name}.dlq` | — |
| Envelope | `eventId`, `eventType`, `timestamp`, `correlationId`, `payload` | `BaseDomainEvent` in `packages/events` |

Notification dispatch uses its own internal exchanges (`omni.notification.dispatch`, `omni.notification.retry`). These carry jobs, not domain events, and are documented in [EVENT_ARCHITECTURE.md §7.4](./EVENT_ARCHITECTURE.md).

---

## 3. Event Index

Legend for the *Code* columns: ✅ implemented, ❌ missing, ➖ not applicable.

- **Constant:** whether the routing key exists in `DomainEvents` (`packages/constants`).
- **Handlers:** consumers that already have an `@EventPattern` handler for the exact routing key.
- **Payload:** contract interface in `packages/events`, or `TODO`.

### 3.1 Identity Service: Auth module (`identity-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `auth.user.registered` | `AUTH-BR-16` | Notification (`NOTIF-BR-08`) | ❌ (enum has `user.registered`) | ❌ | `UserRegisteredPayload` |
| `auth.password.changed` | `AUTH-BR-17` | Notification (`NOTIF-BR-09`) | ❌ | ❌ | TODO |
| `auth.session.revoked` | `AUTH-BR-18` | — | ❌ | ➖ | TODO |

### 3.2 Identity Service: User module (`identity-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `user.profile.updated` | `USER-BR-14` | — | ❌ | ➖ | TODO |
| `user.address.updated` | `USER-BR-15` | — | ❌ | ➖ | TODO |

### 3.3 Product Service: Catalog module (`product-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `product.created` | `PRD-BR-13` | Search (`SRCH-BR-08`), Analytics (`ANL-BR-13`) | ❌ | ✅ Search, ✅ Analytics | TODO |
| `product.updated` | `PRD-BR-14` | Search (`SRCH-BR-09`), Cart (`CART-BR-12`) | ✅ `PRODUCT_UPDATED` | ✅ Search, ❌ Cart | TODO |
| `product.deleted` | `PRD-BR-15` | Search (`SRCH-BR-10`) | ❌ | ✅ Search | TODO |
| `product.approved` | `PRD-BR-16` | — | ❌ | ➖ | TODO |

### 3.4 Product Service: Review module (`product-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `review.submitted` | `REV-BR-10` | — | ❌ | ➖ | TODO |
| `review.approved` | `REV-BR-11` | — (rating update is in-transaction, `REV-BR-09`) | ❌ | ➖ | TODO |

### 3.5 Inventory Service (`inventory-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `inventory.reserved` | `INV-BR-09` | — | ✅ `INVENTORY_RESERVED` | ➖ | TODO |
| `inventory.released` | `INV-BR-10` | — | ✅ `INVENTORY_RELEASED` | ➖ | TODO |
| `inventory.deducted` | `INV-BR-11` | — | ❌ | ➖ | TODO |
| `inventory.low_stock` | `INV-BR-12` | — | ❌ | ➖ | TODO |

### 3.6 Cart Service (`cart-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `cart.item_added` | `CART-BR-10` | Analytics (mentioned in `CART-BR-10`, no `ANL-BR` rule) | ❌ | ❌ | TODO |
| `cart.cleared` | `CART-BR-11` | — | ❌ | ➖ | TODO |

### 3.7 Order Service (`order-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `order.created` | `ORD-BR-15` | Inventory (`INV-BR-13`), Payment (`PAY-BR-19`), Promotion (`PROM-BR-13`), Notification (`NOTIF-BR-10`), Analytics (`ANL-BR-09`) | ✅ `ORDER_CREATED` | ✅ Inventory, ✅ Payment, ❌ Promotion, ❌ Notification, ✅ Analytics (also ✅ Cart, without a rule) | `OrderCreatedPayload` |
| `order.paid` | `ORD-BR-16` | Shipping (`SHIP-BR-18`), Analytics (`ANL-BR-10`) | ❌ | ❌ Shipping, ✅ Analytics | TODO |
| `order.shipped` | `ORD-BR-17` | — | ❌ | ➖ | TODO |
| `order.delivered` | `ORD-BR-18` | Product · Review (`REV-BR-12`) | ❌ | ❌ | TODO |
| `order.cancelled` | `ORD-BR-19` | Inventory (`INV-BR-15`), Payment (`PAY-BR-20`), Promotion (`PROM-BR-14`), Analytics (`ANL-BR-11`) | ✅ `ORDER_CANCELLED` | ❌ Inventory, ❌ Payment, ❌ Promotion, ✅ Analytics | TODO |

### 3.8 Payment Service (`payment-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `payment.completed` | `PAY-BR-16` | Order (`ORD-BR-20`), Inventory (`INV-BR-14`), Notification (`NOTIF-BR-11`) | ✅ `PAYMENT_COMPLETED` | ❌ Order, ❌ Inventory, ❌ Notification | `PaymentCompletedPayload` |
| `payment.failed` | `PAY-BR-17` | Order (`ORD-BR-21`) | ✅ `PAYMENT_FAILED` | ❌ | TODO |
| `payment.refunded` | `PAY-BR-18` | — | ❌ | ➖ | TODO |

### 3.9 Shipping Service (`shipping-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `shipping.label_created` | `SHIP-BR-15` | — | ❌ | ➖ | TODO |
| `shipping.dispatched` | `SHIP-BR-16` | Order (`ORD-BR-22`), Notification (`NOTIF-BR-12`) | ✅ `SHIPPING_DISPATCHED` | ❌ Order, ❌ Notification | TODO |
| `shipping.delivered` | `SHIP-BR-17` | Order (implied by `SHIP-BR-17`, no `ORD-BR` consumer rule) | ❌ | ❌ | TODO |

### 3.10 Promotion Service (`promotion-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `promotion.coupon_redeemed` | `PROM-BR-11` | — | ❌ | ➖ | TODO |
| `promotion.flash_sale_started` | `PROM-BR-12` | — | ❌ | ➖ | TODO |

### 3.11 Media Service (`media-service`)

| Routing Key | Producer Rule | Consumers (Rule) | Constant | Handlers | Payload |
|---|---|---|---|---|---|
| `media.uploaded` | `MED-BR-08` | — | ❌ | ➖ | TODO |
| `media.deleted` | `MED-BR-09` | — | ❌ | ➖ | TODO |

### 3.12 Search, Notification & Analytics Services

These services publish no domain events in the business rules. They are consumers only.

---

## 4. Consumer View

For each service, the events it must subscribe to, per business rules.

| Consumer Service | Subscribes To |
|---|---|
| `identity-service` | — |
| `product-service` | `order.delivered` (Review module, `REV-BR-12`) |
| `inventory-service` | `order.created`, `order.cancelled`, `payment.completed` |
| `cart-service` | `product.updated`, `order.placed` ⚠️ (see §5.1) |
| `order-service` | `payment.completed`, `payment.failed`, `shipping.dispatched` |
| `payment-service` | `order.created`, `order.cancelled` |
| `shipping-service` | `order.paid` |
| `promotion-service` | `order.created`, `order.cancelled` |
| `search-service` | `product.created`, `product.updated`, `product.deleted`, `inventory.updated` ⚠️ (see §5.1) |
| `notification-service` | `auth.user.registered`, `auth.password.changed`, `order.created`, `payment.completed`, `shipping.dispatched` |
| `analytics-service` | `order.created`, `order.paid`, `order.cancelled`, `product.created`, `user.registered` ⚠️ (see §5.1) |

---

## 5. Known Discrepancies (to resolve)

Each of these needs an explicit decision. None of them are changed by this document.

### 5.1 Consumed events with no producer

| Routing Key | Consumer Rule | Issue | Likely intended event |
|---|---|---|---|
| `order.placed` | `CART-BR-13` | No service publishes it | `order.created` (`cart-service` code already handles both) |
| `inventory.updated` | `SRCH-BR-11` | Inventory publishes `reserved` / `released` / `deducted` / `low_stock` only | TODO |
| `user.registered` | `ANL-BR-12` | Producer key is `auth.user.registered` (`AUTH-BR-16`); `DomainEvents.USER_REGISTERED` and the analytics handler also use `user.registered` | `auth.user.registered` |

### 5.2 Code handlers whose routing key matches no business rule

| Handler pattern | Location | Likely intended event |
|---|---|---|
| `payment.succeeded` | `order-service`, `shipping-service` event controllers | `payment.completed` (order) / `order.paid` (shipping, `SHIP-BR-18`) |
| `auth.user_created` | `identity-service` Auth event controller | None. Registration is in-process now (`USER-BR-16`) |
| `user.updated` | `identity-service` User event controller | `user.profile.updated` |
| `review.created` | `product-service` Review event controller | `review.submitted` |
| `promotion.created` | `promotion-service` event controller | TODO |
| `category.deleted` | `product-service` Catalog event controller | TODO (no rule) |
| `product.archived` | `search-service` event controller | `product.deleted` (`PRD-BR-15` covers archiving) |

All `@EventPattern` handlers currently run on the **TCP** transport (`main.ts` only calls `connectMicroservice` with `Transport.TCP`), so none of them receive messages from RabbitMQ yet.

### 5.3 Events listed only in EVENT_ARCHITECTURE.md §5

[EVENT_ARCHITECTURE.md §5](./EVENT_ARCHITECTURE.md) lists these events, but no business rule defines them. Either add rules for them or remove them from §5:

`auth.user.logged-in`, `auth.password.reset-requested`, `user.created`, `user.updated`, `inventory.updated`, `cart.checked-out`, `order.confirmed`, `order.completed`, `payment.refund-completed` (rules use `payment.refunded`), `shipping.created`, `promotion.created`, `promotion.expired`, `review.created` (rules use `review.submitted`), `search.indexed`, `notification.sent`, `analytics.aggregated`.

### 5.4 Trace matrix errors in BUSINESS_RULE_CATALOG.md §4

| Row in matrix | Problem |
|---|---|
| `payment.failed` → Inventory (`INV-BR-15`) | `INV-BR-15` consumes `order.cancelled`, not `payment.failed` |
| `shipping.delivered` → Order (`ORD-BR-18`) | `ORD-BR-18` is the `order.delivered` *emission* rule, not a consumer |
| `shipping.delivered` → Product (`REV-BR-12`) | `REV-BR-12` consumes `order.delivered` |
| *(missing)* | `order.paid` → Shipping (`SHIP-BR-18`), Analytics (`ANL-BR-10`); `order.cancelled` → Analytics (`ANL-BR-11`) |

### 5.5 Naming convention

[EVENT_ARCHITECTURE.md §3.3](./EVENT_ARCHITECTURE.md) requires `kebab-case` segments, but these rule-defined keys use `snake_case`: `cart.item_added`, `inventory.low_stock`, `shipping.label_created`, `promotion.coupon_redeemed`, `promotion.flash_sale_started`.

### 5.6 Envelope

The envelope in [EVENT_ARCHITECTURE.md §4.1](./EVENT_ARCHITECTURE.md) also requires `eventVersion`, `producer`, and `traceContext`. `BaseDomainEvent` in `packages/events` does not have these fields yet.

---

## 6. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-11-13 | Initial list built from business rules and cross-checked against code. Renamed `shipment.dispatched` to `shipping.dispatched` in `DomainEvents`. Exchange names aligned to `omni.domain.events` / `omni.dead.letter`. |
