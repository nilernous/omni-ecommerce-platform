---
description: A metadata for each workflow which must be followed
---

# Workflow Metadata Specification

Version: 1.0.0

---

# Purpose

This document defines the metadata schema for all Workflow documents.

Metadata provides structured information that enables:

- Traceability
- Discoverability
- Consistency
- Documentation governance
- AI understanding

Every workflow document MUST begin with a YAML metadata block following this specification.

---

# Metadata Format

Workflow metadata must be written using YAML Front Matter.

Example

```yaml
---
id: WORKFLOW-ORDER-001

name: Customer Checkout

description: Processes customer checkout by validating the cart, creating an order, initiating payment, and publishing domain events.

version: 1.0.0

status: Approved

domain: Order

target_service: order-service

owner: Commerce Team

reviewer: Architecture Team

priority: High

critical: true

estimated_complexity: High

tags:
  - checkout
  - payment

use_cases:
  - ORDER-UC-001

business_rules:
  - ORDER-BR-001
  - PAYMENT-BR-003

api:
  - POST /api/v1/orders

adr:
  - ADR-012

published_events:
  - OrderCreated

consumed_events:
  - PaymentCompleted

related_workflows:
  - WORKFLOW-PAYMENT-001

created: 2026-07-28

updated: 2026-07-28
---
```

---

# Required Fields

The following fields are mandatory.

| Field | Description |
|--------|-------------|
| id | Unique workflow identifier |
| name | Workflow name |
| description | Workflow summary |
| version | Document version |
| status | Workflow status |
| domain | Business domain |
| target_service | Responsible service |
| use_cases | Related use cases |
| business_rules | Related business rules |

---

# Optional Fields

| Field | Description |
|--------|-------------|
| owner | Document owner |
| reviewer | Document reviewer |
| priority | Business priority |
| critical | Critical business process |
| estimated_complexity | Estimated implementation complexity |
| tags | Search keywords |
| api | Related APIs |
| adr | Related ADR documents |
| published_events | Published domain events |
| consumed_events | Consumed domain events |
| related_workflows | Related workflow IDs |
| created | Creation date |
| updated | Last update date |

---

# Field Definitions

---

## id

Required

Unique identifier for the workflow.

Format

```
WORKFLOW-<DOMAIN>-<NUMBER>
```

Examples

```
WORKFLOW-AUTH-001

WORKFLOW-ORDER-003

WORKFLOW-PAYMENT-007
```

Rules

- Must be unique.
- Uppercase only.
- Hyphen separated.
- Number must contain three digits.

---

## name

Required

Human-readable workflow name.

Examples

```
Customer Checkout

Forgot Password

Cancel Order

Reserve Inventory
```

Rules

- Use Title Case.
- Avoid abbreviations.
- Keep under 100 characters.

---

## description

Required

A concise summary describing the workflow.

Rules

- English only.
- One sentence.
- Start with an action verb.
- 50–250 characters.
- Describe business purpose.
- Do not describe implementation.

Good Examples

```
Processes customer checkout by validating the cart, creating an order, initiating payment, and publishing domain events.

Cancels an order by validating its status, releasing reserved inventory, and notifying downstream services.
```

Bad Examples

```
Checkout

Workflow for checkout

Handles checkout logic
```

---

## version

Required

Document version.

Format

```
Major.Minor.Patch
```

Examples

```
1.0.0

1.2.0

2.0.0
```

---

## status

Required

Allowed values

```
Draft

Review

Approved

Deprecated
```

---

## domain

Required

Business domain that owns the workflow.

Examples

```
Authentication

Order

Inventory

Catalog

Payment

Shipping

Promotion

Customer
```

---

## target_service

Required

The service responsible for executing the workflow.

Examples

```
auth-service

order-service

payment-service

inventory-service
```

---

## owner

Optional

Team responsible for maintaining the document.

Example

```
Commerce Team
```

---

## reviewer

Optional

Team or individual responsible for reviewing the workflow.

---

## priority

Optional

Allowed values

```
Low

Medium

High

Critical
```

---

## critical

Optional

Boolean value.

Allowed values

```
true

false
```

---

## estimated_complexity

Optional

Allowed values

```
Low

Medium

High
```

---

## tags

Optional

Search keywords.

Example

```yaml
tags:
  - checkout
  - payment
  - customer
```

Rules

- lowercase
- kebab-case when multiple words

Example

```
payment

order-management

inventory-sync
```

---

## use_cases

Required

Reference related Use Case IDs.

Example

```yaml
use_cases:
  - ORDER-UC-001
  - PAYMENT-UC-003
```

Rules

Never duplicate Use Case content.

---

## business_rules

Required

Reference Business Rule IDs.

Example

```yaml
business_rules:
  - ORDER-BR-002
  - PAYMENT-BR-004
```

Rules

Never duplicate Business Rules.

---

## api

Optional

Reference related API endpoints.

Example

```yaml
api:
  - POST /api/v1/orders
  - GET /api/v1/orders/{id}
```

---

## adr

Optional

Reference Architecture Decision Records.

Example

```yaml
adr:
  - ADR-012
  - ADR-018
```

---

## published_events

Optional

Events emitted by the workflow.

Example

```yaml
published_events:
  - OrderCreated
  - InventoryReserved
```

---

## consumed_events

Optional

Events consumed by the workflow.

Example

```yaml
consumed_events:
  - PaymentCompleted
  - InventoryConfirmed
```

---

## related_workflows

Optional

Reference related workflow IDs.

Example

```yaml
related_workflows:
  - WORKFLOW-PAYMENT-001
  - WORKFLOW-INVENTORY-002
```

---

## created

Optional

Document creation date.

Format

```
YYYY-MM-DD
```

---

## updated

Optional

Last update date.

Format

```
YYYY-MM-DD
```

---

# Validation Rules

Every metadata block must satisfy the following rules.

- YAML Front Matter is required.
- Required fields must always exist.
- Unknown fields are not allowed.
- Empty required fields are not allowed.
- Lists must use YAML array syntax.
- IDs are case-sensitive.
- Status must use an allowed value.
- Version must follow Semantic Versioning.
- Dates must use ISO-8601 format (YYYY-MM-DD).

---

# Naming Conventions

Workflow IDs

```
WORKFLOW-AUTH-001

WORKFLOW-ORDER-002

WORKFLOW-PAYMENT-003
```

Business Rules

```
ORDER-BR-001
```

Use Cases

```
ORDER-UC-001
```

ADR

```
ADR-012
```

---

# AI Guidelines

AI agents generating workflow documents must:

1. Populate every required field.
2. Never invent metadata fields.
3. Reuse existing IDs whenever possible.
4. Reference existing documents instead of duplicating content.
5. Use TODO when required information is unavailable.
6. Keep metadata synchronized with workflow content.
7. Keep naming consistent across the repository.

---

# Validation Checklist

Before publishing a workflow, verify:

- YAML Front Matter is valid.
- All required fields are populated.
- IDs follow naming conventions.
- Description follows writing rules.
- Version is valid.
- Status is valid.
- Referenced Business Rules exist.
- Referenced Use Cases exist.
- Referenced ADRs exist.
- Event names match the Event Catalog.
- Metadata matches the workflow body.

---

# Changelog

| Version | Date | Changes |
|----------|------------|---------|
| 1.0.0 | YYYY-MM-DD | Initial version |