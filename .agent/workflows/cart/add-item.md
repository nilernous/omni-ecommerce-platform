---
id: WORKFLOW-CART-002

name: Add Product Variant to Cart

description: Adds a product variant to the customer cart while enforcing cart item capacity and quantity limits.

version: 1.0.0

status: Approved

domain: Cart

target_service: cart-service

owner: Cart Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - cart
  - add-item

use_cases:
  - CART-UC-02

business_rules:
  - CART-BR-05
  - CART-BR-03
  - CART-BR-06
  - CART-BR-02
  - CART-BR-01
  - CART-BR-10

api:
  - POST /api/v1/cart/items

adr: []

published_events:
  - cart.item_added

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Add Product Variant to Cart

---

# 1. Purpose

Adds a product variant to the customer cart while enforcing cart item capacity and quantity limits.

---

# 2. Scope

## Included

- Core process execution for Add Product Variant to Cart.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Cart |
| Target Service | cart-service |
| Primary Actor | Authenticated Customer |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Authenticated Customer

## Secondary Actors

- cart-service
- Database (cart_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Add Product Variant to Cart is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (cart-service) is online and responsive.
- [ ] Database connection to cart_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Limit Checks**: Verifies distinct items `<= 50` (`CART-BR-05`) and item quantity `<= 99` (`CART-BR-06`).

---

## Step 2

**Item Mutate**: Adds new SKU or increments existing SKU quantity.

---

## Step 3

**Redis Persistence & TTL**: Saves cart payload to Redis and resets TTL (30d Auth / 7d Guest) (`CART-BR-02`, `CART-BR-03`).

---

## Step 4

**Event Emission**: Emits `cart.item_added` event (`CART-BR-10`).

---

## Step 5

**Response**: Returns HTTP 200 OK.

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
  actor Client as Customer / Guest User
  participant CartSvc as Cart Service (:3005)
  participant Redis as Redis (cart_store)
  participant Broker as RabbitMQ Event Bus

  Client->>CartSvc: POST /api/v1/cart/items (sku, quantity)
  CartSvc->>Redis: HGETALL cart:{userId}
  alt Distinct Items >= 50 AND SKU New
    CartSvc-->>Client: HTTP 400 Bad Request (CART_LIMIT_EXCEEDED)
  else Within Limits
    CartSvc->>CartSvc: Add / update item quantity (max 99 per SKU)
    CartSvc->>Redis: HSET cart:{userId} items [...]
    CartSvc->>Redis: EXPIRE cart:{userId} 2592000 (30 days TTL)
    CartSvc->>Broker: Publish `cart.item_added`
    CartSvc-->>Client: HTTP 200 OK (Updated Cart Object)
  end
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Cart Entity | Initial State | Add Product Variant to Cart | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in cart_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| cart_records | UPDATE | Persists updated state for Add Product Variant to Cart |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| cart:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| cart_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/cart/items | Executes Add Product Variant to Cart |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| cart.item_added | Emitted upon successful execution of Add Product Variant to Cart |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- CART-BR-05

- CART-BR-03

- CART-BR-06

- CART-BR-02

- CART-BR-01

- CART-BR-10

---

# 21. Related Use Cases

- CART-UC-02

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

- cart-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (cart_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- CART-BR-05

- CART-BR-03

- CART-BR-06

- CART-BR-02

- CART-BR-01

- CART-BR-10

---

## Use Cases

- CART-UC-02

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
