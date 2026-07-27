---
id: WORKFLOW-PROM-002

name: Redeem Coupon Code Upon Order Placement

description: Redeems validated coupon code during checkout preview.

version: 1.0.0

status: Approved

domain: Promotion

target_service: promotion-service

owner: Promotion Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - promotion
  - redeem-coupon

use_cases:
  - PROM-UC-02

business_rules:
  - PROM-BR-11
  - PROM-BR-08
  - PROM-BR-13
  - PROM-BR-07

api:
 []

adr: []

published_events:
  - promotion.coupon_redeemed

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Redeem Coupon Code Upon Order Placement

---

# 1. Purpose

Redeems validated coupon code during checkout preview.

---

# 2. Scope

## Included

- Core process execution for Redeem Coupon Code Upon Order Placement.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Promotion |
| Target Service | promotion-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- promotion-service
- Database (promotion_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Redeem Coupon Code Upon Order Placement is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (promotion-service) is online and responsive.
- [ ] Database connection to promotion_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Event Ingestion**: Receives `order.created` event (`PROM-BR-13`).

---

## Step 2

**Redemption Increment**: Atomically increments global and per-user redemption counters in `promotion_db` (`PROM-BR-07`, `PROM-BR-08`).

---

## Step 3

**Log Creation**: Saves redemption audit entry.

---

## Step 4

**Event Emission**: Emits `promotion.coupon_redeemed` event (`PROM-BR-11`).

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
  actor Broker as RabbitMQ Event Bus
  participant PromSvc as Promotion Service (:3009)
  participant DB as PostgreSQL (promotion_db)

  Broker->>PromSvc: Deliver Event `order.created` (couponCode, userId, orderId)
  alt Order Contains Coupon Code
    PromSvc->>DB: BEGIN TRANSACTION: Increment global usage_count and user redemption record
    PromSvc->>DB: INSERT INTO coupon_redemptions (coupon_id, user_id, order_id)
    DB-->>PromSvc: Transaction Committed
    PromSvc->>Broker: Outbox Relay publishes `promotion.coupon_redeemed`
  end
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Promotion Entity | Initial State | Redeem Coupon Code Upon Order Placement | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in promotion_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| promotion_records | UPDATE | Persists updated state for Redeem Coupon Code Upon Order Placement |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| promotion:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| promotion_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/promotion/redeem-coupon | Executes Redeem Coupon Code Upon Order Placement |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| promotion.coupon_redeemed | Emitted upon successful execution of Redeem Coupon Code Upon Order Placement |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- PROM-BR-11

- PROM-BR-08

- PROM-BR-13

- PROM-BR-07

---

# 21. Related Use Cases

- PROM-UC-02

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

- promotion-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (promotion_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- PROM-BR-11

- PROM-BR-08

- PROM-BR-13

- PROM-BR-07

---

## Use Cases

- PROM-UC-02

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
