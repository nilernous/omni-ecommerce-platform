---
description: A context that need to read first
---

# Workflow Context

Version: 1.0.0

---

# Purpose

This directory contains workflow documentation for the project.

Each workflow describes the execution flow of a single business process from trigger to completion.

Workflow documents are intended for developers, architects, business analysts, and AI agents.

---

# Objective

The purpose of a workflow document is to describe:

- How a business process is executed.
- Which actors participate.
- Which services are involved.
- Which events are published or consumed.
- Which systems exchange data.
- How failures and alternative paths are handled.

Workflow documents should describe **execution flow**, not implementation details.

---

# Scope

Workflow documents may describe:

- Business workflows
- Technical workflows
- Event-driven workflows
- Scheduled workflows
- Integration workflows

Workflow documents must NOT replace:

- Business Rules
- Use Cases
- API Documentation
- Architecture Documentation
- ADRs
- Database Documentation

Instead, reference those documents whenever applicable.

---

# Required Reading

Before creating or modifying a workflow, read the following documents in order:

1. template.md
2. metadata.md
3. Relevant Business Rules
4. Relevant Use Cases
5. Related ADRs (if available)
6. Existing workflow examples

---

# Template

Every workflow document MUST follow the official structure defined in:

TEMPLATE.md

Do not:

- Change section order
- Remove required sections
- Invent new document structures

Optional sections may be omitted only if explicitly marked as optional.

---

# Metadata

Workflow metadata MUST follow:

METADATA.md

Never invent metadata fields.

Always populate required fields.

If information is unavailable, use:

TODO

instead of making assumptions.

---

# Writing Style

Workflow documents must:

- Use clear technical English.
- Use active voice.
- Be concise and consistent.
- Describe execution flow logically.
- Keep terminology consistent across the project.

Avoid:

- Marketing language
- Subjective wording
- Redundant explanations
- Copying Business Rules
- Copying Use Cases

---

# Business Rules

Never duplicate Business Rules.

Always reference Business Rule IDs.

Example:

- ORDER-BR-001
- PAYMENT-BR-004

---

# Use Cases

Never rewrite Use Cases.

Always reference Use Case IDs.

Example:

- ORDER-UC-001
- AUTH-UC-003

---

# Architecture

Workflow documents must respect the project's architecture.

Do not introduce flows that violate architectural decisions.

If architecture conflicts arise, follow the ADR.

---

# Events

Use actual event names.

Do not invent event names.

Always distinguish:

- Published Events
- Consumed Events

---

# Diagrams

Sequence diagrams should:

- Use Mermaid syntax.
- Follow the structure defined in TEMPLATE.md.
- Represent actual participants.
- Match the written workflow.

If state transitions are important, include a state diagram.

---

# Traceability

Every workflow should be traceable to:

- Use Cases
- Business Rules
- APIs
- Services
- Events
- ADRs (if applicable)

Reference existing documents instead of duplicating content.

---

# AI Instructions

When generating a workflow:

1. Read TEMPLATE.md.
2. Read METADATA.md.
3. Read related Business Rules.
4. Read related Use Cases.
5. Read related ADRs.
6. Follow the official template.
7. Keep terminology consistent.
8. Reuse existing event names.
9. Reuse existing service names.
10. Reuse existing API names.
11. Never invent Business Rule IDs.
12. Never invent Use Case IDs.
13. Never invent ADR IDs.
14. If required information is missing, write TODO instead of guessing.

---

# Priority

When conflicts occur, follow this priority:

1. ADR
2. Business Rules
3. Use Cases
4. TEMPLATE.md
5. METADATA.md
6. Existing Workflow Documents
7. Source Code

---

# Goal

Every workflow should be:

- Consistent
- Traceable
- Easy to maintain
- Easy for humans to read
- Easy for AI agents to understand