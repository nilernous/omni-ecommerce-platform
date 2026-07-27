---
id: WORKFLOW-PROM-001

name: Validate Coupon Code & Calculate Discount Preview

description: Validates coupon eligibility, minimum spend constraints, and discount applicability.

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
  - validate-coupon

use_cases:
  - PROM-UC-01

business_rules:
  - PROM-BR-08
  - PROM-BR-01
  - PROM-BR-06
  - PROM-BR-10
  - PROM-BR-07
  - PROM-BR-02
  - PROM-BR-05

api:
  - POST /api/v1/promotions/coupons/validate

adr: []

published_events:
 []

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Validate Coupon Code & Calculate Discount Preview

---

# 1. Purpose

Validates coupon eligibility, minimum spend constraints, and discount applicability.

---

# 2. Scope

## Included

- Core process execution for Validate Coupon Code & Calculate Discount Preview.
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

Validate Coupon Code & Calculate Discount Preview is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (promotion-service) is online and responsive.
- [ ] Database connection to promotion_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Coupon Retrieval**: Checks Redis / `promotion_db` for coupon code.

---

## Step 2

**Validity Validation**: Checks active date window (`PROM-BR-05`), global usage limit (`PROM-BR-07`), user limit (`PROM-BR-08`), and minimum subtotal (`PROM-BR-06`).

---

## Step 3

**Discount Computation**: Calculates discount based on percentage cap or fixed value (`PROM-BR-01`, `PROM-BR-02`).

---

## Step 4

**Response**: Returns HTTP 200 OK with discount amount.

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
  actor Client as Customer / Checkout Flow
  participant PromSvc as Promotion Service (:3009)
  participant Redis as Redis (coupon_cache)
  participant DB as PostgreSQL (promotion_db)

  Client->>PromSvc: POST /api/v1/promotions/coupons/validate (couponCode, cartSubtotal, userId)
  PromSvc->>Redis: GET coupon:{couponCode}
  alt Cache Miss
    PromSvc->>DB: Query SELECT * FROM coupons WHERE code = ?
    DB-->>PromSvc: Coupon Entity
  end
  PromSvc->>PromSvc: Verify Active Dates (startDate <= NOW <= endDate) (PROM-BR-05)
  PromSvc->>PromSvc: Verify Global Usage Limit < totalUsageLimit (PROM-BR-07)
  PromSvc->>PromSvc: Verify User Usage Count < perUserLimit (PROM-BR-08)
  PromSvc->>PromSvc: Verify cartSubtotal >= minimumOrderAmount (PROM-BR-06)
  PromSvc->>PromSvc: Compute Discount Value (Percentage with Cap OR Fixed Amount) (PROM-BR-01, PROM-BR-02)
  PromSvc-->>Client: HTTP 200 OK (Validated Discount Amount Payload)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Promotion Entity | Initial State | Validate Coupon Code & Calculate Discount Preview | Updated State |

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
| promotion_records | UPDATE | Persists updated state for Validate Coupon Code & Calculate Discount Preview |
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
| POST | /api/v1/promotions/coupons/validate | Executes Validate Coupon Code & Calculate Discount Preview |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| None | No domain events published |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- PROM-BR-08

- PROM-BR-01

- PROM-BR-06

- PROM-BR-10

- PROM-BR-07

- PROM-BR-02

- PROM-BR-05

---

# 21. Related Use Cases

- PROM-UC-01

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

- PROM-BR-08

- PROM-BR-01

- PROM-BR-06

- PROM-BR-10

- PROM-BR-07

- PROM-BR-02

- PROM-BR-05

---

## Use Cases

- PROM-UC-01

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
