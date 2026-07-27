---
id: WORKFLOW-SRCH-001

name: Full-Text Product Search & Faceted Filter

description: Executes full-text search query across product catalog with filtering and sorting.

version: 1.0.0

status: Approved

domain: Search

target_service: search-service

owner: Search Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - search
  - fulltext-search

use_cases:
  - SRCH-UC-01

business_rules:
  - SRCH-BR-03
  - SRCH-BR-02
  - SRCH-BR-01

api:
  - GET /api/v1/search/products?q=headphones&category=audio&minPrice=50

adr: []

published_events:
 []

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Full-Text Product Search & Faceted Filter

---

# 1. Purpose

Executes full-text search query across product catalog with filtering and sorting.

---

# 2. Scope

## Included

- Core process execution for Full-Text Product Search & Faceted Filter.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Search |
| Target Service | search-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- search-service
- Database (search_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Full-Text Product Search & Faceted Filter is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (search-service) is online and responsive.
- [ ] Database connection to search_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Query Formulation**: Constructs Elasticsearch multi-match search query with field weight boosting (`Title^3`, `Category^2`, `Brand^2`, `SRCH-BR-02`).

---

## Step 2

**Filter & Aggregations**: Applies faceted filtering (`categoryId`, `brandId`, `priceRange`, `inStock`, `SRCH-BR-03`).

---

## Step 3

**Index Execution**: Queries Elasticsearch `products_index` (`SRCH-BR-01`).

---

## Step 4

**Response**: Returns HTTP 200 OK with search results and facet options.

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
  actor Client as Customer App
  participant SrchSvc as Search Service (:3102)
  participant ES as Elasticsearch (products_index)

  Client->>SrchSvc: GET /api/v1/search/products?q=headphones&category=audio&minPrice=50
  SrchSvc->>SrchSvc: Build ES Multi-Match Query (Title^3, Category^2, Brand^2) (SRCH-BR-02)
  SrchSvc->>SrchSvc: Build Term & Range Filters (category, price, inStock: true) (SRCH-BR-03)
  SrchSvc->>ES: Search `products_index` (Query + Facet Aggregations)
  ES-->>SrchSvc: Search Hits & Aggregation Facets Payload
  SrchSvc-->>Client: HTTP 200 OK (Search Results & Facet Options Envelope)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Search Entity | Initial State | Full-Text Product Search & Faceted Filter | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in search_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| search_records | UPDATE | Persists updated state for Full-Text Product Search & Faceted Filter |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| search:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| search_index | UPDATE | Syncs index with primary database record |

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
| GET | /api/v1/search/products?q=headphones&category=audio&minPrice=50 | Executes Full-Text Product Search & Faceted Filter |
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

- SRCH-BR-03

- SRCH-BR-02

- SRCH-BR-01

---

# 21. Related Use Cases

- SRCH-UC-01

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

- search-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (search_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- SRCH-BR-03

- SRCH-BR-02

- SRCH-BR-01

---

## Use Cases

- SRCH-UC-01

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
