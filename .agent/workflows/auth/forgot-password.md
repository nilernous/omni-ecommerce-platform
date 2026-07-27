---
id: WORKFLOW-AUTH-005

name: Forgot Password Email Request

description: Generates password reset token and dispatches reset instructions email to user.

version: 1.0.0

status: Approved

domain: Authentication

target_service: auth-service

owner: Authentication Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - auth
  - forgot-password

use_cases:
  - AUTH-UC-05

business_rules:
  - AUTH-BR-12

api:
  - POST /api/v1/auth/forgot-password

adr: []

published_events:
  - event

consumed_events:
  - event

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Forgot Password Email Request

---

# 1. Purpose

Generates password reset token and dispatches reset instructions email to user.

---

# 2. Scope

## Included

- Core process execution for Forgot Password Email Request.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Authentication |
| Target Service | auth-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- auth-service
- Database (auth_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Forgot Password Email Request is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (auth-service) is online and responsive.
- [ ] Database connection to auth_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Email Lookup**: Searches `auth_db` for registered user email.

---

## Step 2

**Token Generation**: Generates 15-minute cryptographically secure reset token string (`AUTH-BR-12`).

---

## Step 3

**Outbox Persistence**: Saves token hash to `password_resets` table and enqueues event to `auth_outbox`.

---

## Step 4

**Notification Dispatch**: Notification Service consumes event and emails reset link URL (`https://omnicommerce.com/reset-password?token=...`).

---

## Step 5

**Enumeration Protection**: Always returns HTTP 200 generic message regardless of whether email was found.

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
  actor Client as Customer / Seller
  participant Gateway as API Gateway (:3000)
  participant Auth as Auth Service (:3001)
  participant DB as PostgreSQL (auth_db)
  participant Broker as RabbitMQ Event Bus
  participant Notif as Notification Service (:3013)

  Client->>Gateway: POST /api/v1/auth/forgot-password (email)
  Gateway->>Auth: Forward Request
  Auth->>DB: Query SELECT * FROM users WHERE email = ?
  alt Email Found
    DB-->>Auth: User Record
    Auth->>Auth: Generate 15-Min Secure Password Reset Token
    Auth->>DB: INSERT INTO password_resets (user_id, token_hash, expires_at)
    Auth->>DB: INSERT INTO auth_outbox (event: auth.password.reset_requested)
    Auth->>Broker: Outbox Relay publishes event
    Broker->>Notif: Deliver reset_requested event
    Notif->>Notif: Render HTML reset email & dispatch SMTP
  end
  Auth-->>Gateway: HTTP 200 OK (Generic Email Sent Message)
  Gateway-->>Client: Return Response (Prevents Email Enumeration)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Authentication Entity | Initial State | Forgot Password Email Request | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in auth_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| auth_records | UPDATE | Persists updated state for Forgot Password Email Request |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| auth:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| auth_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/auth/forgot-password | Executes Forgot Password Email Request |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| event | Emitted upon successful execution of Forgot Password Email Request |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| event | Consumed to trigger or process Forgot Password Email Request |
---

# 20. Business Rules

Reference Business Rule IDs only.

- AUTH-BR-12

---

# 21. Related Use Cases

- AUTH-UC-05

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

- auth-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (auth_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- AUTH-BR-12

---

## Use Cases

- AUTH-UC-05

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
