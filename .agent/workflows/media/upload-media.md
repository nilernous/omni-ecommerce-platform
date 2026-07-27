---
id: WORKFLOW-MED-001

name: Upload Media File Asset

description: Uploads product images or document assets to media storage and saves asset records.

version: 1.0.0

status: Approved

domain: Media

target_service: media-service

owner: Media Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: Medium

tags:
  - media
  - upload-media

use_cases:
  - MED-UC-01

business_rules:
  - MED-BR-07
  - MED-BR-04
  - MED-BR-03
  - MED-BR-05
  - MED-BR-06
  - MED-BR-08
  - MED-BR-01
  - MED-BR-02

api:
  - POST /api/v1/media/upload

adr: []

published_events:
  - media.uploaded

consumed_events:
 []

related_workflows: []

created: 2026-07-28

updated: 2026-07-28
---

# Workflow: Upload Media File Asset

---

# 1. Purpose

Uploads product images or document assets to media storage and saves asset records.

---

# 2. Scope

## Included

- Core process execution for Upload Media File Asset.
- Validation of business constraints and request integrity.
- State persistence and event notification upon completion.

## Excluded

- Lower-level network routing and API Gateway authentication checks.
- Downstream asynchronous event processing beyond event publication.

---

# 3. Overview

| Property | Value |
|----------|--------|
| Domain | Media |
| Target Service | media-service |
| Primary Actor | Client / User |
| Trigger | API Request / Event |
| Output | Process Status Response |

---

# 4. Actors

## Primary Actor

- Client / User

## Secondary Actors

- media-service
- Database (media_db)
- MessageBroker (RabbitMQ)

---

# 5. Trigger

Upload Media File Asset is initiated via incoming client API request or internal message event.

---

# 6. Preconditions

The following conditions must be satisfied before execution.

- [ ] Target service (media-service) is online and responsive.
- [ ] Database connection to media_db is active.
- [ ] Request parameters comply with structural schema validation.

---

# 7. Main Flow

## Step 1

**Validation Pipeline**: Checks MIME type whitelist (`MED-BR-01`), file size limits (5MB images / 10MB docs, `MED-BR-02`, `MED-BR-03`), and binary magic bytes (`MED-BR-04`).

---

## Step 2

**Image Processing**: Converts images to WebP format (`MED-BR-05`) and resizes thumbnails (150px, 500px, 1200px, `MED-BR-06`).

---

## Step 3

**Storage Upload**: Transmits file binaries to object storage bucket (`MinIO` / `Cloudflare R2` / `AWS S3`).

---

## Step 4

**Persistence & Outbox**: Saves asset record in `media_db` with HTTPS CDN URLs (`MED-BR-07`) and emits `media.uploaded` event (`MED-BR-08`).

---

## Step 5

**Response**: Returns HTTP 201 Created with CDN URLs payload.

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
  actor Client as Customer / Seller / Admin
  participant MedSvc as Media Service (:3011)
  participant S3 as Object Storage (MinIO / R2 / S3)
  participant DB as PostgreSQL (media_db)
  participant Broker as RabbitMQ Event Bus

  Client->>MedSvc: POST /api/v1/media/upload (multipart/form-data)
  MedSvc->>MedSvc: Validate MIME Type Whitelist (MED-BR-01) & File Size Limits (MED-BR-02, MED-BR-03)
  MedSvc->>MedSvc: Verify Magic Bytes Header (MED-BR-04)
  alt Images (jpeg/png/webp)
    MedSvc->>MedSvc: Convert image to WebP format (MED-BR-05)
    MedSvc->>MedSvc: Generate Thumbnail Variants: 150px, 500px, 1200px (MED-BR-06)
  end
  MedSvc->>S3: PutObject (original asset & thumbnail WebP files)
  S3-->>MedSvc: Storage Keys Confirmed
  MedSvc->>DB: INSERT INTO media (file_name, mime_type, cdn_url, thumbnails)
  MedSvc->>Broker: Outbox Relay publishes `media.uploaded`
  MedSvc-->>Client: HTTP 201 Created (Asset Details & Public CDN URLs)
```

---

# 12. State Changes

| Entity | Before | Action | After |
|----------|----------|----------|---------|
| Media Entity | Initial State | Upload Media File Asset | Updated State |

---

# 13. Data Changes

## Created

- Audit log entry.
- Domain event record (outbox table).

## Updated

- Target entity attributes in media_db.

## Deleted

- Temporary session or cache entry (if applicable).

---

# 14. Database Operations

| Table | Operation | Description |
|----------|------------|-------------|
| media_records | UPDATE | Persists updated state for Upload Media File Asset |
| outbox_events | INSERT | Records domain event for event bus relay |

---

# 15. Cache Operations

| Cache Key | Operation | Description |
|------------|------------|-------------|
| media:cache | EXPIRE | Invalidates or refreshes relevant cache entry |

---

# 16. Search Index Operations

| Index | Operation | Description |
|--------|-----------|-------------|
| media_index | UPDATE | Syncs index with primary database record |

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
| POST | /api/v1/media/upload | Executes Upload Media File Asset |
---

# 19. Events

## Published Events

| Event | Description |
|---------|-------------|
| media.uploaded | Emitted upon successful execution of Upload Media File Asset |
---

## Consumed Events

| Event | Description |
|---------|-------------|
| None | No domain events consumed |
---

# 20. Business Rules

Reference Business Rule IDs only.

- MED-BR-07

- MED-BR-04

- MED-BR-03

- MED-BR-05

- MED-BR-06

- MED-BR-08

- MED-BR-01

- MED-BR-02

---

# 21. Related Use Cases

- MED-UC-01

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

- media-service

---

## External Systems

- API Gateway
- Event Broker (RabbitMQ)

---

## Infrastructure

- PostgreSQL (media_db)
- Redis Cache

---

# 30. References

## ADR

- ADR-001 (Architecture Governance)

---

## Business Rules

- MED-BR-07

- MED-BR-04

- MED-BR-03

- MED-BR-05

- MED-BR-06

- MED-BR-08

- MED-BR-01

- MED-BR-02

---

## Use Cases

- MED-UC-01

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
