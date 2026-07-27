---
id: WORKFLOW-USER-002

name: Update User Profile

description: Updates customer profile information including name and contact details.

version: 1.0.0

status: Approved

domain: User

target_service: user-service

owner: User Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - user
  - update-profile

use_cases:
  - USER-UC-02

business_rules:
  - USER-BR-14
  - USER-BR-04
  - USER-BR-02
  - USER-BR-05
  - USER-BR-01

api:
  - PATCH /api/v1/users/profile

adr: []

published_events:
  - user.profile.updated

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Update User Profile

---

# 1. Purpose

Updates customer profile information including name and contact details.

---

# 2. Scope

## Included

- Core process execution for Update User Profile.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | User |
| Target Service | user-service |
| Primary Actor | Authenticated Customer |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Authenticated Customer

## Secondary Actors

- user-service
- Database (user_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Update User Profile is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (user-service) is online and responsive.
- [ ] Database connection to user_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Validation**: Checks E.164 phone format (`USER-BR-02`), name character lengths (`USER-BR-04`), and minimum age >= 13 (`USER-BR-05`).

---

## Step 2

**Persistence**: Updates user entity in `user_db`.

---

## Step 3

**Outbox Emission**: Emits `user.profile.updated` domain event (`USER-BR-14`).

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
  actor Client as Customer App
  participant UserSvc as User Service (:3002)
  participant DB as PostgreSQL (user_db)
  participant Broker as RabbitMQ Event Bus

  Client->>UserSvc: PATCH /api/v1/users/profile (firstName, phone, dateOfBirth)
  UserSvc->>UserSvc: Validate E.164 Phone & Minimum Age >= 13
  UserSvc->>DB: UPDATE users SET firstName = ?, phone = ? WHERE id = ?
  UserSvc->>DB: INSERT INTO user_outbox (event: user.profile.updated)
  UserSvc->>Broker: Outbox Relay publishes `user.profile.updated`
  UserSvc-->>Client: HTTP 200 OK (Updated Profile Payload)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| User Entity | Initial State | Update User Profile | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in user_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| user_records | UPDATE | Persists updated state for Update User Profile |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| user:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| user_index | UPDATE | Syncs index with primary database record |

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
| PATCH | /api/v1/users/profile | Executes Update User Profile |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| user.profile.updated | Emitted upon successful execution of Update User Profile |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- USER-BR-14

- USER-BR-04

- USER-BR-02

- USER-BR-05

- USER-BR-01

---

# 21. Related Use Cases

- USER-UC-02

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

- user-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (user_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- USER-BR-14

- USER-BR-04

- USER-BR-02

- USER-BR-05

- USER-BR-01

---

## Use Cases

- USER-UC-02

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
