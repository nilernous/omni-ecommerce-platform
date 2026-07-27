---
id: WORKFLOW-ORD-001

name: Create Order from Checkout Cart

description: Processes checkout cart conversion into a new order by validating inventory, pricing, and creating order records.

version: 1.0.0

status: Approved

domain: Order

target_service: order-service

owner: Order Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - order
  - create-order

use_cases:
  - INV-UC-02
  - ORD-UC-01

business_rules:
  - ORD-BR-01
  - ORD-BR-15
  - ORD-BR-02
  - ORD-BR-08
  - ORD-BR-04
  - ORD-BR-03

api:
  - POST /api/v1/orders

adr: []

published_events:
  - order.created

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Create Order from Checkout Cart

---

# 1. Purpose

Processes checkout cart conversion into a new order by validating inventory, pricing, and creating order records.

---

# 2. Scope

## Included

- Core process execution for Create Order from Checkout Cart.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Order |
| Target Service | order-service |
| Primary Actor | Authenticated Customer |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Authenticated Customer

## Secondary Actors

- order-service
- Database (order_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Create Order from Checkout Cart is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (order-service) is online and responsive.
- [ ] Database connection to order_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Idempotency Check**: Checks `Idempotency-Key` header to prevent duplicate orders (`ORD-BR-04`).

---

## Step 2

**Inter-Service Pricing**: Queries Promotion Service for coupon validation (`ORD-BR-02`) and Shipping Service for rate calculation (`ORD-BR-02`).

---

## Step 3

**Decimal Calculations**: Computes `Subtotal`, `DiscountAmount`, `TaxAmount`, `ShippingFee`, and `TotalAmount` (`ORD-BR-02`, `ORD-BR-03`).

---

## Step 4

**Stock Reservation**: Calls Inventory Service to reserve stock units (`INV-UC-02`).

---

## Step 5

**Order Generation**: Generates `ORD-YYYYMMDD-XXXXX` order number (`ORD-BR-01`).

---

## Step 6

**Transactional Persistence**: Inserts order record with `status: PENDING_PAYMENT` (`ORD-BR-08`).

---

## Step 7

**Outbox Emission**: Emits `order.created` event (`ORD-BR-15`).

---

## Step 8

**Response Delivery**: Returns HTTP 201 Created.

---

# 8. Alternative Flows

## Alternative Flow A

### Trigger

Service cache hit or pre-validated request payload.

### Flow

1. Read directly from cache store.
2. Bypass redundant database queries.
3. Return fast success response.

### Expected Result

Reduced latency response delivered to primary actor.

---

# 9. Exception Flows

## Exception A

### Cause

Invalid payload or business constraint violation.

### Handling

Returns HTTP 400/422 status error response.

### Result

Operation rejected without state modification.

---

# 10. Postconditions

## Success

- Workflow completed successfully with updated entity state.
- Audit log record created and domain events published.

## Failure

- Transaction rolled back completely without persistent side effects.
- Appropriate HTTP error status code returned to caller.

---

# 11. Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  actor Client as Customer App
  participant Gateway as API Gateway (:3000)
  participant OrderSvc as Order Service (:3006)
  participant PromSvc as Promotion Service (:3009)
  participant ShipSvc as Shipping Service (:3008)
  participant InvSvc as Inventory Service (:3004)
  participant DB as PostgreSQL (order_db)
  participant Broker as RabbitMQ Event Bus

  Client->>Gateway: POST /api/v1/orders (Idempotency-Key, Checkout Payload)
  Gateway->>OrderSvc: Forward Request
  OrderSvc->>OrderSvc: Verify Idempotency Key (ORD-BR-04)
  OrderSvc->>PromSvc: POST /coupons/validate (couponCode)
  PromSvc-->>OrderSvc: Validated Discount Amount
  OrderSvc->>ShipSvc: POST /calculate-rate (address, items)
  ShipSvc-->>OrderSvc: Calculated Shipping Fee
  OrderSvc->>OrderSvc: Compute Subtotal, Tax, Total Amount (ORD-BR-02, ORD-BR-03)
  OrderSvc->>InvSvc: POST /reserve (orderId, items)
  alt Reserve Success
    InvSvc-->>OrderSvc: Reservation Confirmed
    OrderSvc->>OrderSvc: Generate ORD-YYYYMMDD-XXXXX Number (ORD-BR-01)
    OrderSvc->>DB: BEGIN TRANSACTION: Insert master order (PENDING_PAYMENT) & items
    DB-->>OrderSvc: Transaction Committed
    OrderSvc->>Broker: Outbox Relay publishes `order.created`
    OrderSvc-->>Gateway: HTTP 201 Created (Created Order Envelope)
    Gateway-->>Client: Return Order Summary & Payment Instructions
  else Stock Reservation Failed
    InvSvc-->>OrderSvc: Stock Unavailable Error
    OrderSvc-->>Gateway: HTTP 400 Bad Request (INSUFFICIENT_STOCK)
  end
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Order Entity | Initial State | Create Order from Checkout Cart | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in order_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| order_records | UPDATE | Persists updated state for Create Order from Checkout Cart |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| order:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| order_index | UPDATE | Syncs index with primary database record |

---

# 17. External Systems

| System | Purpose |
|----------|----------|
| API Gateway | Entry point routing and rate limiting |
| RabbitMQ | Event bus for async event publication |

---

# 18. API Endpoints

| Method | Endpoint | Description |
|----------|-----------|-------------|
| POST | /api/v1/orders | Executes Create Order from Checkout Cart |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| order.created | Emitted upon successful execution of Create Order from Checkout Cart |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- ORD-BR-01

- ORD-BR-15

- ORD-BR-02

- ORD-BR-08

- ORD-BR-04

- ORD-BR-03

---

# 21. Related Use Cases

- INV-UC-02

- ORD-UC-01

---

# 22. Security Considerations

## Authentication

Requires valid bearer JWT token or microservice secret header.

---

## Authorization

Requires appropriate role-based permission check.

---

## Input Validation

Enforces strict JSON schema validation for all payload parameters.

---

## Sensitive Data

Masks personally identifiable information (PII) in log output.

---

## Audit Logging

Records structured audit log containing actor ID, IP address, timestamp, and action.

---

## Rate Limiting

Applies standard API gateway rate limits.

---

# 23. Performance Considerations

## Expected Throughput

1000 requests per minute under nominal load.

---

## Expected Latency

Sub-100ms response time at p95 percentile.

---

## Caching Strategy

Utilizes Redis for session and hot entity caching.

---

## Retry Strategy

Implements exponential backoff retry for transient network faults.

---

## Timeout Strategy

Enforces strict 5-second timeout on downstream service calls.

---

## Concurrency

Uses optimistic concurrency locking or Redis distributed locks.

---

# 24. Compensation

On workflow failure, database transaction is rolled back. If external side effects occurred, a compensating event is dispatched to restore consistent system state.

---

# 25. Observability

## Logging

Emits structured JSON logs tagged with Correlation-ID and Trace-ID.

---

## Metrics

Exposes Prometheus counters for total executions, failures, and execution duration.

---

## Distributed Tracing

Propagates W3C Trace Context headers across RPC and messaging boundaries.

---

## Monitoring

Included in main domain Grafana dashboard.

---

## Alerting

Triggers alert on error rate exceeding 2% over 5-minute window.

---

# 26. Error Codes

| Code | Description |
|---------|-------------|
| INVALID_INPUT | Request payload failed schema validation |
| ENTITY_NOT_FOUND | Target record does not exist |
| INTERNAL_ERROR | Unexpected system error during execution |

---

# 27. Assumptions

- Dependent database and Redis infrastructure are healthy and accessible.
- Network latency between microservices remains within acceptable limits.

---

# 28. Limitations

- Workflow execution is bounded by API Gateway request timeout limits.

---

# 29. Dependencies

## Internal Services

- order-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (order_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- ORD-BR-01

- ORD-BR-15

- ORD-BR-02

- ORD-BR-08

- ORD-BR-04

- ORD-BR-03

---

## Use Cases

- INV-UC-02

- ORD-UC-01

---

## API Documentation

- Open API 3.0 Specs

---

## Architecture Documentation

- System Architecture Specification

---

## Database Documentation

- Data Model Schema Documentation

---

# 31. Notes

Implementation must follow established clean architecture and domain-driven design patterns.

---

# 32. Revision History

| Version | Date | Author | Changes |
|----------|------------|------------|-------------|
| 1.0.0 | 2026-07-28 | Architecture Team | Initial standardized version |
