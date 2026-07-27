---
id: WORKFLOW-ORD-005

name: Process Payment Completion (Order Paid)

description: Processes payment completion notification, updates order payment status, and confirms stock deduction.

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
  - payment-completion

use_cases:
  - ORD-UC-05

business_rules:
  - ORD-BR-16
  - ORD-BR-09
  - ORD-BR-20

api:
 []

adr: []

published_events:
  - order.paid

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Process Payment Completion (Order Paid)

---

# 1. Purpose

Processes payment completion notification, updates order payment status, and confirms stock deduction.

---

# 2. Scope

## Included

- Core process execution for Process Payment Completion (Order Paid).
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

Process Payment Completion (Order Paid) is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (order-service) is online and responsive.
- [ ] Database connection to order_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Event Ingestion**: Receives `payment.completed` event (`ORD-BR-20`).

---

## Step 2

**Status Update**: Transitions order status from `PENDING_PAYMENT` to `PAID` (`ORD-BR-09`).

---

## Step 3

**Timeline Log**: Writes payment transaction ID to order audit log.

---

## Step 4

**Event Emission**: Emits `order.paid` event (`ORD-BR-16`).

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
  participant OrderSvc as Order Service (:3006)
  participant DB as PostgreSQL (order_db)

  Broker->>OrderSvc: Deliver Event `payment.completed` (orderId, transactionId)
  OrderSvc->>DB: UPDATE orders SET status = 'PAID' WHERE id = ?
  OrderSvc->>DB: INSERT INTO order_timeline (status: PAID, note: transactionId)
  OrderSvc->>Broker: Outbox Relay publishes `order.paid`
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Order Entity | Initial State | Process Payment Completion (Order Paid) | Updated State |

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
| order_records | UPDATE | Persists updated state for Process Payment Completion (Order Paid) |
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
| POST | /api/v1/order/payment-completion | Executes Process Payment Completion (Order Paid) |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| order.paid | Emitted upon successful execution of Process Payment Completion (Order Paid) |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- ORD-BR-16

- ORD-BR-09

- ORD-BR-20

---

# 21. Related Use Cases

- ORD-UC-05

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

- ORD-BR-16

- ORD-BR-09

- ORD-BR-20

---

## Use Cases

- ORD-UC-05

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
