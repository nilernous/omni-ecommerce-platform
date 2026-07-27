---
id: WORKFLOW-INV-003

name: Confirm Permanent Stock Deduction (Payment Success)

description: Permanently deducts reserved stock units following payment confirmation.

version: 1.0.0

status: Approved

domain: Inventory

target_service: inventory-service

owner: Inventory Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - inventory
  - confirm-stock-deduction

use_cases:
  - INV-UC-03

business_rules:
  - INV-BR-11
  - INV-BR-12
  - INV-BR-07
  - INV-BR-03
  - INV-BR-14

api:
 []

adr: []

published_events:
  - inventory.low_stock
  - inventory.deducted

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Confirm Permanent Stock Deduction (Payment Success)

---

# 1. Purpose

Permanently deducts reserved stock units following payment confirmation.

---

# 2. Scope

## Included

- Core process execution for Confirm Permanent Stock Deduction (Payment Success).
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Inventory |
| Target Service | inventory-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- inventory-service
- Database (inventory_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Confirm Permanent Stock Deduction (Payment Success) is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (inventory-service) is online and responsive.
- [ ] Database connection to inventory_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Event Ingestion**: Receives `payment.completed` AMQP event (`INV-BR-14`).

---

## Step 2

**Deduction Processing**: Atomically decrements `physical` and `reserved` stock balances in `inventory_db` (`INV-BR-07`).

---

## Step 3

**Reservation Confirmation**: Updates reservation status to `CONFIRMED`.

---

## Step 4

**Safety Stock Evaluation**: Emits `inventory.low_stock` event if `Available < 5` (`INV-BR-03`, `INV-BR-12`).

---

## Step 5

**Event Emission**: Emits `inventory.deducted` event (`INV-BR-11`).

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
  participant InvSvc as Inventory Service (:3004)
  participant DB as PostgreSQL (inventory_db)

  Broker->>InvSvc: Deliver Event `payment.completed` (orderId)
  InvSvc->>DB: Query SELECT * FROM reservations WHERE order_id = ? AND status = 'RESERVED'
  DB-->>InvSvc: Reservation Record
  InvSvc->>DB: BEGIN TRANSACTION: UPDATE inventory SET physical = physical - qty, reserved = reserved - qty WHERE sku = ?
  InvSvc->>DB: UPDATE reservations SET status = 'CONFIRMED' WHERE id = ?
  DB-->>InvSvc: Transaction Committed
  InvSvc->>InvSvc: Check Available < safetyStockThreshold (5 units)
  alt Low Stock Triggered
    InvSvc->>Broker: Publish `inventory.low_stock` event
  end
  InvSvc->>Broker: Publish `inventory.deducted` event
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Inventory Entity | Initial State | Confirm Permanent Stock Deduction (Payment Success) | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in inventory_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| inventory_records | UPDATE | Persists updated state for Confirm Permanent Stock Deduction (Payment Success) |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| inventory:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| inventory_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/inventory/confirm-stock-deduction | Executes Confirm Permanent Stock Deduction (Payment Success) |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| inventory.low_stock | Emitted upon successful execution of Confirm Permanent Stock Deduction (Payment Success) |
| inventory.deducted | Emitted upon successful execution of Confirm Permanent Stock Deduction (Payment Success) |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- INV-BR-11

- INV-BR-12

- INV-BR-07

- INV-BR-03

- INV-BR-14

---

# 21. Related Use Cases

- INV-UC-03

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

- inventory-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (inventory_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- INV-BR-11

- INV-BR-12

- INV-BR-07

- INV-BR-03

- INV-BR-14

---

## Use Cases

- INV-UC-03

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
