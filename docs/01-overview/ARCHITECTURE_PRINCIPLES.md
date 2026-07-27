# OmniCommerce Architecture Principles

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Software Architecture Principles & Guidelines  
> **Last Updated:** July 2026  
> **Owner:** Architecture Team  

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Document Type | Architecture Principles & Engineering Standards |
| Scope | Platform-Wide (Web, Mobile, BFF, API Gateway, Microservices, Data, Infrastructure) |
| Related Documents | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md), [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md), [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) |

---

# Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Intended Audience](#13-intended-audience)
  - [1.4 Principle Hierarchy](#14-principle-hierarchy)
- [2. Core Architectural Philosophy](#2-core-architectural-philosophy)
- [3. Architectural Principles](#3-architectural-principles)
  - [3.1 Domain-Oriented Design (Domain Boundaries)](#31-domain-oriented-design-domain-boundaries)
  - [3.2 Separation of Concerns](#32-separation-of-concerns)
  - [3.3 Loose Coupling & High Cohesion](#33-loose-coupling--high-cohesion)
  - [3.4 API-First Development & Contract-Driven Design](#34-api-first-development--contract-driven-design)
  - [3.5 Event-Driven & Asynchronous Communication](#35-event-driven--asynchronous-communication)
  - [3.6 Backend for Frontend (BFF) Pattern](#36-backend-for-frontend-bff-pattern)
  - [3.7 Microfrontend Architecture](#37-microfrontend-architecture)
  - [3.8 Database per Service & Data Isolation](#38-database-per-service--data-isolation)
  - [3.9 Single Source of Truth & Derived Data Isolation](#39-single-source-of-truth--derived-data-isolation)
  - [3.10 Independent Deployability & Immutable Artifacts](#310-independent-deployability--immutable-artifacts)
  - [3.11 Shared Engineering Standards & Type Safety](#311-shared-engineering-standards--type-safety)
  - [3.12 Security by Design & Zero Trust](#312-security-by-design--zero-trust)
  - [3.13 Observability First](#313-observability-first)
  - [3.14 Resiliency, Failure Isolation & Graceful Degradation](#314-resiliency-failure-isolation--graceful-degradation)
  - [3.15 Open Source First & Technology Selection Governance](#315-open-source-first--technology-selection-governance)
- [4. Prohibited Architectural Anti-Patterns](#4-prohibited-architectural-anti-patterns)
- [5. Architecture Governance & Compliance](#5-architecture-governance--compliance)
  - [5.1 Architecture Decision Records (ADR)](#51-architecture-decision-records-adr)
  - [5.2 Architecture Review Gate](#52-architecture-review-gate)
  - [5.3 CI/CD & Automated Enforcement](#53-cicd--automated-enforcement)
- [6. References](#6-references)

---

# 1. Introduction

## 1.1 Purpose

This document defines the core architecture principles and engineering guidelines for the **OmniCommerce** platform.

These principles serve as the authoritative baseline for all technical decisions, system design choices, code implementations, code reviews, and infrastructure configurations across the organization.

By establishing technology-independent and platform-wide principles, OmniCommerce ensures long-term system maintainability, high scalability, operational stability, and developer consistency as the platform expands.

---

## 1.2 Scope

This document applies to all software artifacts, repositories, services, client applications, and infrastructure configurations within the OmniCommerce ecosystem, including:

- **Client Layer:** Customer Web, Admin Portal, Seller Portal, Flutter Mobile.
- **Presentation Layer:** Shell Application, Microfrontends (Module Federation).
- **Backend & Orchestration:** Backend for Frontend (BFF) services, API Gateway.
- **Business Layer:** Microservices (NestJS domain services).
- **Data & Messaging:** PostgreSQL databases, Redis cache, Elasticsearch, RabbitMQ message broker, Object Storage (MinIO / Cloudflare R2).
- **Infrastructure & Observability:** Docker containers, Nginx reverse proxy, Cloudflare CDN/Edge, Prometheus, Grafana, Loki, Tempo, GitHub Actions CI/CD pipelines.

---

## 1.3 Intended Audience

This document is intended for:

- **Software Architects & Technical Leads:** For guiding system design, conducting architecture reviews, and maintaining system integrity.
- **Backend Engineers:** For building domain services, designing DTOs, implementing business logic, and configuring persistence/messaging.
- **Frontend Engineers:** For developing modular Microfrontends, consuming BFF APIs, and managing presentation components.
- **Mobile Engineers (Flutter):** For developing native mobile applications following client integration standards.
- **DevOps & Site Reliability Engineers:** For managing infrastructure, deployments, containerization, and monitoring stacks.
- **QA Engineers:** For designing end-to-end, performance, and contract integration tests aligned with system boundaries.

---

## 1.4 Principle Hierarchy

Architectural decisions must follow a strict priority model when resolving technical trade-offs:

```text
1. Security & Data Integrity
       ↓
2. Scalability & System Availability
       ↓
3. Maintainability & Modularity
       ↓
4. Developer Experience & Velocity
       ↓
5. Transient Implementation Speed
```

*Note: Short-term implementation speed must never compromise security, data integrity, or core architectural boundaries.*

---

# 2. Core Architectural Philosophy

OmniCommerce is built upon a cloud-native, domain-driven, distributed enterprise architecture. Rather than relying on a traditional monolithic codebase or tightly coupled services, OmniCommerce enforces loose coupling, high cohesion, and strict layer isolation across all components.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Client Layer                                    │
│   [ Customer Web ]     [ Admin Portal ]     [ Seller Portal ]   [ Flutter ] │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────────────────────────────────────┐
│                    Presentation Layer (Microfrontends)                      │
│   [ Shell Host App ] <─── Module Federation ───> [ Remote MFEs ]            │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │ REST APIs
┌───────────────────────▼─────────────────────────────────────────────────────┐
│                    Backend for Frontend (BFF) Layer                         │
│   [ Customer BFF ]            [ Admin BFF ]            [ Seller BFF ]       │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │ REST
┌───────────────────────▼─────────────────────────────────────────────────────┐
│                           API Gateway Layer                                 │
│   [ Central Request Routing, JWT Auth, Rate Limiting, Correlation ID ]      │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │ Internal REST / gRPC
┌───────────────────────▼─────────────────────────────────────────────────────┐
│                      Business Layer (Microservices)                         │
│  [ Auth ]  [ User ]  [ Catalog ]  [ Inventory ]  [ Cart ]  [ Order ]  ...   │
└───────────┬───────────────────────────────────────────────┬─────────────────┘
            │ SQL / Cache / Search                          │ AMQP Events
┌───────────▼──────────────────────────┐        ┌───────────▼─────────────────┐
│     Data & Persistence Layer         │        │       Messaging Layer       │
│ [PostgreSQL] [Redis] [Elasticsearch] │        │          [RabbitMQ]         │
└──────────────────────────────────────┘        └─────────────────────────────┘
```

The fundamental philosophy of OmniCommerce is centered on five structural pillars:

1. **Monorepo Structure, Polyglot Deployment:** A unified workspace (`omnicommerce`) using Turborepo and pnpm workspaces for code sharing, type safety, and centralized tooling, while deploying every service and frontend independently.
2. **Domain Boundaries Over Tech Stack:** Services are delineated strictly around business domains (Catalog, Order, Inventory, Auth) rather than technical functions.
3. **Client-Tailored Orchestration (BFF):** Client applications communicate with dedicated BFF services that aggregate backend APIs and shape payloads tailored for specific UI targets.
4. **Contract-Driven Communication:** All interactions between clients, BFFs, API Gateway, and microservices are governed by explicit DTOs, Zod schemas, and OpenAPI contracts.
5. **Observability & Security at Every Boundary:** Every layer enforces authentication, input validation, structured logging, distributed tracing, and metrics collection.

---

# 3. Architectural Principles

---

## 3.1 Domain-Oriented Design (Domain Boundaries)

### Statement
The platform is organized around distinct business domains rather than arbitrary technical layers or monolithic code structures. Each business domain is owned by an independent microservice with its own dedicated domain model and storage.

### Core Rules
- Business logic is grouped into bounded contexts corresponding to core business functions (e.g., Auth, Catalog, Inventory, Cart, Order, Payment, Shipping, Notification, Search, Analytics).
- A domain service is the sole authority over its domain models and underlying database tables.
- No domain service may access or mutate another domain service's database directly.
- Cross-domain interactions must take place strictly through published REST APIs or published domain events via RabbitMQ.

### Benefits
- Enables independent evolution of business domains without regression risks in unrelated domains.
- Facilitates team autonomy by assigning domain services to specialized engineering teams.
- Prevents dirty reads and data corruption caused by shared database access.

---

## 3.2 Separation of Concerns

### Statement
Every component and architectural layer in the platform has a single, well-defined responsibility and must not assume responsibilities belonging to another layer.

### Core Rules
- **Client & Presentation Layer:** Responsible only for UI rendering, routing, form validation, and local state management. Must never contain business rules or perform direct database calls.
- **BFF Layer:** Responsible for aggregating backend microservices, transforming responses, and performing client-specific API orchestration. Must not contain core domain business logic or direct database access.
- **API Gateway Layer:** Responsible for centralized request routing, JWT validation, rate limiting, logging, and correlation ID injection. Must never execute domain business logic.
- **Business Microservices Layer:** Responsible for core domain business rules, domain transactions, domain event publishing, and domain database persistence.
- **Infrastructure Layer:** Responsible for containerization, networking, deployment, edge routing, CDN caching, monitoring, and logging.

### Layer Responsibility Matrix

| Layer | Allowed Responsibilities | Explicitly Prohibited Responsibilities |
|-------|--------------------------|----------------------------------------|
| Client / Presentation | UI rendering, client state, navigation, form validation | Business rules, database calls, secret storage |
| BFF | API composition, client DTO transformation, response aggregation | Core domain business rules, database read/write |
| API Gateway | Routing, JWT token verification, rate limiting, request logging | Domain business logic, database queries |
| Microservices | Domain business logic, domain entities, database persistence, event publishing | Client UI layout, direct cross-domain DB access |
| Infrastructure | Networking, container runtime, edge security, log aggregation | Application business code, UI rendering |

---

## 3.3 Loose Coupling & High Cohesion

### Statement
Services must be highly cohesive internally and loosely coupled externally. High cohesion ensures that related business operations reside together; loose coupling ensures services interact through stable, explicit interfaces.

### Core Rules
- Services communicate strictly via HTTP/REST interfaces for synchronous reads/writes or RabbitMQ AMQP events for asynchronous state changes.
- Direct code imports between deployable applications (`apps/*`) are strictly forbidden. Code sharing occurs only via non-deployable shared packages (`packages/*`).
- Inter-service communication must depend on abstract DTO contracts and interfaces, not concrete backend implementation details.

### Implementation Checklist
- [x] Service interface defined via NestJS DTOs / Swagger specifications.
- [x] Shared data contracts published in `packages/dto` or `packages/events`.
- [x] Zero direct database links or shared tables between microservices.
- [x] Asynchronous event handling implemented using idempotent message consumers.

---

## 3.4 API-First Development & Contract-Driven Design

### Statement
All APIs must be explicitly designed, documented, and approved as contracts before code implementation begins.

### Core Rules
- Every public and internal REST endpoint must define a strict input/output contract using TypeScript interfaces, NestJS DTOs with `class-validator`, or Zod schemas.
- OpenAPI / Swagger documentation must be generated automatically for all backend microservices and BFFs.
- API changes must preserve backward compatibility. Breaking changes require semantic API versioning (e.g., `/v1/`, `/v2/`) and a deprecation cycle.
- DTO contracts shared between frontend and backend must reside in centralized packages (`packages/dto`, `packages/sdk`).

---

## 3.5 Event-Driven & Asynchronous Communication

### Statement
Asynchronous event-driven communication via message queues must be preferred over synchronous HTTP calls for all non-blocking operations, side effects, and cross-domain state notifications.

### Event Communication Flow

```text
  [ Order Service ]
         │
         ├── 1. Process Order Creation (PostgreSQL Transaction)
         ├── 2. Publish "OrderCreated" Event
         │
         ▼
    ┌──────────┐
    │ RabbitMQ │  (Exchange: amq.topic)
    └────┬─────┘
         │
         ├───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Inventory Service│    │Notification Serv.│    │ Analytics Service│
│ (Reserve Stock)  │    │(Send Email/Push) │    │(Update Dashboard)│
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Core Rules
- Synchronous HTTP requests are limited to immediate query responses or synchronous transactional workflows (e.g., authorization, price validation during checkout).
- Operations involving side effects (e.g., stock update after order placement, email dispatch, search indexing, analytics logging) must publish domain events to RabbitMQ.
- **Idempotency Mandatory:** Event consumers must handle duplicate messages safely without corrupting application state (using message IDs, deduplication tables, or optimistic locking).
- Event definitions and payload schemas must be versioned and published in `packages/events`.

---

## 3.6 Backend for Frontend (BFF) Pattern

### Statement
Frontend applications must not consume raw microservices directly. Dedicated Backend for Frontend (BFF) services act as client-specific API aggregators and adaptors.

```text
[ Customer Web ] ──┐
                   ├──> [ Customer BFF ] ──┐
[ Flutter Mobile ] ┘                       │
                                           ├──> [ API Gateway ] ──> [ Microservices ]
[ Admin Portal ] ──────> [ Admin BFF ]    ──┤
                                           │
[ Seller Portal ] ─────> [ Seller BFF ]   ──┘
```

### Core Rules
- **Customer BFF:** Serves Customer Web and Flutter Mobile. Focuses on high-performance product browsing, catalog aggregation, cart, and checkout orchestration.
- **Admin BFF:** Serves Admin Portal. Tailored for heavy administrative management, reporting, bulk operations, and analytics queries.
- **Seller BFF:** Serves Seller Portal. Tailored for merchant store management, stock updates, revenue statistics, and order fulfillment workflows.
- BFF services must not perform database operations; they delegate persistence exclusively to business microservices.

---

## 3.7 Microfrontend Architecture

### Statement
The web platform adopts a Microfrontend Architecture using Module Federation, allowing independent development, build, and deployment of distinct frontend business modules.

### Core Rules
- **Shell Application (`apps/frontend/shell`):** Acts as the host application. Provides app bootstrapping, global layout, routing skeleton, authentication state context, theme management, and dynamic remote module loading.
- **Remote Microfrontends (`apps/frontend/*`):** Domain-focused frontend modules (e.g., Catalog, Cart, Checkout, Orders, Admin Dashboard) developed as standalone applications.
- Microfrontends must communicate with each other through global routing, URL state, or custom event buses defined by the Shell, rather than direct module coupling.
- Shared React UI components must be consumed from the centralized package `packages/ui` to guarantee visual consistency.

---

## 3.8 Database per Service & Data Isolation

### Statement
Each business microservice owns its data exclusively. Databases are isolated by service boundaries; direct cross-service database querying or foreign key constraints across service databases are strictly prohibited.

```text
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│ Product Service   │    │ Inventory Service │    │ Order Service     │
└─────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘
          │                        │                        │
┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
│ PostgreSQL (prod) │    │ PostgreSQL (inv)  │    │ PostgreSQL (ord)  │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

### Core Rules
- Database schemas are managed using Prisma ORM with version-controlled migrations (`prisma/migrations`).
- Data consistency across multiple services is achieved through eventual consistency via RabbitMQ domain events or Sagas, never distributed two-phase commit (2PC) transactions.
- Shared databases between unrelated services are strictly forbidden.

---

## 3.9 Single Source of Truth & Derived Data Isolation

### Statement
The relational database (PostgreSQL) is the sole authoritative system of record for transactional data. Auxiliary datastores (Redis, Elasticsearch) contain derived or cached state and must be rebuildable at any time.

### Core Rules
- **PostgreSQL:** System of record for transactional business data (users, products, orders, inventory, payments).
- **Elasticsearch:** Read-only derived data engine for full-text search, auto-complete, and complex catalog filtering. Search indexes are updated asynchronously via domain events (e.g., `ProductCreated`, `ProductUpdated`).
- **Redis:** High-speed cache for session data, API rate-limiting counters, and short-lived query cache. Caches must always specify an explicit Time-To-Live (TTL).
- If Elasticsearch or Redis is cleared or corrupted, the system must continue to operate safely using PostgreSQL as the fallback source of truth.

---

## 3.10 Independent Deployability & Immutable Artifacts

### Statement
Every deployable application (`apps/*`) must be buildable, testable, and deployable independently without forcing redeployments of unrelated services.

### Core Rules
- All deployable units are containerized using Docker and tagged with immutable version tags (e.g., git commit SHA or semantic version tag) in GitHub Container Registry (GHCR).
- Builds must be deterministic and reproducible across development, staging, and production environments.
- Monorepo task orchestration (using Turborepo) must leverage build caching so that unchanged applications/packages are skipped during CI/CD pipelines.

---

## 3.11 Shared Engineering Standards & Type Safety

### Statement
The entire platform mandates strict end-to-end type safety, unified code style, and standardized library adoption.

### Core Rules
- **Language Standard:** TypeScript is mandatory for all web frontend, backend microservices, BFFs, and Node scripts. Dart is mandatory for Flutter mobile.
- **Type Safety Everywhere:** Strict TypeScript compiler configuration (`tsconfig.json`) with `strict: true` enabled across all workspaces. The use of `any` is strictly prohibited in production code.
- **Shared Code Organization:** Reusable logic must be encapsulated inside non-deployable packages under `packages/` (e.g., `packages/auth`, `packages/config`, `packages/database`, `packages/dto`, `packages/events`, `packages/logger`, `packages/ui`, `packages/utils`, `packages/validation`).
- **Workspace Enforcement:** Static analysis via ESLint, code formatting via Prettier, and git pre-commit hooks via Husky and lint-staged are strictly enforced.

---

## 3.12 Security by Design & Zero Trust

### Statement
Security controls must be integrated into system architecture from inception, operating under a Zero Trust model where external and internal traffic is explicitly authenticated, authorized, and validated.

### Core Rules
- **Transport Encryption:** Mandatory HTTPS/TLS for all external network traffic.
- **Stateless Authentication:** User authentication relies on JSON Web Tokens (JWT) containing cryptographically signed claims. Sensitive credentials (passwords) must be hashed using `bcrypt` before storage.
- **Role-Based Access Control (RBAC):** Authorization decisions are enforced at both the API Gateway and individual service guards using granular permissions (e.g., `roles`, `permissions` helpers in `packages/auth`).
- **Input Sanitization & Validation:** All HTTP request parameters, headers, query strings, and body payloads must be validated at the boundary using `Zod` or `class-validator`.
- **Secrets Protection:** No hardcoded secrets, API keys, database credentials, or private tokens in source code. Environment variables managed via central config (`packages/config`).

---

## 3.13 Observability First

### Statement
Every application and service must expose operational telemetry to enable real-time health monitoring, rapid incident diagnosis, and performance analysis.

### The Three Pillars of Observability

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Grafana Dashboards                               │
└───────────────────▲───────────────────▲───────────────────▲─────────────────┘
                    │                   │                   │
      ┌─────────────┴─────┐       ┌─────┴─────────────┐       ┌─────┴─────────────┐
      │ Prometheus        │       │ Loki              │       │ Tempo             │
      │ (Metrics)         │       │ (Logs)            │       │ (Traces)          │
      └─────────────▲─────┘       └─────▲─────────────┘       └─────▲─────────────┘
                    │                   │                   │
┌───────────────────┴───────────────────┴───────────────────┴─────────────────┐
│                    Applications & Microservices (Pino)                      │
│                    [ HTTP / gRPC / AMQP + Correlation ID ]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Rules
- **Structured Logging:** All services must output structured JSON logs using the standardized Pino logger (`packages/logger`). Plain `console.log` is prohibited.
- **Distributed Tracing:** Every incoming request entering the API Gateway is assigned a unique `X-Correlation-ID` header, which must be propagated across all downstream HTTP requests and RabbitMQ event headers.
- **Metrics & Dashboards:** Applications must expose `/health` and `/metrics` endpoints for Prometheus scraping and Grafana visualization.

---

## 3.14 Resiliency, Failure Isolation & Graceful Degradation

### Statement
The failure of a single microservice, database instance, or third-party API must not crash the entire platform. Systems must degrade gracefully under partial failure.

### Core Rules
- **Fault Isolation:** A failure in an auxiliary service (e.g., Notification Service or Analytics Service) must never block core transactional workflows like Checkout or Payment.
- **Timeouts & Circuit Breakers:** Outbound HTTP requests to external third-party services (e.g., VNPay, SMTP, OpenAI) must implement strict request timeouts, retries with exponential backoff, and circuit breakers.
- **Graceful UI Fallbacks:** Frontend components must handle API errors gracefully by rendering localized error states, skeleton loaders, or cached data instead of displaying blank white screens or unhandled exceptions.

---

## 3.15 Open Source First & Technology Selection Governance

### Statement
Technology selection must prioritize mature, widely adopted open-source technologies with active communities and long-term support (LTS).

### Core Rules
- New technologies, frameworks, or major architecture modifications must undergo evaluation via the Architecture Decision Record (ADR) process.
- Production environments must utilize Long-Term Support (LTS) runtimes (e.g., Node.js LTS, PostgreSQL LTS).
- Technology choices must be driven by architectural necessity, performance, type safety, and maintainability rather than transient trends.

---

# 4. Prohibited Architectural Anti-Patterns

To preserve the stability, security, and clean architecture of OmniCommerce, the following engineering anti-patterns are **strictly prohibited**:

```text
 🚫 PROHIBITED: Direct Database Access Across Service Boundaries
 ┌───────────────────┐          ┌───────────────────┐
 │ Product Service   │          │ Order Service     │
 └─────────┬─────────┘          └─────────┬─────────┘
           │                              │ ❌ Direct Query
           ▼                              │
 ┌───────────────────┐                    │
 │ PostgreSQL (prod) │ <──────────────────┘
 └───────────────────┘

 🚫 PROHIBITED: Client Direct Access to Internal Microservices
 ┌───────────────────┐
 │ Customer Web      │
 └─────────┬─────────┘
           │ ❌ Bypassing BFF & Gateway
           ▼
 ┌───────────────────┐
 │ Inventory Service │
 └───────────────────┘
```

### Anti-Pattern Reference Table

| Anti-Pattern | Description | Why It Is Prohibited | Mandatory Correct Approach |
|--------------|-------------|----------------------|----------------------------|
| **Cross-Service DB Access** | A service directly reads/writes another service's database tables. | Destroys service boundaries, introduces tight schema coupling, prevents independent database migrations. | Communicate via REST APIs or consume RabbitMQ domain events. |
| **Bypassing Gateway / BFF** | Client applications connect directly to internal business microservices. | Exposes internal network topology, bypasses centralized JWT validation and rate limiting. | Route all client traffic through dedicated BFFs and the API Gateway. |
| **Business Logic in BFF / Gateway** | Domain rules (e.g., price calculation, inventory deduction) implemented inside BFF or API Gateway. | Duplicates domain logic, leads to inconsistent business rules across client platforms. | Keep BFF/Gateway lean; place business logic exclusively in backend microservices. |
| **Shared Application Code Imports** | Importing source files directly from another app (e.g., `import x from '../../apps/backend/src'`). | Breaks independent builds, creates implicit monorepo coupling. | Extract reusable logic into a shared package inside `packages/*`. |
| **Synchronous Chain Calls** | Service A calls Service B synchronously, which calls Service C, which calls Service D. | Multiplies latency, creates tight runtime coupling, increases cascade failure risks. | Use event-driven asynchronous messaging via RabbitMQ for downstream operations. |
| **Silent Exception Swallowing** | Wrapping errors in empty `try/catch` blocks or returning generic fallback values without logging. | Masks underlying system bugs, hinders incident diagnosis and observability. | Log full error tracebacks via Pino logger and propagate normalized HTTP/RPC exceptions. |
| **Hardcoded Static Layout Math** | Hardcoding static pixel offsets or multipliers for dynamic UI components. | Causes broken layouts across dynamic viewports and mobile devices. | Calculate exact container bounds dynamically from flexbox/grid containers or design tokens. |
| **Blocking Main Loop Calls** | Running blocking synchronous wait loops or synchronous file IO on the main event loop thread. | Blocks the event loop, causing server unresponsiveness and high latency. | Use non-blocking async/await calls and non-blocking event handling. |

---

# 5. Architecture Governance & Compliance

---

## 5.1 Architecture Decision Records (ADR)

Whenever a significant technical decision, technology selection, or architectural pattern change is proposed, it must be documented as an Architecture Decision Record (ADR) in `docs/adr/`.

An ADR must follow the standardized format:
- **Title & Status:** Proposed, Accepted, Deprecated, Superseded.
- **Context:** The problem or business driver requiring an architectural decision.
- **Decision:** The chosen technical solution or architectural pattern.
- **Consequences:** Positive benefits, trade-offs, risks, and mitigations.

---

## 5.2 Architecture Review Gate

Major code contributions, new service initializations, or cross-cutting package changes require approval from the Architecture Review Gate prior to merging into the main branch.

The review gate verifies:
1. Alignment with `ARCHITECTURE_PRINCIPLES.md`.
2. Compliance with repository structure (`apps/` vs `packages/`).
3. Correct use of DTO contracts and event definitions.
4. Test coverage (unit, integration, contract) passing in CI pipelines.
5. Zero security vulnerabilities or hardcoded secrets.

---

## 5.3 CI/CD & Automated Enforcement

Architectural compliance is enforced automatically through CI/CD pipelines via GitHub Actions:

- **Type Checking:** `pnpm build` / `tsc --noEmit` verifies strict TypeScript compliance across all workspaces.
- **Linting & Formatting:** ESLint and Prettier rules enforce coding standards and prevent forbidden imports.
- **Dependency Graph Check:** Turborepo checks workspace dependency boundaries to ensure no circular package references exist.
- **Automated Tests:** Unit tests (Jest), API integration tests (Supertest), and E2E tests (Playwright) run automatically on pull requests.

---

# 6. References

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - System Architecture Overview
- [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md) - Approved Technology Stack & Governance
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - Backend Microservices Architecture
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Web Frontend Architecture
- [MICROFRONTEND_ARCHITECTURE.md](./MICROFRONTEND_ARCHITECTURE.md) - Microfrontend & Module Federation Architecture
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) - Database Design & Schema Management
- [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md) - Asynchronous Messaging & Event Design
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) - Security Standards & Authentication Model
- [OBSERVABILITY_ARCHITECTURE.md](./OBSERVABILITY_ARCHITECTURE.md) - Monitoring, Logging & Distributed Tracing
