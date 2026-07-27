---
id: WORKFLOW-SHIP-001

name: Calculate Shipping Rate Options

description: Calculates shipping options and delivery rates based on destination and package weight.

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
  - calculate-shipping-rate

use_cases:
  - SHIP-UC-01

business_rules:
  - SHIP-BR-02
  - SHIP-BR-03
  - SHIP-BR-01

api:
  - POST /api/v1/shipping/calculate-rate

adr: []

published_events:
 []

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Calculate Shipping Rate Options

---

# 1. Purpose

Calculates shipping options and delivery rates based on destination and package weight.

---

# 2. Scope

## Included

- Core process execution for Calculate Shipping Rate Options.
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

Calculate Shipping Rate Options is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (shipping-service) is online and responsive.
- [ ] Database connection to shipping_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Volumetric Calculation**: Computes `Volumetric Weight = (L x W x H cm) / 5000` and sets billable weight (`SHIP-BR-02`).

---

## Step 2

**Carrier Rate Fetching**: Queries logistics carrier APIs for rate tiers (`SHIP-BR-01`).

---

## Step 3

**Free Shipping Evaluation**: Sets standard rate to `$0.00` if `subtotal >= $100.00` (`SHIP-BR-03`).

---

## Step 4

**Response**: Returns HTTP 200 OK with rates list.

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
  participant ShipSvc as Shipping Service (:3008)
  participant CarrierAPI as FedEx / UPS / DHL APIs

  Client->>ShipSvc: POST /api/v1/shipping/calculate-rate (destPostalCode, itemDimensions, cartSubtotal)
  ShipSvc->>ShipSvc: Compute Billable Weight = MAX(Actual, Volumetric) (SHIP-BR-02)
  ShipSvc->>CarrierAPI: Query Rates for Billable Weight & Zip Code
  CarrierAPI-->>ShipSvc: Carrier Rate Tiers (Standard, Express, Overnight)
  alt cartSubtotal >= $100.00
    ShipSvc->>ShipSvc: Set Standard Shipping Fee = $0.00 (SHIP-BR-03)
  end
  ShipSvc-->>Client: HTTP 200 OK (Shipping Rate Options Payload)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Shipping Entity | Initial State | Calculate Shipping Rate Options | Updated State |

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
| shipping_records | UPDATE | Persists updated state for Calculate Shipping Rate Options |
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
| POST | /api/v1/shipping/calculate-rate | Executes Calculate Shipping Rate Options |
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

- SHIP-BR-02

- SHIP-BR-03

- SHIP-BR-01

---

# 21. Related Use Cases

- SHIP-UC-01

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

- SHIP-BR-02

- SHIP-BR-03

- SHIP-BR-01

---

## Use Cases

- SHIP-UC-01

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
