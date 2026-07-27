---
id: WORKFLOW-AUTH-003

name: Access & Refresh Token Rotation

description: Rotates user access and refresh tokens while invalidating consumed refresh tokens.

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
  - refresh-token

use_cases:
  - AUTH-UC-03

business_rules:
  - AUTH-BR-09
  - AUTH-BR-08
  - AUTH-BR-10
  - AUTH-BR-07

api:
  - POST /api/v1/auth/refresh-token

adr: []

published_events:
 []

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Access & Refresh Token Rotation

---

# 1. Purpose

Rotates user access and refresh tokens while invalidating consumed refresh tokens.

---

# 2. Scope

## Included

- Core process execution for Access & Refresh Token Rotation.
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

Access & Refresh Token Rotation is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (auth-service) is online and responsive.
- [ ] Database connection to auth_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Token Ingestion**: Receives refresh token string from request header or HttpOnly cookie.

---

## Step 2

**Hash & Database Lookup**: Hashes token string and queries `auth_db` for active refresh token session (`AUTH-BR-08`).

---

## Step 3

**Security Audit (Reuse Detection)**:

---

## Step 4

**Token Invalidation**: Marks submitted refresh token as `REVOKED` (`AUTH-BR-09`).

---

## Step 5

**New Token Issuance**: Generates fresh RS256 JWT Access Token (1h) and new Refresh Token (7d).

---

## Step 6

**Session Update**: Persists new refresh token in `auth_db` and returns rotated credentials to client.

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

Token Reuse Breach - Submitting an already revoked refresh token

### Handling

Returns error code `TOKEN_REUSE_DETECTED`.

### Result

All user sessions revoked immediately (`AUTH-BR-10`).

---

## Exception B

### Cause

Expired Refresh Token - Token passed 7-day TTL

### Handling

Returns error code `REFRESH_TOKEN_EXPIRED`.

### Result

User forced to log in again.

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
  actor Client as Client App
  participant Gateway as API Gateway (:3000)
  participant Auth as Auth Service (:3001)
  participant DB as PostgreSQL (auth_db)

  Client->>Gateway: POST /api/v1/auth/refresh-token (Refresh Token Cookie/Payload)
  Gateway->>Auth: Forward Token Rotation Request
  Auth->>Auth: Hash Incoming Refresh Token String (SHA-256)
  Auth->>DB: Query SELECT * FROM refresh_tokens WHERE token_hash = ?
  alt Token Found & Active
    DB-->>Auth: Refresh Token Record (valid, not revoked)
    Auth->>DB: UPDATE refresh_tokens SET status = 'REVOKED' WHERE id = ?
    Auth->>Auth: Issue New RS256 JWT Access Token (1h) & New Refresh Token (7d)
    Auth->>DB: INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    Auth-->>Gateway: HTTP 200 OK (New Access Token + Rotated Refresh Token)
    Gateway-->>Client: Return Success Envelope
  else Token Previously Revoked (Reuse Breach)
    DB-->>Auth: Refresh Token Record (status = REVOKED)
    Auth->>DB: UPDATE refresh_tokens SET status = 'REVOKED' WHERE user_id = ?
    Auth-->>Gateway: HTTP 401 Unauthorized (Security Breach Detected)
  end
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Authentication Entity | Initial State | Access & Refresh Token Rotation | Updated State |

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
| auth_records | UPDATE | Persists updated state for Access & Refresh Token Rotation |
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
| POST | /api/v1/auth/refresh-token | Executes Access & Refresh Token Rotation |
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

- AUTH-BR-09

- AUTH-BR-08

- AUTH-BR-10

- AUTH-BR-07

---

# 21. Related Use Cases

- AUTH-UC-03

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

- AUTH-BR-09

- AUTH-BR-08

- AUTH-BR-10

- AUTH-BR-07

---

## Use Cases

- AUTH-UC-03

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
