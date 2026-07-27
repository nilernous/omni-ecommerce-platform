---
id: WORKFLOW-REV-001

name: Submit Customer Product Review

description: Saves customer review and rating for verified purchased products.

version: 1.0.0

status: Approved

domain: Review

target_service: review-service

owner: Review Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - review
  - submit-review

use_cases:
  - REV-UC-01

business_rules:
  - REV-BR-03
  - REV-BR-04
  - REV-BR-05
  - REV-BR-10
  - REV-BR-06
  - REV-BR-07
  - REV-BR-01
  - REV-BR-02

api:
  - POST /api/v1/reviews/products/{productId}

adr: []

published_events:
  - review.submitted

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Submit Customer Product Review

---

# 1. Purpose

Saves customer review and rating for verified purchased products.

---

# 2. Scope

## Included

- Core process execution for Submit Customer Product Review.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Review |
| Target Service | review-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- review-service
- Database (review_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Submit Customer Product Review is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (review-service) is online and responsive.
- [ ] Database connection to review_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Verified Purchase Check**: Queries Order Service to ensure customer has a delivered order for `productId` (`REV-BR-01`).

---

## Step 2

**Duplicate Check**: Ensures maximum 1 review per product per user (`REV-BR-02`).

---

## Step 3

**Validation**: Verifies rating (1-5 stars, `REV-BR-03`) and comment length (10-2000 chars, `REV-BR-04`).

---

## Step 4

**Profanity Screening**: Sets status to `APPROVED` if clean, or `PENDING_MODERATION` if flagged (`REV-BR-05`, `REV-BR-06`). Attaches `verifiedPurchase: true` badge (`REV-BR-07`).

---

## Step 5

**Persistence & Outbox**: Saves review to `review_db` and emits `review.submitted` event (`REV-BR-10`).

---

## Step 6

**Response**: Returns HTTP 201 Created.

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
  actor Customer as Authenticated Customer
  participant RevSvc as Review Service (:3100)
  participant OrderSvc as Order Service (:3006)
  participant DB as PostgreSQL (review_db)
  participant Broker as RabbitMQ Event Bus

  Customer->>RevSvc: POST /api/v1/reviews/products/{productId} (rating, comment)
  RevSvc->>OrderSvc: GET /orders/check-delivered (userId, productId)
  alt Verified Purchase Exists
    OrderSvc-->>RevSvc: Order Record (Status == DELIVERED)
    RevSvc->>DB: Query SELECT count(*) FROM reviews WHERE user_id = ? AND product_id = ?
    alt Already Reviewed
      RevSvc-->>Customer: HTTP 400 Bad Request (DUPLICATE_REVIEW)
    else First Review
      RevSvc->>RevSvc: Validate rating IN (1..5) & comment length IN (10..2000)
      RevSvc->>RevSvc: Scan comment for profanity keywords
      alt Profanity Clean
        RevSvc->>DB: INSERT INTO reviews (status: APPROVED, verified_purchase: true)
      else Profanity Flagged
        RevSvc->>DB: INSERT INTO reviews (status: PENDING_MODERATION, verified_purchase: true)
      end
      RevSvc->>Broker: Outbox Relay publishes `review.submitted`
      RevSvc-->>Customer: HTTP 201 Created (Review Envelope)
    end
  else No Verified Purchase
    OrderSvc-->>RevSvc: No Delivered Order Found
    RevSvc-->>Customer: HTTP 403 Forbidden (VERIFIED_PURCHASE_REQUIRED)
  end
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Review Entity | Initial State | Submit Customer Product Review | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in review_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| review_records | UPDATE | Persists updated state for Submit Customer Product Review |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| review:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| review_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/reviews/products/{productId} | Executes Submit Customer Product Review |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| review.submitted | Emitted upon successful execution of Submit Customer Product Review |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- REV-BR-03

- REV-BR-04

- REV-BR-05

- REV-BR-10

- REV-BR-06

- REV-BR-07

- REV-BR-01

- REV-BR-02

---

# 21. Related Use Cases

- REV-UC-01

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

- review-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (review_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- REV-BR-03

- REV-BR-04

- REV-BR-05

- REV-BR-10

- REV-BR-06

- REV-BR-07

- REV-BR-01

- REV-BR-02

---

## Use Cases

- REV-UC-01

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
