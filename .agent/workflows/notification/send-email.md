---
id: WORKFLOW-NOTIF-001

name: Dispatch Transactional Email Notification

description: Dispatches transactional email notifications to users via email service provider.

version: 1.0.0

status: Approved

domain: Notification

target_service: notification-service

owner: Notification Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - notification
  - send-email

use_cases:
  - NOTIF-UC-01

business_rules:
  - NOTIF-BR-04
  - NOTIF-BR-01
  - NOTIF-BR-10
  - NOTIF-BR-08
  - NOTIF-BR-11
  - NOTIF-BR-06
  - NOTIF-BR-05

api:
 []

adr: []

published_events:
 []

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Dispatch Transactional Email Notification

---

# 1. Purpose

Dispatches transactional email notifications to users via email service provider.

---

# 2. Scope

## Included

- Core process execution for Dispatch Transactional Email Notification.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Notification |
| Target Service | notification-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- notification-service
- Database (notification_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Dispatch Transactional Email Notification is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (notification-service) is online and responsive.
- [ ] Database connection to notification_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Preference Check**: Verifies notification type. Transactional emails bypass marketing opt-out checks (`NOTIF-BR-04`, `NOTIF-BR-05`).

---

## Step 2

**Template Rendering**: Renders HTML template using Handlebars (`NOTIF-BR-01`).

---

## Step 3

**Queue Push**: Pushes email job to BullMQ Redis queue (`NOTIF-BR-06`).

---

## Step 4

**SMTP Dispatch**: BullMQ worker dispatches email via Nodemailer / SendGrid.

---

## Step 5

**Log History**: Records delivery status in `notification_db`.

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
  participant NotifSvc as Notification Service (:3013)
  participant RedisQueue as Redis (BullMQ Queue)
  participant Worker as BullMQ Worker
  participant SMTP as SMTP Gateway (SendGrid / Nodemailer)
  participant DB as PostgreSQL (notification_db)

  Broker->>NotifSvc: Deliver Event (`auth.user.registered` / `order.created` / `payment.completed`)
  NotifSvc->>NotifSvc: Check Transactional vs Marketing Opt-Out (NOTIF-BR-04, NOTIF-BR-05)
  NotifSvc->>NotifSvc: Render HTML Handlebars Email Template (NOTIF-BR-01)
  NotifSvc->>RedisQueue: Push Email Job to Queue (NOTIF-BR-06)
  Worker->>RedisQueue: Pop Email Job
  Worker->>SMTP: Send Email (to, subject, html)
  SMTP-->>Worker: SMTP 250 OK (Message ID)
  Worker->>DB: INSERT INTO notification_logs (type: EMAIL, status: DELIVERED)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Notification Entity | Initial State | Dispatch Transactional Email Notification | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in notification_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| notification_records | UPDATE | Persists updated state for Dispatch Transactional Email Notification |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| notification:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| notification_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/notification/send-email | Executes Dispatch Transactional Email Notification |
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

- NOTIF-BR-04

- NOTIF-BR-01

- NOTIF-BR-10

- NOTIF-BR-08

- NOTIF-BR-11

- NOTIF-BR-06

- NOTIF-BR-05

---

# 21. Related Use Cases

- NOTIF-UC-01

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

- notification-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (notification_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- NOTIF-BR-04

- NOTIF-BR-01

- NOTIF-BR-10

- NOTIF-BR-08

- NOTIF-BR-11

- NOTIF-BR-06

- NOTIF-BR-05

---

## Use Cases

- NOTIF-UC-01

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
