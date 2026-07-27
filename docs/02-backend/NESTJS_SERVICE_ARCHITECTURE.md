# Part 1 — Foundation

---

# 1. Introduction

## 1.1 Purpose

This document defines the **standard architectural blueprint** for every backend microservice within the OmniCommerce platform.

Rather than documenting an individual business service (such as Product Service or Order Service), this document establishes a unified architecture that every NestJS-based microservice must follow.

The objective is to provide a consistent and maintainable foundation for designing, implementing, deploying, and operating backend services across the entire platform.

By enforcing a common architectural standard, OmniCommerce ensures that all services remain consistent regardless of business domain or engineering team.

This document standardizes:

- Overall service architecture
- Project organization
- Layered architecture
- Module organization
- Dependency management
- Service communication
- Coding conventions
- Integration patterns
- Security standards
- Observability
- Operational practices

This document serves as the authoritative reference for backend service development.

---

## 1.2 Scope

This document applies to every backend microservice within the OmniCommerce ecosystem.

Examples include:

- Authentication Service
- User Service
- Catalog Service
- Pricing Service
- Inventory Service
- Order Service
- Payment Service
- Shipping Service
- Notification Service
- Search Service
- Recommendation Service
- Analytics Service

Every newly developed service MUST comply with the architectural standards defined in this document.

This document does not define:

- Business requirements
- API specifications
- Database schemas
- Infrastructure deployment
- UI architecture

These topics are covered by their corresponding architecture documents.

---

## 1.3 Audience

This document is intended for:

- Solution Architects
- Software Architects
- Technical Leads
- Backend Engineers
- Platform Engineers
- DevOps Engineers
- Site Reliability Engineers (SRE)
- QA Engineers

Readers are expected to have a working knowledge of:

- TypeScript
- NestJS
- Microservices Architecture
- Domain-Driven Design (DDD)
- Clean Architecture
- PostgreSQL
- gRPC
- RabbitMQ
- Docker

---

## 1.4 Objectives

The primary objectives of this document are:

- Standardize backend service architecture.
- Establish a reusable service blueprint.
- Improve maintainability.
- Improve scalability.
- Improve consistency across teams.
- Reduce architectural drift.
- Promote loose coupling.
- Enable independent deployment.
- Simplify onboarding.
- Encourage long-term sustainability.

---

## 1.5 Architecture Principles

Every backend service within OmniCommerce must adhere to the following architectural principles.

### Single Responsibility

Each service owns one business capability.

A service should focus on solving one business problem and avoid taking responsibilities belonging to other domains.

---

### Domain Ownership

Every service owns its domain completely.

This includes:

- Business rules
- APIs
- Database
- Domain events
- Integrations

No service may modify another service's domain model.

---

### Feature-First Organization

The project structure is organized around **business features (bounded contexts)** rather than technical layers.

Example:

```text
src/

product/

order/

payment/

customer/
```

instead of:

```text
src/

controllers/

services/

repositories/

entities/
```

This organization improves scalability and domain ownership.

---

### Layered Architecture

Each feature follows the same internal architecture.

```text
Presentation

↓

Application

↓

Domain

↓

Infrastructure
```

Every layer has a clearly defined responsibility.

Dependencies always point inward.

---

### Stateless Services

Application instances remain stateless.

Persistent data should be stored in external infrastructure such as:

- PostgreSQL
- Redis
- RabbitMQ
- Object Storage

Stateless services enable horizontal scaling and fault tolerance.

---

### Database per Service

Each service exclusively owns its database.

Other services must never:

- Read another service's database
- Write another service's database
- Share database tables

All communication must occur through service contracts.

---

### Contract-First Communication

Services communicate through explicit contracts.

Supported communication mechanisms include:

- REST APIs
- gRPC
- Domain Events

Internal implementation details must remain hidden.

---

### Independent Deployment

Each service must support:

- Independent build
- Independent testing
- Independent deployment
- Independent scaling
- Independent monitoring

Deploying one service must not require redeploying another.

---

### Observable by Default

Operational visibility is a mandatory capability.

Every service must provide:

- Structured logging
- Metrics
- Distributed tracing
- Health checks

---

### Secure by Default

Security is integrated into every layer.

Every service should implement:

- Authentication
- Authorization
- Input validation
- Secure configuration
- Principle of least privilege

---

## 1.6 Design Goals

The architecture aims to achieve the following qualities.

- High cohesion
- Low coupling
- Scalability
- Maintainability
- Extensibility
- Testability
- Reliability
- Fault isolation
- Operational simplicity
- Consistency

---

## 1.7 Governance

This document is governed by the OmniCommerce Architecture Team.

Architectural decisions affecting service standards should:

- Be documented through an Architecture Decision Record (ADR).
- Preserve backward compatibility whenever practical.
- Be reviewed before implementation.
- Be communicated to all engineering teams.

Exceptions to these standards should be rare, justified, and documented.

---

# 2. Architecture Goals

## 2.1 Overview

OmniCommerce adopts a microservices architecture in which each backend service represents a single bounded context and owns its complete business capability.

Every service follows the same architectural blueprint regardless of its business domain.

This consistency enables engineers to move between services with minimal onboarding effort while reducing maintenance costs over time.

---

## 2.2 Primary Goals

The service architecture is designed to achieve the following goals.

### Domain Isolation

Each service owns its business domain independently.

Business logic should never be duplicated across services.

---

### Independent Deployment

Services can be built, tested, deployed, and rolled back independently.

---

### Horizontal Scalability

Application instances should scale horizontally without requiring architectural changes.

---

### Loose Coupling

Services communicate through stable contracts instead of direct implementation dependencies.

---

### High Cohesion

Business logic belonging to the same domain remains within the same service.

---

### Fault Isolation

Failures should remain isolated within the affected service whenever possible.

---

### Operational Visibility

Every service provides sufficient telemetry for monitoring, debugging, and troubleshooting.

---

### Long-Term Maintainability

The architecture should remain understandable and extensible as the platform grows.

---

## 2.3 Non-Goals

The following practices are intentionally excluded from the architecture.

- Shared databases
- Shared repositories
- Shared entities
- Cross-service transactions
- Distributed monoliths
- Tight coupling
- Direct database access across services
- Business logic duplication

---

## 2.4 Architectural Characteristics

| Characteristic | Standard |
|----------------|----------|
| Architecture Style | Microservices |
| Framework | NestJS |
| Language | TypeScript |
| Organization | Feature-first |
| Architecture Pattern | Clean Architecture |
| Domain Modeling | Domain-Driven Design |
| Communication | gRPC + RabbitMQ |
| Data Ownership | Database per Service |
| Deployment | Independent |
| Scalability | Horizontal |
| Observability | Built-in |
| Security | Zero Trust |

---

## 2.5 Success Criteria

A backend service is considered compliant with this architecture if it:

- Follows the standard service blueprint.
- Organizes code by feature.
- Implements the prescribed layered architecture.
- Owns its database exclusively.
- Uses approved communication protocols.
- Supports independent deployment.
- Provides health checks.
- Emits logs, metrics, and traces.
- Complies with platform security standards.

---

## 2.6 References

This document complements the following architecture documents.

- `SYSTEM_ARCHITECTURE.md`
- `BACKEND_ARCHITECTURE.md`
- `API_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `DEPLOYMENT_ARCHITECTURE.md`
- `SECURITY_ARCHITECTURE.md`
- `OBSERVABILITY_ARCHITECTURE.md`

---

# 3. Service Overview

## 3.1 Overview

Within the OmniCommerce platform, a **service** represents an independently deployable software component that owns a single business capability.

Each service encapsulates its own business logic, data model, communication contracts, infrastructure integrations, and operational responsibilities.

Services collaborate with one another through well-defined contracts rather than direct implementation dependencies.

A service should be viewed as an autonomous business application rather than merely a collection of controllers or modules.

---

## 3.2 Service Responsibilities

Every service is responsible for managing its own business domain from end to end.

A typical service owns the following responsibilities.

### Business Logic

Implement and enforce all business rules belonging to its domain.

Examples include:

- Product management
- Inventory reservation
- Order processing
- Payment validation

Business logic must never be delegated to another service.

---

### Data Ownership

Each service owns its own persistent data.

Responsibilities include:

- Database schema
- Data migrations
- Data validation
- Data consistency

Direct access from another service is strictly prohibited.

---

### API Contracts

Expose public APIs for external consumers.

Supported transports include:

- REST
- gRPC

Public APIs should remain stable and versioned.

---

### Event Publishing

Publish domain events whenever significant business state changes occur.

Examples:

- ProductCreated
- OrderPlaced
- PaymentSucceeded

Events allow other services to react asynchronously without introducing tight coupling.

---

### Event Consumption

Consume events published by other services when required.

Consumers should never depend on implementation details of event publishers.

---

### Infrastructure Integration

Manage integrations with external infrastructure.

Examples include:

- PostgreSQL
- Redis
- RabbitMQ
- MinIO
- Cloudflare R2
- Elasticsearch
- Third-party APIs

---

### Operational Responsibilities

Every service must expose operational capabilities including:

- Health endpoints
- Metrics
- Structured logs
- Distributed traces

Operational readiness is considered a core responsibility rather than an optional feature.

---

## 3.3 Service Characteristics

Every backend service should exhibit the following characteristics.

| Characteristic | Description |
|----------------|-------------|
| Autonomous | Can operate independently |
| Stateless | Application instances store no session state |
| Independently Deployable | Can be deployed without affecting other services |
| Independently Scalable | Can scale horizontally on demand |
| Fault Isolated | Failures remain isolated whenever possible |
| Observable | Emits logs, metrics, and traces |
| Secure | Authentication and authorization built in |
| Contract-Driven | Communicates through explicit contracts |

---

## 3.4 Service Boundaries

Every service defines its own bounded context.

A bounded context owns:

- Business rules
- Database
- APIs
- Domain events
- Integration contracts

A service must **never** own business rules belonging to another bounded context.

Example:

```text
Catalog Service

✓ Product
✓ Category
✓ Brand
✓ Product Media

✗ Orders
✗ Payments
✗ Inventory Reservation
```

---

## 3.5 Service Communication

Services communicate exclusively through platform-approved mechanisms.

### Synchronous Communication

Used when an immediate response is required.

Protocol:

- gRPC

Examples:

- Inventory validation
- Payment authorization
- Price calculation

---

### Asynchronous Communication

Used for eventual consistency and background processing.

Protocol:

- RabbitMQ

Examples:

- Notification
- Search indexing
- Analytics
- Recommendation updates

---

### Communication Rules

Services must not:

- Access another service's database.
- Invoke internal classes of another service.
- Share repositories.
- Share entities.
- Depend on implementation details.

All interactions must occur through published contracts.

---

## 3.6 Service Lifecycle

Every service follows the same operational lifecycle.

```text
Design
    │
    ▼
Develop
    │
    ▼
Test
    │
    ▼
Build
    │
    ▼
Deploy
    │
    ▼
Monitor
    │
    ▼
Scale
    │
    ▼
Maintain
```

Each stage should be independently executable without affecting other services.

---

# 4. Service Classification

## 4.1 Overview

Not all services serve the same purpose.

To simplify architecture governance, services are classified according to their business responsibilities.

---

## 4.2 Core Business Services

Core services implement the primary business capabilities of the OmniCommerce platform.

Examples include:

- Authentication Service
- User Service
- Catalog Service
- Pricing Service
- Inventory Service
- Order Service
- Payment Service
- Shipping Service

These services directly support customer-facing business processes.

---

## 4.3 Supporting Services

Supporting services enhance the platform but are not directly involved in core business transactions.

Examples include:

- Notification Service
- Search Service
- Recommendation Service
- Analytics Service

These services primarily consume events and provide additional capabilities.

---

## 4.4 Infrastructure Services

Infrastructure services provide technical capabilities shared across the platform.

Examples include:

- RabbitMQ
- Redis
- MinIO
- Elasticsearch
- Prometheus
- Grafana
- Loki
- Tempo

These components are not business services and should not contain business logic.

---

## 4.5 Service Dependency Model

Services should depend only on stable platform contracts.

```text
                API Gateway
                     │
                     ▼
              Business Services
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
   gRPC Calls                 RabbitMQ Events
       ▼                           ▼
 Other Business Services   Supporting Services
                                     │
                                     ▼
                         Infrastructure Components
```

Dependencies should always flow through contracts rather than implementation details.

---

## 4.6 Ownership Model

Each service owns:

- Source code
- Business rules
- Database
- APIs
- Events
- Deployment pipeline
- Monitoring
- Configuration

Ownership must never be shared across multiple services.

---

## 4.7 Service Evolution

A service should evolve independently over time.

Typical evolution includes:

- Feature enhancements
- API versioning
- Database migrations
- Performance optimizations
- Scaling
- Refactoring

Changes within one service should have minimal impact on other services.

---

## 4.8 Summary

A backend service within OmniCommerce is an autonomous business application that owns a single bounded context.

By enforcing strict ownership, independent deployment, contract-driven communication, and standardized responsibilities, every service contributes to a scalable, maintainable, and resilient platform architecture.

---

# 5. Standard Service Blueprint

## 5.1 Overview

Every backend service within the OmniCommerce platform must follow a standardized architectural blueprint.

The blueprint establishes a consistent structure, development approach, and operational model for all services regardless of their business domain.

Whether implementing a Catalog Service, Order Service, Payment Service, or any future service, engineers should encounter the same architectural organization, development patterns, and engineering conventions.

This consistency improves maintainability, reduces onboarding time, simplifies code reviews, and enables teams to move between services with minimal context switching.

The Service Blueprint defines:

- Project organization
- Internal module organization
- Layer responsibilities
- Dependency rules
- Integration boundaries
- Infrastructure adapters
- Development conventions

This blueprint serves as the foundation for every NestJS microservice within the OmniCommerce ecosystem.

---

## 5.2 Design Philosophy

The Service Blueprint is designed around three core architectural philosophies.

### Feature-First Organization

Projects are organized by business capability rather than technical layers.

Each business domain owns all components required to implement its functionality.

Example:

```text
product/
order/
payment/
customer/
```

instead of:

```text
controllers/
services/
repositories/
entities/
```

Organizing by feature improves scalability because all components belonging to the same bounded context remain together.

As the platform grows, new features can be introduced without affecting unrelated business domains.

---

### Clean Architecture

Each feature follows the principles of Clean Architecture.

```text
Presentation
        │
        ▼
Application
        │
        ▼
Domain
        │
        ▼
Infrastructure
```

Each layer has a single responsibility.

Dependencies always point inward.

Business rules remain independent from frameworks, databases, messaging systems, and infrastructure technologies.

---

### Domain-Driven Design

Every feature represents a bounded context.

Each bounded context owns:

- Business logic
- Domain model
- Repository contracts
- Domain events
- Use cases
- Infrastructure adapters

Business concepts should never be distributed across multiple services.

---

## 5.3 Architectural Objectives

The Service Blueprint has been designed to achieve the following objectives.

### Consistency

Every service should share the same architectural organization.

Developers should not need to learn a new project structure when working on another service.

---

### Scalability

The architecture should continue to work as services evolve from a few thousand lines of code to hundreds of thousands.

New business capabilities should be added by introducing new features rather than restructuring existing code.

---

### Maintainability

Business logic should be easy to locate, understand, modify, and test.

Each feature should encapsulate its own responsibilities with minimal dependencies on unrelated modules.

---

### Testability

Every layer should be independently testable.

Business logic should remain isolated from infrastructure concerns, allowing unit tests to execute without databases, message brokers, or external services.

---

### Replaceability

Infrastructure technologies should be replaceable without affecting business logic.

Examples include:

- Replacing PostgreSQL with another relational database.
- Migrating from MinIO to Cloudflare R2.
- Replacing RabbitMQ with another message broker.
- Updating the ORM implementation.

Changes in infrastructure should not require modifications to the Domain layer.

---

## 5.4 Core Architectural Principles

Every service must comply with the following principles.

### Single Business Capability

A service owns one business capability.

A service should never implement unrelated domains.

---

### Autonomous Ownership

Every service owns:

- Source code
- Database
- Business rules
- APIs
- Domain events
- Infrastructure adapters

Ownership is exclusive.

---

### Layer Isolation

Each architectural layer has clearly defined responsibilities.

Business rules must never depend directly on infrastructure implementations.

---

### Explicit Dependencies

All dependencies must be explicit through interfaces or contracts.

Hidden or implicit dependencies are prohibited.

---

### Infrastructure Independence

Infrastructure is considered an implementation detail.

Business logic should remain independent from:

- NestJS
- Prisma
- RabbitMQ
- Redis
- MinIO
- Elasticsearch

The Domain layer should not require knowledge of external technologies.

---

### Contract-Driven Communication

Services communicate only through published contracts.

Supported communication mechanisms include:

- REST APIs
- gRPC
- Domain Events

Direct database access between services is prohibited.

---

## 5.5 Blueprint Overview

Every backend service follows the same high-level architecture.

```text
                    ┌───────────────────────────────┐
                    │        Presentation           │
                    │-------------------------------│
                    │ REST Controllers              │
                    │ gRPC Controllers              │
                    │ Presenters                    │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │        Application            │
                    │-------------------------------│
                    │ Use Cases                     │
                    │ Application Services          │
                    │ DTOs                          │
                    │ Mappers                       │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │           Domain             │
                    │-------------------------------│
                    │ Entities                      │
                    │ Value Objects                 │
                    │ Domain Services               │
                    │ Repository Interfaces         │
                    │ Domain Events                 │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │       Infrastructure          │
                    │-------------------------------│
                    │ Prisma                        │
                    │ Repository Implementations    │
                    │ gRPC Clients                  │
                    │ RabbitMQ                      │
                    │ Redis                         │
                    │ MinIO / Cloudflare R2         │
                    └───────────────────────────────┘
```

The Presentation layer coordinates incoming requests.

The Application layer orchestrates business workflows.

The Domain layer contains enterprise business rules.

The Infrastructure layer integrates external technologies and platform services.

---

## 5.6 Blueprint Compliance

A backend service is considered compliant with the OmniCommerce Service Blueprint if it satisfies all of the following requirements.

- Organizes source code using the Feature-First approach.
- Implements the prescribed four-layer architecture.
- Maintains strict dependency direction toward the Domain layer.
- Owns its business capability and persistent data.
- Exposes communication only through approved contracts.
- Implements standardized observability and security capabilities.
- Remains independently deployable and independently scalable.

Compliance with this blueprint is mandatory for every backend microservice developed within the OmniCommerce platform.

---

# 6. Service Directory Structure

## 6.1 Full Directory Tree

Below is the standard, authoritative directory tree that must be followed by every backend microservice within the OmniCommerce platform.

```text
service-name/
│
├── docs/
│   ├── adr/
│   ├── api/
│   ├── architecture/
│   ├── deployment/
│   ├── diagrams/
│   └── README.md
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   └── README.md
│
├── proto/
│   ├── service.proto
│   ├── common.proto
│   └── health.proto
│
├── scripts/
│   ├── build.sh
│   ├── deploy.sh
│   ├── migrate.sh
│   ├── rollback.sh
│   └── seed.sh
│
├── src/
│   │
│   ├── bootstrap/
│   │   ├── cors.bootstrap.ts
│   │   ├── grpc.bootstrap.ts
│   │   ├── helmet.bootstrap.ts
│   │   ├── logger.bootstrap.ts
│   │   ├── pipes.bootstrap.ts
│   │   ├── swagger.bootstrap.ts
│   │   ├── versioning.bootstrap.ts
│   │   └── index.ts
│   │
│   ├── common/
│   │   │
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── exceptions/
│   │   │   ├── filters/
│   │   │   ├── handlers/
│   │   │   └── index.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── api-key.guard.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── permissions.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── cache.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── response.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/
│   │   ├── pipes/
│   │   ├── serializers/
│   │   ├── transformers/
│   │   ├── validators/
│   │   ├── interfaces/
│   │   ├── types/
│   │   ├── helpers/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── config/
│   │   ├── app/
│   │   ├── auth/
│   │   ├── cache/
│   │   ├── database/
│   │   ├── grpc/
│   │   ├── logger/
│   │   ├── messaging/
│   │   ├── storage/
│   │   ├── swagger/
│   │   ├── throttler/
│   │   ├── validation/
│   │   └── index.ts
│   │
│   ├── shared/
│   │   │
│   │   ├── auth/
│   │   │   ├── jwt/
│   │   │   ├── strategies/
│   │   │   ├── acl/
│   │   │   └── policies/
│   │   │
│   │   ├── cache/
│   │   │   └── redis/
│   │   │
│   │   ├── crypto/
│   │   │
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   └── transaction/
│   │   │
│   │   ├── events/
│   │   │
│   │   ├── grpc/
│   │   │   ├── clients/
│   │   │   └── servers/
│   │   │
│   │   ├── logger/
│   │   │   └── pino/
│   │   │
│   │   ├── mail/
│   │   │
│   │   ├── messaging/
│   │   │   ├── rabbitmq/
│   │   │   └── publishers/
│   │   │
│   │   ├── monitoring/
│   │   │   ├── health/
│   │   │   ├── metrics/
│   │   │   └── tracing/
│   │   │
│   │   ├── pagination/
│   │   ├── scheduler/
│   │   ├── security/
│   │   ├── storage/
│   │   │   ├── minio/
│   │   │   └── r2/
│   │   │
│   │   └── validation/
│   │
│   ├── modules/
│   │   │
│   │   └── [module-name]/
│   │       │
│   │       ├── presentation/
│   │       │   ├── controllers/
│   │       │   ├── grpc/
│   │       │   ├── presenters/
│   │       │   ├── requests/
│   │       │   ├── responses/
│   │       │   └── swagger/
│   │       │
│   │       ├── application/
│   │       │   ├── dto/
│   │       │   ├── interfaces/
│   │       │   ├── mappers/
│   │       │   ├── ports/
│   │       │   ├── services/
│   │       │   └── use-cases/
│   │       │       ├── commands/
│   │       │       └── queries/
│   │       │
│   │       ├── domain/
│   │       │   ├── aggregates/
│   │       │   ├── constants/
│   │       │   ├── entities/
│   │       │   ├── events/
│   │       │   ├── exceptions/
│   │       │   ├── factories/
│   │       │   ├── repositories/
│   │       │   ├── services/
│   │       │   ├── specifications/
│   │       │   └── value-objects/
│   │       │
│   │       ├── infrastructure/
│   │       │   ├── cache/
│   │       │   ├── clients/
│   │       │   │   ├── grpc/
│   │       │   │   ├── http/
│   │       │   │   └── third-party/
│   │       │   │
│   │       │   ├── messaging/
│   │       │   ├── persistence/
│   │       │   │   ├── mappers/
│   │       │   │   ├── prisma/
│   │       │   │   └── repositories/
│   │       │   │
│   │       │   ├── providers/
│   │       │   ├── scheduler/
│   │       │   └── storage/
│   │       │
│   │       └── [module-name].module.ts
│   │
│   ├── health/
│   │   ├── health.controller.ts
│   │   ├── health.module.ts
│   │   ├── liveness.indicator.ts
│   │   ├── readiness.indicator.ts
│   │   └── metrics.controller.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── e2e/
│   ├── integration/
│   ├── unit/
│   ├── fixtures/
│   └── helpers/
│
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

---

## 6.2 Root Configuration Files

Every backend service contains standardized configuration files at the root directory to guarantee build, linting, formatting, and runtime consistency across environments.

| File Name | Purpose & Description |
|-----------|-----------------------|
| `.env` | Local development environment configuration containing secret keys, database credentials, and service URLs (git-ignored). |
| `.env.example` | Template file documenting all required environment variables with non-sensitive defaults or dummy values. |
| `.gitignore` | Defines files and folders excluded from version control (node_modules, dist, coverage, .env). |
| `.prettierrc` | Formatting configurations ensuring consistent code style across all team members. |
| `eslint.config.mjs` | Modern ESLint configuration file enforcing static analysis, import rules, and TypeScript coding conventions. |
| `nest-cli.json` | NestJS CLI configuration defining source root, compiler options, and asset inclusions. |
| `package.json` | Project metadata, scripts (build, start, test, lint), and dependencies management. |
| `pnpm-lock.yaml` | Lockfile ensuring deterministic, reproducible dependency installations via pnpm. |
| `README.md` | Service documentation containing setup instructions, architecture overview, API links, and run commands. |
| `tsconfig.json` | TypeScript compiler configuration including strict type-checking flags, path aliases (`@common/*`, `@shared/*`), and target specs. |

---

## 6.3 Top-Level Non-Source Directories

### `docs/`
Contains technical documentation specific to the microservice.
- `adr/`: Architecture Decision Records documenting key design decisions.
- `api/`: OpenAPI / Swagger specs, gRPC protocol definitions, and Postman collections.
- `architecture/`: High-level diagrams, layer breakdowns, and data flow specifications.
- `deployment/`: Helm charts, Docker compose files, Kubernetes manifests, and CI/CD pipelines.
- `diagrams/`: Source files for Mermaid, PlantUML, or Draw.io diagrams.
- `README.md`: Index of documentation available for this service.

### `prisma/`
Manages object-relational mapping (ORM) schema and database migrations for PostgreSQL.
- `migrations/`: Sequential SQL migration files generated by Prisma.
- `schema.prisma`: Authoritative database schema definition including models, relations, indexes, and enums.
- `seed.ts`: Script for populating the database with initial reference data or test data.
- `README.md`: Guide for running Prisma commands and managing database schema updates.

### `proto/`
Holds Protocol Buffers definitions for high-performance inter-service gRPC communication.
- `service.proto`: gRPC service interface definitions (methods, request/response messages).
- `common.proto`: Shared protobuf types (pagination, error payloads, timestamps).
- `health.proto`: Standard gRPC Health Checking Protocol buffer contract.

### `scripts/`
Executable shell scripts for automating development and operational workflows.
- `build.sh`: Builds the TypeScript code and compiles protobuf definitions.
- `deploy.sh`: Builds container images and triggers deployment to Kubernetes.
- `migrate.sh`: Executes pending Prisma database migrations.
- `rollback.sh`: Rolls back database migrations or deployment releases in emergency scenarios.
- `seed.sh`: Runs the database seed script cleanly across environments.

### `test/`
Structured test suites isolating unit, integration, and end-to-end testing concerns.
- `e2e/`: End-to-end tests validating full HTTP/gRPC endpoints with running databases.
- `integration/`: Tests verifying interactions between services, repositories, and external adapters.
- `unit/`: Unit tests targeting domain logic, aggregates, use cases, and utility functions.
- `fixtures/`: Static test data, mock database entities, and sample payloads.
- `helpers/`: Utilities for seeding test DBs, generating JWT tokens, and managing test servers.

---

# 7. Source Code Structure (`src/`)

Source code inside `src/` is strictly structured to support bootstrap initializations, cross-cutting framework concerns, shared platform capabilities, health telemetry, and feature-first business modules.

---

## 7.1 Bootstrap Directory (`src/bootstrap/`)

The `bootstrap/` directory contains modular initializers responsible for configuring framework capabilities during service startup in `main.ts`.

| File | Purpose |
|------|---------|
| `cors.bootstrap.ts` | Configures Cross-Origin Resource Sharing (CORS) rules, allowed origins, headers, and credentials. |
| `grpc.bootstrap.ts` | Configures gRPC microservice transport options, proto paths, and package names. |
| `helmet.bootstrap.ts` | Applies security HTTP headers using Helmet middleware. |
| `logger.bootstrap.ts` | Initializes Pino structured logger with custom formatters and log levels. |
| `pipes.bootstrap.ts` | Registers global validation pipes with custom class-validator options. |
| `swagger.bootstrap.ts` | Configures OpenAPI / Swagger documentation endpoints and authorization schemes. |
| `versioning.bootstrap.ts` | Enables API URI/Header versioning standards (e.g., `/api/v1/...`). |
| `index.ts` | Barrel export aggregating all bootstrap functions for single-line execution in `main.ts`. |

---

## 7.2 Common Directory (`src/common/`)

The `common/` directory provides framework-level utilities, cross-cutting components, generic DTOs, and global filters/interceptors applicable across all modules.

- `constants/`: Global system constants, error codes, and string tokens.
- `decorators/`: Custom NestJS parameter/method decorators (e.g., `@CurrentUser()`, `@Public()`, `@Permissions()`).
- `dto/`: Common request/response Data Transfer Objects (e.g., `PaginationQueryDto`, `ApiResponseDto`).
- `enums/`: System-wide enums (e.g., `Environment`, `SortOrder`, `UserRole`).
- `exceptions/`:
  - `filters/`: Global exception filters converting domain/HTTP/gRPC exceptions into standard error payloads.
  - `handlers/`: Specialty error handlers mapping custom exceptions to status codes.
  - `index.ts`: Barrel export.
- `guards/`:
  - `api-key.guard.ts`: Guard enforcing API key verification for external webhooks/clients.
  - `jwt-auth.guard.ts`: Guard validating JWT access tokens on protected routes.
  - `permissions.guard.ts`: Guard enforcing fine-grained Permission-Based Access Control (PBAC).
  - `roles.guard.ts`: Guard enforcing Role-Based Access Control (RBAC).
  - `index.ts`: Barrel export.
- `interceptors/`:
  - `cache.interceptor.ts`: Caching interceptor for response memoization.
  - `logging.interceptor.ts`: Access log interceptor logging request duration, status code, and trace ID.
  - `response.interceptor.ts`: Interceptor wrapping HTTP responses in standard JSON wrappers.
  - `timeout.interceptor.ts`: Interceptor setting strict request timeouts.
  - `transform.interceptor.ts`: Interceptor transforming entity data models to response serializers.
  - `index.ts`: Barrel export.
- `middleware/`: HTTP middleware functions (request ID generation, raw body parsing).
- `pipes/`: Generic NestJS validation and transformation pipes.
- `serializers/`: Base entity serialization classes.
- `transformers/`: Value transformers (string trimming, date parsing).
- `validators/`: Custom class-validator constraint decorators.
- `interfaces/`: Core TypeScript interfaces for requests, responses, and execution contexts.
- `types/`: Common TypeScript utility types and type aliases.
- `helpers/` & `utils/`: Generic helper functions (crypto hashing, date formatting, string manipulation).
- `index.ts`: Public API export for the common module.

---

## 7.3 Configuration Directory (`src/config/`)

Centralized, strongly typed configuration modules powered by `@nestjs/config` and validated with `class-validator` / `zod`.

| Subfolder | Description |
|-----------|-------------|
| `app/` | General application settings (name, port, environment, debug mode). |
| `auth/` | JWT secrets, token expiration times, and OAuth provider credentials. |
| `cache/` | Redis host, port, password, TTL, and key prefix configurations. |
| `database/` | Database URL, connection pool sizes, SSL settings, and migration flags. |
| `grpc/` | gRPC server host, port, protobuf load options, and client target URLs. |
| `logger/` | Pino logging level, pretty-print flag, and redaction keys. |
| `messaging/` | RabbitMQ connection strings, exchange names, and dead-letter queues. |
| `storage/` | MinIO / Cloudflare R2 bucket names, endpoints, access keys, and region. |
| `swagger/` | Swagger documentation title, description, path, and security schemes. |
| `throttler/` | Rate limiting TTL and limit caps. |
| `validation/` | Configuration validation schema and options. |
| `index.ts` | Export aggregating all configuration namespaces. |

---

## 7.4 Shared Infrastructure Directory (`src/shared/`)

The `shared/` directory contains reusable platform services, infrastructure adapters, and client libraries that are technical in nature and shared across business modules.

- `auth/`: Shared authentication mechanics (`jwt/`, `strategies/` [JwtStrategy, LocalStrategy], `acl/`, `policies/`).
- `cache/`: Caching infrastructure (`redis/` service wrapper and cluster client).
- `crypto/`: Hashing, encryption, and decryption utilities (bcrypt, argon2, AES-GCM).
- `database/`: Database client setup (`prisma/` PrismaService, connection management, `transaction/` unit-of-work helpers).
- `events/`: Event bus abstractions and local event emitter bridge.
- `grpc/`: gRPC transport setup (`clients/` gRPC client factories, `servers/` gRPC server setup).
- `logger/`: Pino logger module registration and transport streams.
- `mail/`: Email delivery providers (SMTP, SendGrid, SES).
- `messaging/`: Broker integration (`rabbitmq/` ClientProxy / AmqpConnection, `publishers/` Outbox / Domain event publishers).
- `monitoring/`: Telemetry infrastructure (`health/` checks, `metrics/` Prometheus counters/histograms, `tracing/` OpenTelemetry tracer).
- `pagination/`: Standardized pagination calculation, metadata generators, and cursor handlers.
- `scheduler/`: Cron job scheduling wrappers and distributed lock handling.
- `security/`: Encryption, SAN validation, CSRF, and CORS helpers.
- `storage/`: Object storage adapters (`minio/` client, `r2/` Cloudflare R2 client).
- `validation/`: Cross-cutting validation wrappers and schema definitions.

---

## 7.5 Health & Metrics Directory (`src/health/`)

Implements operational health checking and Prometheus metrics scraping endpoints.

- `health.controller.ts`: Endpoint `/health` responding with service status.
- `health.module.ts`: Terminus health module registration.
- `liveness.indicator.ts`: Liveness check indicator (verifying process status).
- `readiness.indicator.ts`: Readiness check indicator (verifying PostgreSQL, Redis, RabbitMQ connectivity).
- `metrics.controller.ts`: Endpoint `/metrics` exposing Prometheus telemetry data.

---

## 7.6 Root Files (`src/app.module.ts` & `src/main.ts`)

- `app.module.ts`: The root module of the NestJS application. It imports core configuration modules, shared infrastructure modules, health module, and all business feature modules.
- `main.ts`: Application entry point. Executes bootstrap initializers (`src/bootstrap/`), starts HTTP and gRPC listeners, registers global interceptors/filters, and manages graceful shutdown signals (SIGTERM/SIGINT).

---

# 8. Feature Module Architecture (`src/modules/[module-name]/`)

Every business capability inside `src/modules/` is structured as an isolated bounded context following **Clean Architecture** and **Domain-Driven Design (DDD)**.

Taking `order` as the standard reference module (`src/modules/order/`), each module is divided into four distinct architectural layers.

```text
src/modules/order/
├── presentation/
├── application/
├── domain/
├── infrastructure/
└── order.module.ts
```

---

## 8.1 Presentation Layer (`presentation/`)

The Presentation layer acts as the entry point for external requests. It converts incoming payloads into application command/query DTOs and formats application outputs for clients.

```text
presentation/
├── controllers/       # REST API Controllers (@Controller, @Get, @Post)
├── grpc/              # gRPC Controller / Handlers (@GrpcMethod)
├── presenters/        # Data formatters translating domain/application responses for UI
├── requests/          # HTTP Request DTOs with class-validator annotations
├── responses/         # HTTP Response DTOs / Serializers
└── swagger/           # Swagger API documentation decorators & response schemas
```

**Rules for Presentation Layer:**
- Coordinates request parsing, authentication/authorization guard execution, and response formatting.
- Must NOT contain any business logic or direct database access.
- Delegates all business operations directly to Application Use Cases or Application Services.

---

## 8.2 Application Layer (`application/`)

The Application layer orchestrates business use cases, manages workflow execution, controls transaction boundaries, and coordinates port implementations.

```text
application/
├── dto/               # Internal use case input/output data transfer objects
├── interfaces/        # Interfaces for application-level services & handlers
├── mappers/           # Data mappers converting presentation DTOs <-> Use Case DTOs
├── ports/             # Secondary/Outbound interfaces (e.g., PaymentPort, NotificationPort)
├── services/          # Application services orchestrating multi-step workflows
└── use-cases/         # CQRS Use Case Handlers
    ├── commands/      # Write operations (e.g., CreateOrderCommand, CancelOrderCommand)
    └── queries/       # Read operations (e.g., GetOrderByIdQuery, ListOrdersQuery)
```

**Rules for Application Layer:**
- Contains use case logic, CQRS commands/queries, and port contracts.
- Depends ONLY on the Domain Layer.
- Must NOT depend on concrete infrastructure components (Prisma, RabbitMQ, Redis). All infrastructure dependencies are referenced via Port interfaces.

---

## 8.3 Domain Layer (`domain/`)

The Domain layer is the heart of the application. It encapsulates core business logic, domain models, business rules, invariants, and domain events.

```text
domain/
├── aggregates/        # DDD Aggregate Roots managing boundary consistency (e.g., OrderAggregate)
├── constants/         # Business constants and domain-specific codes
├── entities/          # Domain Entities with unique identifiers and lifecycle logic
├── events/            # Domain Events emitted on state change (e.g., OrderCreatedEvent)
├── exceptions/        # Pure domain exceptions (e.g., InsufficientStockException)
├── factories/         # Domain object creation factories for complex initializations
├── repositories/      # Domain Repository Interfaces defining persistence contracts
├── services/          # Domain Services for operations involving multiple entities
├── specifications/    # Specification pattern classes for complex business validation
└── value-objects/     # Immutable Value Objects (e.g., Money, OrderStatus, Address)
```

**Rules for Domain Layer:**
- Pure TypeScript without any external framework or infrastructure dependencies (No NestJS, No Prisma, No TypeORM).
- Enforces all business rules and domain invariants.
- Dependencies ALWAYS point inward. The Domain layer has zero outer dependencies.

---

## 8.4 Infrastructure Layer (`infrastructure/`)

The Infrastructure layer implements the outbound ports and repository interfaces defined by the Domain and Application layers. It bridges domain logic to databases, external services, caches, and message queues.

```text
infrastructure/
├── cache/             # Redis cache adapters & store implementations
├── clients/           # External client integrations
│   ├── grpc/          # gRPC clients communicating with other microservices
│   ├── http/          # HTTP REST clients (Axios/Fetch) calling external APIs
│   └── third-party/   # Third-party SDK integrations (Stripe, PayPal, SendGrid)
├── messaging/         # RabbitMQ publishers, consumer handlers, and message schemas
├── persistence/       # Relational database persistence (Prisma)
│   ├── mappers/       # Mappers transforming Prisma DB models <-> Domain Entities
│   ├── prisma/        # Prisma service injection & entity extensions
│   └── repositories/  # Repository implementations (e.g., PrismaOrderRepository)
├── providers/         # Custom NestJS provider bindings linking ports to implementations
├── scheduler/         # Cron job implementations and background task handlers
└── storage/           # S3 / MinIO / R2 file storage implementations
```

**Rules for Infrastructure Layer:**
- Implements interfaces defined in `domain/repositories/` and `application/ports/`.
- Handles data mapping between database records and domain entities.
- Isolates all technical complexities from core business logic.

---

## 8.5 Feature Module Root (`[module-name].module.ts`)

The module root file (e.g., `order.module.ts`) ties all four layers together using NestJS dependency injection mechanisms.

```typescript
@Module({
  imports: [SharedModule, ConfigModule],
  controllers: [OrderController, OrderGrpcController],
  providers: [
    // Use Cases
    CreateOrderUseCase,
    GetOrderQueryHandler,
    // Repository Providers (Mapping Domain Interface -> Infrastructure Concrete)
    {
      provide: ORDER_REPOSITORY_TOKEN,
      useClass: PrismaOrderRepository,
    },
    // Port Providers
    {
      provide: PAYMENT_PORT_TOKEN,
      useClass: StripePaymentAdapter,
    },
  ],
  exports: [ORDER_REPOSITORY_TOKEN],
})
export class OrderModule {}
```

---

# Part 3 — Architectural Governance & Guidelines

---

# 9. Cross-Cutting Concerns & Execution Flow

## 9.1 Request Execution Lifecycle

Every incoming request passes through a standardized execution lifecycle managed by NestJS and the service architecture layers:

```text
Client Request
     │
     ▼
[Helmet & CORS Middleware]
     │
     ▼
[Logging Interceptor (Start)]
     │
     ▼
[JWT / API Key Guard] ──── Fail ───► [401 / 403 Response Filter]
     │
     ▼
[Permissions / Roles Guard]
     │
     ▼
[Global Validation Pipe] ──── Fail ───► [400 Bad Request Filter]
     │
     ▼
[Presentation Controller]
     │
     ▼
[Application Use Case / Command Handler]
     │
     ▼
[Domain Aggregate / Domain Service]
     │
     ▼
[Infrastructure Repository (Prisma)] ◄─── Transaction Boundary
     │
     ▼
[Domain Event Publisher (RabbitMQ)]
     │
     ▼
[Response Interceptor (Format Output)]
     │
     ▼
Client Response
```

---

## 9.2 Strict Layering Rules & Dependency Constraints

To maintain architectural integrity and prevent codebase rot, all developers and automated tools MUST respect the following dependency rules:

1. **Domain Layer Independence**: The Domain layer MUST NOT import anything from `presentation`, `application`, `infrastructure`, or framework packages like `@nestjs/*` or `@prisma/client`.
2. **Application Layer Dependencies**: The Application layer can import from `domain`, but MUST NOT import from `presentation` or concrete `infrastructure` repositories/clients.
3. **Presentation Layer Dependencies**: The Presentation layer can import from `application` (DTOs, Use Cases) and `common`, but MUST NOT interact with the database directly.
4. **Infrastructure Layer Integration**: The Infrastructure layer implements interfaces from `domain` and `application`. It can import `@prisma/client`, Redis, RabbitMQ, and external SDKs.
5. **No Cross-Module Domain Leaks**: A feature module MUST NOT directly import internal classes from another feature module. Cross-module interactions occur strictly via published gRPC contracts, domain events, or public application ports.

---

# 10. Summary & Checklist for New Services

When creating a new backend microservice in OmniCommerce, ensure compliance with this checklist:

- [ ] Directory structure strictly matches the blueprint tree defined in **Section 6.1**.
- [ ] Root configuration files (`tsconfig.json`, `.prettierrc`, `eslint.config.mjs`, `nest-cli.json`) are copied and configured.
- [ ] `prisma/schema.prisma` is initialized with service-specific models.
- [ ] `proto/` contains the service gRPC contracts.
- [ ] `src/bootstrap/` contains all framework initializers.
- [ ] `src/health/` exposes `/health` and `/metrics`.
- [ ] Business logic inside `src/modules/` follows the 4-layer DDD pattern (Presentation, Application, Domain, Infrastructure).
- [ ] Domain Entities have zero dependencies on NestJS or Prisma.
- [ ] Unit tests cover domain logic in `test/unit/` and integration tests cover repositories in `test/integration/`.


