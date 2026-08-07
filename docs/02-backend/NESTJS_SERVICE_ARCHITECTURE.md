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

The project structure is organized around **business features (bounded contexts)** inside `src/modules/`.

Example:

```text
src/modules/
└── <module-name>/  (e.g., order/, payment/, inventory/)
```

This organization improves scalability and domain ownership.

---

### Layered Module Architecture

Each feature module encapsulates its own components.

```text
controllers/
dto/
entities/
repositories/
services/
validators/
mappers/
interfaces/
types/
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
src/modules/
└── <module-name>/  (e.g., product/, order/, payment/)
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
                    │          Controllers          │
                    │-------------------------------│
                    │ RPC Controller                │
                    │ Event Controller              │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     Services & DTOs           │
                    │-------------------------------│
                    │ Business Services             │
                    │ Requests, Responses, Events DTO│
                    │ Validators & Mappers          │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     Repositories & Entities   │
                    │-------------------------------│
                    │ Domain Entities               │
                    │ Module Repositories           │
                    │ Shared Services (Prisma, Redis│
                    │ Logger, Health, Validation)   │
                    └───────────────────────────────┘
```

The Controllers layer handles incoming gRPC calls and RabbitMQ events.

The Services and DTOs layer orchestrates business workflows, payload validation, and object mapping.

The Repositories and Entities layer manages domain models and persistence interactions via shared platform adapters (Prisma, Redis, etc.).

---

## 5.6 Blueprint Compliance

A backend service is considered compliant with the OmniCommerce Service Blueprint if it satisfies all of the following requirements.

- Organizes source code using the Feature-First approach under `src/modules/`.
- Implements standard module components (`controllers/`, `dto/`, `entities/`, `repositories/`, `services/`, `validators/`, `mappers/`, `interfaces/`, `types/`).
- Shared capabilities (`prisma`, `logger`, `redis`, `validation`, `health`) reside in `src/shared/`.
- Centralized configuration resides in `src/config/`.
- Owns its business capability and persistent data exclusively.
- Exposes communication only through approved contracts (gRPC & RabbitMQ events).
- Implements standardized observability, health endpoints, and security capabilities.
- Remains independently deployable and independently scalable.

Compliance with this blueprint is mandatory for every backend microservice developed within the OmniCommerce platform.

---

# 6. Service Directory Structure

## 6.1 Full Directory Tree

Below is the standard, authoritative directory tree that must be followed by every backend microservice within the OmniCommerce platform.

```text
<service-name>-service/
│
├── src/
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── rabbitmq.config.ts
│   │   ├── redis.config.ts
│   │   ├── validation.config.ts
│   │   └── index.ts
│   │
│   ├── common/
│   │   │
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   │   ├── rpc-exception.filter.ts
│   │   │   └── all-exception.filter.ts
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   ├── interfaces/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── shared/
│   │   ├── prisma/
│   │   ├── logger/
│   │   ├── redis/
│   │   ├── validation/
│   │   └── health/
│   │
│   ├── modules/
│   │   │
│   │   └── <module-name>/
│   │       │
│   │       ├── controllers/
│   │       │   ├── <module-name>.rpc.controller.ts
│   │       │   └── <module-name>.event.controller.ts
│   │       │
│   │       ├── dto/
│   │       │   ├── requests/
│   │       │   ├── responses/
│   │       │   └── events/
│   │       │
│   │       ├── entities/
│   │       ├── repositories/
│   │       ├── services/
│   │       ├── validators/
│   │       ├── mappers/
│   │       ├── interfaces/
│   │       ├── types/
│   │       └── <module-name>.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── test/
├── .env
└── package.json
```

---

## 6.2 Root Configuration Files & Directories

Every backend service contains standardized configuration files and top-level directories to guarantee build, linting, formatting, testing, and database schema management.

| Item Name | Type | Purpose & Description |
|-----------|------|-----------------------|
| `src/` | Folder | Main application source code. |
| `prisma/` | Folder | PostgreSQL database schema (`schema.prisma`) and SQL migration scripts (`migrations/`). |
| `test/` | Folder | End-to-end (E2E), integration, and unit test suites. |
| `.env` | File | Local environment settings containing database credentials, secret keys, and port numbers (git-ignored). |
| `package.json` | File | NPM project manifest, script tasks, and dependency definitions. |

---

# 7. Source Code Structure (`src/`)

Source code inside `src/` is organized into `config/`, `common/`, `shared/`, `modules/`, and root files.

---

## 7.1 Configuration Directory (`src/config/`)

Centralized configuration functions returning strongly-typed configuration objects.

| File | Purpose |
|------|---------|
| `app.config.ts` | Application parameters (port, environment, app name). |
| `database.config.ts` | Database connection options, pool limits, and migration settings. |
| `rabbitmq.config.ts` | RabbitMQ connection URL, exchange names, queues, and RPC settings. |
| `redis.config.ts` | Redis host, port, credentials, TTLs, and cache prefixes. |
| `validation.config.ts` | Configuration options for global ValidationPipes. |
| `index.ts` | Barrel file exporting all configuration modules. |

---

## 7.2 Common Directory (`src/common/`)

Framework-wide cross-cutting components and shared utilities.

- `constants/`: Global system constants and tokens.
- `decorators/`: Custom NestJS decorators (`@CurrentUser()`, `@Public()`).
- `dto/`: Common generic DTOs (pagination, error responses).
- `enums/`: System-wide enums (`Environment`, `UserRole`).
- `exceptions/`: Domain and system custom exceptions.
- `filters/`:
  - `rpc-exception.filter.ts`: Exception filter formatting RPC / gRPC exceptions.
  - `all-exception.filter.ts`: Fallback exception filter for unhandled errors.
- `guards/`: Security and authorization guards.
- `interceptors/`: Logging, caching, response-transforming, and timeout interceptors.
- `middleware/`: HTTP middleware functions.
- `pipes/`: Request validation pipes.
- `interfaces/` & `types/`: Common TypeScript interfaces and utility types.
- `utils/`: Helper utilities (date, crypto, formatting).

---

## 7.3 Shared Directory (`src/shared/`)

Platform infrastructure wrappers and operational services reusable across feature modules.

- `prisma/`: Prisma database client module and transactions.
- `logger/`: Pino structured logging module.
- `redis/`: Redis client wrapper for caching and locking.
- `validation/`: Cross-cutting validation services.
- `health/`: Health check indicators for DB, Redis, and RabbitMQ connectivity.

---

## 7.4 Root Files (`src/app.module.ts` & `src/main.ts`)

- `app.module.ts`: Root module importing `ConfigModule`, `SharedModule` (Prisma, Logger, Redis, Validation, Health), and feature modules (`OrderModule`, etc.).
- `main.ts`: Service entry point. Initializes gRPC microservice listeners, RabbitMQ event consumers, global pipes, filters, and interceptors.

---

# 8. Feature Module Architecture (`src/modules/[module-name]/`)

Every business capability inside `src/modules/` is structured as a feature module (e.g. `order`, `payment`, `inventory`).

```text
src/modules/<module-name>/
│
├── controllers/
│   ├── <module-name>.rpc.controller.ts
│   └── <module-name>.event.controller.ts
│
├── dto/
│   ├── requests/
│   ├── responses/
│   └── events/
│
├── entities/
├── repositories/
├── services/
├── validators/
├── mappers/
├── interfaces/
├── types/
└── <module-name>.module.ts
```

---

## 8.1 Controllers (`controllers/`)

Exposes transport interfaces for inter-service communication.

- `<module-name>.rpc.controller.ts`: Handles synchronous RPC / gRPC endpoints using `@GrpcMethod`.
- `<module-name>.event.controller.ts`: Handles asynchronous RabbitMQ event subscriptions using `@EventPattern` / `@MessagePattern`.

---

## 8.2 DTOs (`dto/`)

Data Transfer Objects defining transport and message schemas:

- `requests/`: Incoming RPC request payload schemas.
- `responses/`: Outgoing RPC response schemas.
- `events/`: Domain event payload schemas (published and consumed).

---

## 8.3 Entities (`entities/`)

Entities representing business data structures and domain rules.

---

## 8.4 Repositories (`repositories/`)

Data access layer encapsulating database queries and Prisma operations for the module.

---

## 8.5 Services (`services/`)

Business services encapsulating business logic, domain workflows, and database transaction orchestration.

---

## 8.6 Validators (`validators/`)

Custom domain validation rules and entity state checks.

---

## 8.7 Mappers (`mappers/`)

Object mappers converting between database records, entities, and DTOs.

---

## 8.8 Interfaces & Types (`interfaces/` & `types/`)

- `interfaces/`: Contracts for services and repositories.
- `types/`: Utility types used within the module.

---

## 8.9 Module Declaration (`<module-name>.module.ts`)

Wires together controllers, services, repositories, validators, and mappers into a NestJS module.

---

# Part 3 — Architectural Governance & Guidelines

---

# 9. Cross-Cutting Concerns & Execution Flow

## 9.1 Request Execution Lifecycle

```text
Incoming RPC Call / Event Message
     │
     ▼
[Logging Interceptor]
     │
     ▼
[Guards] ───────────── Fail ───► [RPC Exception Filter]
     │
     ▼
[Validation Pipe] ───── Fail ───► [RPC Exception Filter]
     │
     ▼
[RPC / Event Controller]
     │
     ▼
[Module Service]
     │
     ▼
[Validators & Mappers]
     │
     ▼
[Repository (Prisma)] ◄─── Database Transaction
     │
     ▼
[Event Publisher (RabbitMQ)]
     │
     ▼
RPC Response / Message Ack
```

---

## 9.2 Dependency & Layering Rules

1. **Feature Module Structure**: Each feature module inside `src/modules/` encapsulates its own business domain components (`controllers`, `dto`, `entities`, `repositories`, `services`, `validators`, `mappers`, `interfaces`, `types`).
2. **Shared Services**: Reusable infrastructure (`prisma`, `logger`, `redis`, `validation`, `health`) must be imported from `@shared/*`.
3. **Common Utilities**: Global guards, filters, interceptors, and helpers must be imported from `@common/*`.
4. **Configuration Access**: Access environment and service configurations via `src/config/`.
5. **Decoupled Interactions**: Cross-service interaction must occur via gRPC or RabbitMQ domain events.

---

# 10. Summary & Checklist for New Services

When creating or maintaining a backend microservice in OmniCommerce:

- [ ] Folder structure matches the standard blueprint tree in **Section 6.1**.
- [ ] Configurations exist in `src/config/` (`app.config.ts`, `database.config.ts`, `rabbitmq.config.ts`, `redis.config.ts`, `validation.config.ts`, `index.ts`).
- [ ] Global exception filters (`rpc-exception.filter.ts`, `all-exception.filter.ts`), guards, and interceptors reside in `src/common/`.
- [ ] Infrastructure services (`prisma`, `logger`, `redis`, `validation`, `health`) reside in `src/shared/`.
- [ ] Feature modules in `src/modules/` implement `controllers/`, `dto/`, `entities/`, `repositories/`, `services/`, `validators/`, `mappers/`, `interfaces/`, `types/`, and `<module-name>.module.ts`.
- [ ] Controllers implement `<module-name>.rpc.controller.ts` and `<module-name>.event.controller.ts`.
- [ ] Prisma schema and migrations reside in `prisma/`.