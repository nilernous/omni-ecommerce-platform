---
id: WORKFLOW-ANL-003

name: View Top Product Sales Rankings (Admin / Seller)

description: Product sales leaderboards workflow querying TimescaleDB metric tables to rank SKUs by units sold and generated revenue.

version: 1.0.0

status: Approved

domain: Analytics

target_service: analytics-service

owner: Analytics Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - analytics
  - top-products-ranking

use_cases:
  - ANL-UC-03

business_rules:
  - ANL-BR-02

api:
  - GET /api/v1/analytics/top-products?limit=10

adr: []

published_events:
 []

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: View Top Product Sales Rankings (Admin / Seller)

---

# 1. Purpose

Product sales leaderboards workflow querying TimescaleDB metric tables to rank SKUs by units sold and generated revenue.

---

# 2. Scope

## Included

- Core process execution for View Top Product Sales Rankings (Admin / Seller).
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Analytics |
| Target Service | analytics-service |
| Primary Actor | Administrator |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Administrator

## Secondary Actors

- analytics-service
- Database (analytics_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

View Top Product Sales Rankings (Admin / Seller) is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (analytics-service) is online and responsive.
- [ ] Database connection to analytics_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Role Filtering**: Filters product metrics by `sellerId` if requester is a merchant, or returns platform-wide rankings if admin.

---

## Step 2

**Database Query**: Queries TimescaleDB for top selling SKUs ordered by units sold and revenue.

---

## Step 3

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
  actor Client as Admin / Seller
  participant AnlSvc as Analytics Service (:3014)
  participant DB as TimescaleDB (analytics_db)

  Client->>AnlSvc: GET /api/v1/analytics/top-products?limit=10
  alt Requester is SELLER
    AnlSvc->>DB: SELECT sku, SUM(quantity) as units_sold, SUM(total) as revenue FROM product_sales WHERE seller_id = ? GROUP BY sku ORDER BY units_sold DESC LIMIT 10
  else Requester is ADMIN
    AnlSvc->>DB: SELECT sku, SUM(quantity) as units_sold, SUM(total) as revenue FROM product_sales GROUP BY sku ORDER BY units_sold DESC LIMIT 10
  end
  DB-->>AnlSvc: Ranked Products Array
  AnlSvc-->>Client: HTTP 200 OK (Top Products Ranking Envelope)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Analytics Entity | Initial State | View Top Product Sales Rankings (Admin / Seller) | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in analytics_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| analytics_records | UPDATE | Persists updated state for View Top Product Sales Rankings (Admin / Seller) |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| analytics:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| analytics_index | UPDATE | Syncs index with primary database record |

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
| GET | /api/v1/analytics/top-products?limit=10 | Executes View Top Product Sales Rankings (Admin / Seller) |
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

- ANL-BR-02

---

# 21. Related Use Cases

- ANL-UC-03

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

- analytics-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (analytics_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- ANL-BR-02

---

## Use Cases

- ANL-UC-03

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
