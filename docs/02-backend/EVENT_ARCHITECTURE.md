# Event Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Event Software Architecture Document (ESAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Messaging Layer (RabbitMQ Event Broker) |
| Architecture Style | Event-Driven Architecture (EDA) + Publish/Subscribe + Transactional Outbox |
| Primary Broker | RabbitMQ |
| Message Serialization | JSON (`application/json`) |
| Guarantees | At-Least-Once Delivery + Consumer Idempotency |
| Audience | Backend Engineers, Software Architects, DevOps Engineers, QA Engineers |

---

# Table of Contents

1. Introduction
   1.1 Purpose  
   1.2 Scope  
   1.3 Intended Audience  
   1.4 Core Design Principles  
2. Event-Driven Architecture Overview
   2.1 Overview  
   2.2 Asynchronous Messaging Topology  
   2.3 Event Flow Lifecycle  
3. Message Broker Infrastructure (RabbitMQ)
   2.1 Exchange Architecture  
   3.2 Queue Naming & Structure Standard  
   3.3 Routing Key Conventions  
4. Event Schema & Specification Standard
   4.1 Standard Event Envelope Schema  
   4.2 Event Payload Design Rules  
   4.3 Event Versioning Strategy  
5. Domain Event Catalog
   5.1 Auth Service Events  
   5.2 User Service Events  
   5.3 Product Service Events  
   5.4 Inventory Service Events  
   5.5 Cart Service Events  
   5.6 Order Service Events  
   5.7 Payment Service Events  
   5.8 Shipping Service Events  
   5.9 Promotion Service Events  
   5.10 Review Service Events  
   5.11 Media Service Events  
   5.12 Search Service Events  
   5.13 Notification Service Events  
   5.14 Analytics Service Events  
6. Reliable Event Publishing
   6.1 Transactional Outbox Pattern  
   6.2 Publisher Confirmations & Retries  
7. Consumer Resilience & Message Handling
   7.1 Idempotent Message Processing  
   7.2 Retry Strategy & Exponential Backoff  
   7.3 Dead Letter Exchange (DLX) & Queue (DLQ) Topology  
8. Security & Governance
   8.1 Message Encryption & Sensitivity  
   8.2 Access Control & Broker Credentials  
9. Observability & Event Tracing
   9.1 Correlation & Trace Header Propagation  
   9.2 Messaging Telemetry & Monitoring Metrics  
10. Architecture Decision Summary
11. Related Documents
12. Conclusion

---

# 1. Introduction

## 1.1 Purpose

This document defines the **Event Architecture** for OmniCommerce. It establishes the asynchronous communication standards, message broker topologies, event schemas, publishing patterns, and consumer resilience rules that enable microservices to collaborate loosely without tight runtime coupling.

---

## 1.2 Scope

This specification covers:
- RabbitMQ messaging topology (Exchanges, Queues, Routing Keys).
- Standard Event Envelope schemas and payload conventions.
- The complete Domain Event Catalog across all 14 microservices.
- Reliable event publishing via the Transactional Outbox pattern.
- Consumer idempotency, dead-letter routing, and retry strategies.
- Observability and trace context propagation across event boundaries.

---

## 1.3 Intended Audience

This document is intended for Backend Engineers, Architects, DevOps Engineers, and Test Engineers building or testing asynchronous event producers and consumers.

---

## 1.4 Core Design Principles

1. **Loose Coupling**: Services communicate via events without knowing downstream consumer identities.
2. **At-Least-Once Delivery**: Messages are guaranteed to reach consumers; consumers handle duplicates idempotently.
3. **Domain Ownership**: Microservices emit domain events representing state changes after committing local database transactions.
4. **Resiliency & Isolation**: A failure in one consumer service must not impact the publisher or other consumers.

---

# 2. Event-Driven Architecture Overview

## 2.1 Overview

OmniCommerce microservices interact synchronously via REST APIs when immediate responses are required (e.g., checkout preview), and asynchronously via RabbitMQ domain events whenever operations can be processed in the background (e.g., sending order confirmation emails, reindexing product search).

---

## 2.2 Asynchronous Messaging Topology

```text
               ┌────────────────────────────────────────────────────────┐
               │                  Order Service                         │
               │  1. Process Order ──► Commit DB ──► Save Outbox Entry  │
               └───────────────────────────┬────────────────────────────┘
                                           │ 2. Outbox Relay
                                           ▼
                                 RabbitMQ Topic Exchange
                                (`omni.events.topic`)
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │ Routing: `order.created`                    │
                    ▼                                             ▼
          Inventory Queue                               Notification Queue
   (`omni.inventory.order-created`)             (`omni.notification.order-created`)
                    │                                             │
                    ▼                                             ▼
        Inventory Microservice                        Notification Microservice
    (Reserves Physical Stock)                     (Sends Confirmation Email/SMS)
```

---

## 2.3 Event Flow Lifecycle

1. **State Change**: Service executes business logic and commits a transactional record to PostgreSQL.
2. **Outbox Entry**: An outbox record is stored in the same database transaction.
3. **Publishing**: Outbox Relay worker polls the outbox and publishes the event envelope to RabbitMQ topic exchange.
4. **Broker Routing**: RabbitMQ routes the message to bound queues based on topic routing keys.
5. **Consumption**: Consumer services acknowledge processing (`ACK`) or reject failed processing (`NACK`) to route to Dead Letter Queues.

---

# 3. Message Broker Infrastructure (RabbitMQ)

## 3.1 Exchange Architecture

OmniCommerce utilizes dedicated RabbitMQ Exchanges based on event distribution requirements:

| Exchange Name | Type | Purpose | Example Routing Key |
|---------------|------|---------|---------------------|
| `omni.events.topic` | `topic` | Primary exchange for all domain and integration events | `order.created`, `product.updated` |
| `omni.events.dlx` | `direct` | Dead Letter Exchange for failed event retries | `dlq.order-service`, `dlq.notification` |
| `omni.events.fanout` | `fanout` | Global broadcast system events (e.g. cache invalidation) | N/A |

---

## 3.2 Queue Naming & Structure Standard

Queues are owned by consumer microservices and named explicitly to avoid naming collisions:

- **Format**: `omni.{consumer_service}.{event_name}.queue`
- **Example**: `omni.notification.order-created.queue`
- **DLQ Format**: `omni.{consumer_service}.{event_name}.dlq`

---

## 3.3 Routing Key Conventions

Routing keys follow a three-part `kebab-case` structure: `{domain}.{subdomain}.{action_past_tense}`

- `order.created`
- `product.updated`
- `inventory.stock-reserved`
- `payment.completed`

---

# 4. Event Schema & Specification Standard

## 4.1 Standard Event Envelope Schema

All published messages must be wrapped in a uniform JSON event envelope:

```json
{
  "eventId": "evt_9876543210_uuid",
  "eventType": "order.created",
  "eventVersion": "1.0",
  "producer": "order-service",
  "timestamp": "2026-07-27T14:58:00.000Z",
  "correlationId": "c8f2a1b0-4d5e-4f6a-8b9c-0d1e2f3a4b5c",
  "traceContext": {
    "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
  },
  "payload": {
    "orderId": "ord_123456",
    "customerId": "usr_998877",
    "totalAmount": 299.99,
    "currency": "USD",
    "items": [
      {
        "sku": "AUD-WNC-001",
        "quantity": 1,
        "unitPrice": 299.99
      }
    ]
  }
}
```

---

## 4.2 Event Payload Design Rules

- **Minimal & Self-Contained**: Pass identifiers and essential state. Avoid passing full uncompressed database graphs.
- **Immutable**: Events state facts that occurred in the past. Payload keys cannot be mutated after emission.
- **Strict Data Types**: ISO 8601 strings for timestamps, explicit numbers for monetary amounts.

---

## 4.3 Event Versioning Strategy

- **Minor Non-Breaking Updates**: Adding optional fields to `payload` (Version remains `1.0`).
- **Major Breaking Updates**: Renaming fields or changing types triggers a new version tag (`2.0`) and routing key update (`order.created.v2`).

---

# 5. Domain Event Catalog

## 5.1 Auth Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `UserRegistered` | `auth.user.registered` | Emitted when a new user registers an account |
| `UserLoggedIn` | `auth.user.logged-in` | Emitted on successful user authentication |
| `PasswordResetRequested` | `auth.password.reset-requested` | Emitted when password reset OTP is generated |

---

## 5.2 User Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `UserCreated` | `user.created` | Emitted when user profile is initialized |
| `UserUpdated` | `user.updated` | Emitted when user updates avatar or details |

---

## 5.3 Product Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `ProductCreated` | `product.created` | Emitted when new product listing is published |
| `ProductUpdated` | `product.updated` | Emitted when product details or price changes |
| `ProductDeleted` | `product.deleted` | Emitted when product listing is removed |

---

## 5.4 Inventory Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `InventoryReserved` | `inventory.reserved` | Emitted when warehouse stock is reserved |
| `InventoryReleased` | `inventory.released` | Emitted when reserved stock is released |
| `InventoryUpdated` | `inventory.updated` | Emitted when physical stock balance is updated |

---

## 5.5 Cart Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `CartCheckedOut` | `cart.checked-out` | Emitted when cart transitions to checkout |

---

## 5.6 Order Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `OrderCreated` | `order.created` | Emitted when customer submits new order |
| `OrderConfirmed` | `order.confirmed` | Emitted when inventory and payment are confirmed |
| `OrderCancelled` | `order.cancelled` | Emitted when order is cancelled |
| `OrderCompleted` | `order.completed` | Emitted when shipment is delivered |

---

## 5.7 Payment Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `PaymentCompleted` | `payment.completed` | Emitted when payment gateway succeeds |
| `PaymentFailed` | `payment.failed` | Emitted when transaction fails |
| `RefundCompleted` | `payment.refund-completed` | Emitted when refund transaction processes |

---

## 5.8 Shipping Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `ShipmentCreated` | `shipping.created` | Emitted when fulfillment package is created |
| `ShipmentDispatched` | `shipping.dispatched` | Emitted when carrier receives package |
| `ShipmentDelivered` | `shipping.delivered` | Emitted when customer receives package |

---

## 5.9 Promotion Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `PromotionCreated` | `promotion.created` | Emitted when new coupon campaign goes live |
| `PromotionExpired` | `promotion.expired` | Emitted when promotional period ends |

---

## 5.10 Review Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `ReviewCreated` | `review.created` | Emitted when verified purchase review is posted |

---

## 5.11 Media Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `MediaUploaded` | `media.uploaded` | Emitted when file object is processed in storage |
| `MediaDeleted` | `media.deleted` | Emitted when asset is purged |

---

## 5.12 Search Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `SearchIndexed` | `search.indexed` | Emitted when Elasticsearch index update completes |

---

## 5.13 Notification Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `NotificationSent` | `notification.sent` | Emitted when email/SMS/push delivery completes |

---

## 5.14 Analytics Service Events

| Event Name | Routing Key | Description |
|------------|-------------|-------------|
| `AnalyticsAggregated` | `analytics.aggregated` | Emitted when hourly business metric calculation finishes |

---

# 6. Reliable Event Publishing

## 6.1 Transactional Outbox Pattern

To eliminate dual-write inconsistencies between PostgreSQL and RabbitMQ, microservices persist outgoing events into a local `outbox_events` table within the same database transaction:

```text
[ Business Transaction ]
  ├── 1. INSERT INTO orders (...)
  └── 2. INSERT INTO outbox_events (id, event_type, payload, status)
[ COMMIT DB TRANSACTION ]

[ Outbox Relay Worker ]
  ├── 3. Poll pending events SELECT * FROM outbox_events WHERE status = 'PENDING'
  ├── 4. Publish message envelope to RabbitMQ
  └── 5. Update status = 'PUBLISHED'
```

---

## 6.2 Publisher Confirmations & Retries

The Outbox Relay worker enables **RabbitMQ Publisher Confirmations**:
- If RabbitMQ acknowledges receipt (`ack`), event status transitions to `PUBLISHED`.
- If publishing fails (`nack` or timeout), the relay retries after an exponential backoff delay.

---

# 7. Consumer Resilience & Message Handling

## 7.1 Idempotent Message Processing

Because messages may be delivered more than once (At-Least-Once delivery guarantee), consumers must enforce idempotency:

```typescript
// NestJS Consumer Idempotency logic using Redis
async function processOrderCreated(event: EventEnvelope) {
  const lockKey = `processed_events:${event.eventId}`;
  const isNew = await redis.set(lockKey, 'PROCESSED', 'NX', 'EX', 86400); // 24hr TTL
  
  if (!isNew) {
    logger.info(`Duplicate event skipped: ${event.eventId}`);
    return; // Acknowledge and skip duplicate
  }
  
  await executeBusinessLogic(event.payload);
}
```

---

## 7.2 Retry Strategy & Exponential Backoff

When event processing encounters temporary infrastructure failures (e.g. database timeout):
1. **Initial Retry**: Retry immediately (Attempt 1).
2. **Exponential Backoff**: Retry after 2s, 4s, 8s, 16s.
3. **Max Retries**: Max 5 attempts. If all fail, reject message (`NACK` without requeue).

---

## 7.3 Dead Letter Exchange (DLX) & Queue (DLQ) Topology

Rejected messages automatically route to `omni.events.dlx` and populate the service's Dead Letter Queue (`omni.{service}.dlq`):

```text
[ Active Queue ] ──(Max Retries Exceeded)──► [ Dead Letter Exchange ] ──► [ Consumer DLQ ] ──► [ Admin Alert / Manual Replay ]
```

---

# 8. Security & Governance

## 8.1 Message Encryption & Sensitivity

- Messages containing sensitive PII (Personally Identifiable Information) must encrypt payload attributes using AES-256 before publishing.
- Secrets, credentials, raw credit card data, and passwords must **never** be included in domain event payloads.

---

## 8.2 Access Control & Broker Credentials

- RabbitMQ enforces **AMQP Virtual Host (vhost)** isolation per environment (`/omnicommerce-dev`, `/omnicommerce-prod`).
- Microservices authenticate using service-specific AMQP user accounts with restricted permission scopes.

---

# 9. Observability & Event Tracing

## 9.1 Correlation & Trace Header Propagation

- Producers copy `correlationId` and OpenTelemetry `traceparent` context from current execution context into the event envelope.
- Consumers extract `traceparent` upon consumption to continue distributed tracing spans across RabbitMQ.

---

## 9.2 Messaging Telemetry & Monitoring Metrics

Prometheus tracks:
- `rabbitmq_messages_published_total{event_type}`: Total published events.
- `rabbitmq_messages_consumed_total{event_type, consumer}`: Processed event counts.
- `rabbitmq_queue_depth{queue_name}`: Unprocessed backlog queue depth.

---

# 10. Architecture Decision Summary

| Decision | Selected Option | Rationale |
|----------|-----------------|-----------|
| **Broker** | RabbitMQ | Low latency, reliable AMQP routing, granular exchange topologies |
| **Delivery Model** | At-Least-Once | Ensures message durability; consumers handle deduplication |
| **Publishing Pattern** | Transactional Outbox | Prevents database/broker inconsistency during network drops |
| **Consumer Resilience** | DLQ + Exponential Backoff | Prevents queue poisoning while ensuring retry capabilities |

---

# 11. Related Documents

- [BACKEND_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/BACKEND_ARCHITECTURE.md)
- [API_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/API_ARCHITECTURE.md)

---

# 12. Conclusion

The OmniCommerce Event Architecture provides a resilient, event-driven backbone for asynchronous collaboration across microservices. By combining standardized JSON envelopes, Transactional Outbox publishing, Redis idempotency deduplication, and Dead Letter Queues, the system achieves strong data consistency and fault isolation.
