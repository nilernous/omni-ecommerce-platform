---
id: WORKFLOW-AUTH-001

name: User Registration

description: Creates a new customer account by validating email uniqueness, hashing credentials, and publishing user registration events.

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
  - register

use_cases:
  - AUTH-UC-01

business_rules:
  - AUTH-BR-05
  - AUTH-BR-04
  - AUTH-BR-03
  - AUTH-BR-07
  - AUTH-BR-01
  - AUTH-BR-11
  - AUTH-BR-06
  - AUTH-BR-02

api:
  - POST /api/v1/auth/register

adr: []

published_events:
  - auth.user.registered

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: User Registration

---

# 1. Purpose

Creates a new customer account by validating email uniqueness, hashing credentials, and publishing user registration events.

---

# 2. Scope

## Included

- Core process execution for User Registration.
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

User Registration is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (auth-service) is online and responsive.
- [ ] Database connection to auth_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Ingress & Gateway Pipeline**: Client submits POST request to `/api/v1/auth/register`. Gateway injects `X-Correlation-ID` header and verifies IP sliding window rate limit (`AUTH-BR-11`).

---

## Step 2

**DTO Validation**: Auth Service NestJS `ValidationPipe` executes class-validator decorators verifying `email` is RFC 5322 formatted (`AUTH-BR-02`) and `password` meets strength constraints (`AUTH-BR-03`).

---

## Step 3

**Email Uniqueness Check**: Queries `auth_db` for existing email matching case-insensitively (`AUTH-BR-01`).

---

## Step 4

**Password Hashing**: Computes Argon2id / Bcrypt hash string (`AUTH-BR-04`).

---

## Step 5

**Transactional Persistence**: Starts DB transaction, creates `user` record with `role: CUSTOMER` (`AUTH-BR-05`), and writes `auth.user.registered` event into `auth_outbox` (`AUTH-BR-06`).

---

## Step 6

**Token Generation**: Signs RS256 JWT Access Token (1h TTL) and hashed Refresh Token (7d TTL) (`AUTH-BR-07`).

---

## Step 7

**Client Response**: Returns HTTP 201 envelope with user details, JWT access token, and refresh token cookie.

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

Email Conflict - Email already exists in `auth_db`

### Handling

Returns error code `EMAIL_ALREADY_REGISTERED`.

### Result

Client displays "Email already registered, please log in".

---

## Exception B

### Cause

Weak Password - Fails regex complexity check

### Handling

Returns error code `INVALID_PASSWORD_COMPLEXITY`.

### Result

Client prompts user to meet password criteria.

---

## Exception C

### Cause

Rate Limit Exceeded - > 10 registration attempts per IP/min

### Handling

Returns error code `RATE_LIMIT_EXCEEDED`.

### Result

Blocked at Gateway for 60 seconds.

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
  actor Client as Client App (Web/Mobile)
  participant Gateway as API Gateway (:3000)
  participant Auth as Auth Service (:3001)
  participant DB as PostgreSQL (auth_db)
  participant Broker as RabbitMQ Event Bus

  Client->>Gateway: POST /api/v1/auth/register (Registration DTO)
  Gateway->>Gateway: Rate Limit Check & Correlation ID Injection
  Gateway->>Auth: Forward Registration Request
  Auth->>Auth: Validate Email Format & Password Complexity
  Auth->>DB: Query SELECT email FROM users WHERE email = ?
  DB-->>Auth: Result (Null)
  Auth->>Auth: Hash Password with Argon2id / Bcrypt (Work factor 12)
  Auth->>DB: BEGIN TRANSACTION: Insert user & outbox record (auth.user.registered)
  DB-->>Auth: Transaction Committed
  Auth->>Broker: Outbox Relay publishes `auth.user.registered` event
  Auth->>Auth: Issue RS256 JWT Access Token (1h) & Refresh Token (7d)
  Auth-->>Gateway: HTTP 201 Created (User Profile + JWT Token Pair)
  Gateway-->>Client: Standard Response Envelope (Data + Meta)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Authentication Entity | Initial State | User Registration | Updated State |

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
| auth_records | UPDATE | Persists updated state for User Registration |
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
| POST | /api/v1/auth/register | Executes User Registration |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| auth.user.registered | Emitted upon successful execution of User Registration |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- AUTH-BR-05

- AUTH-BR-04

- AUTH-BR-03

- AUTH-BR-07

- AUTH-BR-01

- AUTH-BR-11

- AUTH-BR-06

- AUTH-BR-02

---

# 21. Related Use Cases

- AUTH-UC-01

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

- AUTH-BR-05

- AUTH-BR-04

- AUTH-BR-03

- AUTH-BR-07

- AUTH-BR-01

- AUTH-BR-11

- AUTH-BR-06

- AUTH-BR-02

---

## Use Cases

- AUTH-UC-01

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
