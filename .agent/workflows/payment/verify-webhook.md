---
id: WORKFLOW-PAY-002

name: Verify Gateway Webhook Callback

description: Verifies and processes asynchronous webhook callbacks from payment gateways.

version: 1.0.0

status: Approved

domain: Payment

target_service: payment-service

owner: Payment Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - payment
  - verify-webhook

use_cases:
  - PAY-UC-02

business_rules:
  - PAY-BR-05
  - PAY-BR-17
  - PAY-BR-16
  - PAY-BR-02

api:
  - POST /api/v1/payments/verify

adr: []

published_events:
  - payment.completed

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Verify Gateway Webhook Callback

---

# 1. Purpose

Verifies and processes asynchronous webhook callbacks from payment gateways.

---

# 2. Scope

## Included

- Core process execution for Verify Gateway Webhook Callback.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Payment |
| Target Service | payment-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- payment-service
- Database (payment_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Verify Gateway Webhook Callback is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (payment-service) is online and responsive.
- [ ] Database connection to payment_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Signature Verification**: Verifies cryptographic HMAC signature using gateway secret key (`PAY-BR-05`).

---

## Step 2

**Ledger Update**: Updates matching transaction record in `payment_db` (`PAY-BR-02`).

---

## Step 3

**Event Emission**: Emits `payment.completed` or `payment.failed` domain event (`PAY-BR-16`, `PAY-BR-17`).

---

## Step 4

**Gateway Response**: Returns HTTP 200 OK.

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
  actor GatewayProvider as Stripe / PayPal Gateway
  participant PaySvc as Payment Service (:3007)
  participant DB as PostgreSQL (payment_db)
  participant Broker as RabbitMQ Event Bus

  GatewayProvider->>PaySvc: POST /api/v1/payments/verify (Signature Header, Webhook Payload)
  PaySvc->>PaySvc: Compute & Compare HMAC Signature (PAY-BR-05)
  alt Signature Valid
    PaySvc->>DB: Query SELECT * FROM transactions WHERE gateway_tx_id = ?
    PaySvc->>DB: UPDATE transactions SET status = ? WHERE id = ?
    PaySvc->>Broker: Outbox Relay publishes `payment.completed` OR `payment.failed`
    PaySvc-->>GatewayProvider: HTTP 200 OK
  else Signature Invalid
    PaySvc-->>GatewayProvider: HTTP 401 Unauthorized (INVALID_SIGNATURE)
  end
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Payment Entity | Initial State | Verify Gateway Webhook Callback | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in payment_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| payment_records | UPDATE | Persists updated state for Verify Gateway Webhook Callback |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| payment:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| payment_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/payments/verify | Executes Verify Gateway Webhook Callback |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| payment.completed | Emitted upon successful execution of Verify Gateway Webhook Callback |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- PAY-BR-05

- PAY-BR-17

- PAY-BR-16

- PAY-BR-02

---

# 21. Related Use Cases

- PAY-UC-02

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

- payment-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (payment_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- PAY-BR-05

- PAY-BR-17

- PAY-BR-16

- PAY-BR-02

---

## Use Cases

- PAY-UC-02

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
