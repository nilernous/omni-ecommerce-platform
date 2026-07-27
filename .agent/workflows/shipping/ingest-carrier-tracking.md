---
id: WORKFLOW-SHIP-003

name: Ingest Carrier Real-Time Tracking Update

description: Ingests real-time carrier tracking updates for active shipments.

version: 1.0.0

status: Approved

domain: Shipping

target_service: shipping-service

owner: Shipping Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - shipping
  - ingest-carrier-tracking

use_cases:
  - ORD-UC-06
  - SHIP-UC-03

business_rules:
  - SHIP-BR-07
  - SHIP-BR-11
  - SHIP-BR-10
  - SHIP-BR-12
  - SHIP-BR-16

api:
  - POST /api/v1/shipping/webhook/{carrier}

adr: []

published_events:
  - shipping.dispatched

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Ingest Carrier Real-Time Tracking Update

---

# 1. Purpose

Ingests real-time carrier tracking updates for active shipments.

---

# 2. Scope

## Included

- Core process execution for Ingest Carrier Real-Time Tracking Update.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Shipping |
| Target Service | shipping-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- shipping-service
- Database (shipping_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Ingest Carrier Real-Time Tracking Update is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (shipping-service) is online and responsive.
- [ ] Database connection to shipping_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Webhook Processing**: Validates webhook and updates shipment status (`PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`) in `shipping_db` (`SHIP-BR-07`, `SHIP-BR-10`, `SHIP-BR-11`, `SHIP-BR-12`).

---

## Step 2

**Event Emission**: Emits `shipping.dispatched` event on carrier pickup (`SHIP-BR-16`).

---

## Step 3

**Downstream Update**: Order Service transitions order to `SHIPPED` (`ORD-UC-06`).

---

## Step 4

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
  actor Carrier as Carrier Webhook / Poller
  participant ShipSvc as Shipping Service (:3008)
  participant DB as PostgreSQL (shipping_db)
  participant Broker as RabbitMQ Event Bus
  participant OrderSvc as Order Service (:3006)

  Carrier->>ShipSvc: POST /api/v1/shipping/webhook/{carrier} (trackingNumber, status)
  ShipSvc->>DB: UPDATE shipments SET status = ? WHERE tracking_number = ?
  alt Status == PICKED_UP / IN_TRANSIT
    ShipSvc->>Broker: Outbox Relay publishes `shipping.dispatched`
    Broker->>OrderSvc: Deliver `shipping.dispatched` -> Transition Order to SHIPPED
  end
  ShipSvc-->>Carrier: HTTP 200 OK
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Shipping Entity | Initial State | Ingest Carrier Real-Time Tracking Update | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in shipping_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| shipping_records | UPDATE | Persists updated state for Ingest Carrier Real-Time Tracking Update |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| shipping:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| shipping_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/shipping/webhook/{carrier} | Executes Ingest Carrier Real-Time Tracking Update |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| shipping.dispatched | Emitted upon successful execution of Ingest Carrier Real-Time Tracking Update |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- SHIP-BR-07

- SHIP-BR-11

- SHIP-BR-10

- SHIP-BR-12

- SHIP-BR-16

---

# 21. Related Use Cases

- ORD-UC-06

- SHIP-UC-03

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

- shipping-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (shipping_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- SHIP-BR-07

- SHIP-BR-11

- SHIP-BR-10

- SHIP-BR-12

- SHIP-BR-16

---

## Use Cases

- ORD-UC-06

- SHIP-UC-03

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
