# OmniCommerce Technology Stack & Agent Reference Guide

> **Target File:** `.agent/technology-stack.md`  
> **Source:** [TECHNOLOGY_STACK.md](../docs/01-overview/TECHNOLOGY_STACK.md)  
> **Purpose:** Comprehensive agent reference guide for approved technologies, stack matrices, design principles, decision rationale, versioning policies, and technology governance across the OmniCommerce platform.  
> **Version:** 1.0.0  
> **Last Updated:** July 2026  

---

## Document Information

| Item | Description |
|---|---|
| Project | OmniCommerce |
| Document Type | Platform Technology Stack Reference Guide for AI Agents |
| Scope | Platform-Wide (Frontend, Backend, Database, Messaging, Search, Storage, Infrastructure, Security, Observability, DevOps, Tooling, Testing) |
| Related Agent Files | [context.md](./context.md), [glossary.md](./glossary.md), [project-map.md](./project-map.md) |
| Core Specs | [TECHNOLOGY_STACK.md](../docs/01-overview/TECHNOLOGY_STACK.md), [SYSTEM_ARCHITECTURE.md](../docs/01-overview/SYSTEM_ARCHITECTURE.md) |

---

## Table of Contents

- [1. Executive Summary & Purpose](#1-executive-summary--purpose)
- [2. Technology Selection Principles](#2-technology-selection-principles)
- [3. Architecture Stack Overview Matrix](#3-architecture-stack-overview-matrix)
- [4. Category-by-Category Technology Stack](#4-category-by-category-technology-stack)
  - [4.1 Frontend Technology Stack](#41-frontend-technology-stack)
  - [4.2 Backend Technology Stack](#42-backend-technology-stack)
  - [4.3 Shared Libraries](#43-shared-libraries)
  - [4.4 Monorepo & Development Tooling](#44-monorepo--development-tooling)
  - [4.5 Database & Persistence Technologies](#45-database--persistence-technologies)
  - [4.6 Messaging & Event-Driven Technologies](#46-messaging--event-driven-technologies)
  - [4.7 Search Technologies](#47-search-technologies)
  - [4.8 Storage Technologies](#48-storage-technologies)
  - [4.9 Infrastructure & Networking Technologies](#49-infrastructure--networking-technologies)
  - [4.10 Testing Stack](#410-testing-stack)
  - [4.11 Security Stack](#411-security-stack)
  - [4.12 Observability Stack](#412-observability-stack)
  - [4.13 DevOps & CI/CD Stack](#413-devops--cicd-stack)
  - [4.14 Third-Party Integrations](#414-third-party-integrations)
- [5. Technology Decision Matrix & Rationale](#5-technology-decision-matrix--rationale)
- [6. Approved Alternatives & Replacement Workflow](#6-approved-alternatives--replacement-workflow)
- [7. Technology Lifecycle & Governance Rules](#7-technology-lifecycle--governance-rules)
- [8. Versioning & Upgrade Strategy](#8-versioning--upgrade-strategy)
- [9. Technology Roadmap](#9-technology-roadmap)
- [10. Cross-Reference Index](#10-cross-reference-index)

---

## 1. Executive Summary & Purpose

This document serves as the authoritative, single source of truth for all approved technologies across the **OmniCommerce** platform. 

AI Agents working in this repository MUST strictly abide by the technology choices, boundaries, frameworks, and patterns defined herein. Introducing new frameworks, libraries, database engines, or third-party SDKs without prior Architecture Decision Record (ADR) approval is strictly prohibited.

---

## 2. Technology Selection Principles

All technology decisions across OmniCommerce follow ten core engineering principles:

1. **Open Source First:** Prefer well-maintained open-source tools over proprietary platforms unless commercial solutions offer overwhelming business value.
2. **Cloud-Native Design:** Technologies must natively support containerization (Docker), horizontal scaling, statelessness, and automated deployments.
3. **Type Safety:** Enforce end-to-end static typing across frontend and backend layers (TypeScript, NestJS, Prisma, Zod).
4. **Modularity:** Enforce clean architectural boundaries, modular design, high cohesion, and loose coupling across monorepo apps and microservices.
5. **Scalability:** Support horizontal service scaling, independent module/service deployment, and distributed workloads.
6. **Performance:** Prioritize low startup times, minimal memory footprint, efficient CPU utilization, fast page load speeds, and low API latency.
7. **Maintainability:** Standardize tooling, clean architecture, automated code linting/formatting, clear documentation, and easy upgrades.
8. **Community & Ecosystem:** Select mature frameworks with active open-source communities, comprehensive documentation, and long-term viability.
9. **Long-Term Support (LTS):** Target LTS runtime versions (Node.js LTS), stable framework releases, and long-term supported operating systems.
10. **Interoperability:** Ensure seamless integration across HTTP/REST, AMQP events, OAuth2/JWT tokens, standard metrics, and centralized logging.

---

## 3. Architecture Stack Overview Matrix

| Layer / Category | Primary Technology | Secondary / Supporting Tech | Purpose |
|---|---|---|---|
| **Presentation / Client** | React 18+, Next.js (App Router) | Tailwind CSS, Lucide React, Framer Motion | Web UI rendering, SSR, SSG, styling, animations |
| **Microfrontend Architecture** | Module Federation | Turborepo | Microfrontend composition, host-remote loading |
| **Mobile Client** | Flutter | Dart | Cross-platform iOS/Android mobile application |
| **BFF Layer** | NestJS | TypeScript, Axios, Zod | Client-specific API aggregation & composition |
| **API Gateway Layer** | NestJS Gateway / Nginx | `@nestjs/throttler`, JWT Guard | Central routing, rate limiting, authentication |
| **Backend Microservices** | NestJS | Node.js LTS, TypeScript, RxJS | Core domain logic, transaction execution |
| **Relational Database** | PostgreSQL 15+ | Prisma ORM, Prisma Migrate | System of record, transactional data |
| **Cache Store** | Redis | ioredis | Distributed caching, session store, pub/sub |
| **Search Engine** | Elasticsearch 8+ | Lucene | Product catalog full-text search & faceting |
| **Message Broker** | RabbitMQ | AMQP Protocol | Asynchronous domain event broadcasting |
| **Object Storage** | MinIO (Dev) / Cloudflare R2 (Prod) | AWS S3 SDK | Product images, media, user documents |
| **Edge & CDN** | Cloudflare | WAF, Edge DNS, SSL | Global CDN, DDoS protection, edge caching |
| **Reverse Proxy** | Nginx | OpenSSL | SSL termination, reverse proxy routing |
| **Metrics & Dashboards** | Prometheus | Grafana | System metrics collection & visualization |
| **Log Aggregation** | Loki | Pino (Structured JSON) | Centralized log ingestion and querying |
| **Distributed Tracing** | Tempo | OpenTelemetry | End-to-end HTTP/Event request tracing |
| **Containerization** | Docker | Docker Compose | Service packaging & isolated development |
| **Monorepo Management** | Turborepo | pnpm Workspaces | Build orchestration, task caching, monorepo |

---

## 4. Category-by-Category Technology Stack

### 4.1 Frontend Technology Stack

| Category | Approved Technology | Purpose / Responsibilities | Selection Rationale |
|---|---|---|---|
| **Runtime** | Node.js LTS | JavaScript execution environment | Stable, enterprise support, high performance |
| **Framework** | Next.js (App Router) | React application framework, hybrid rendering | SSR/SSG/ISR, SEO, Server Components, file routing |
| **UI Library** | React | Component library & UI composition | Declarative UI, mature ecosystem, virtual DOM |
| **Language** | TypeScript | Static type safety | Prevents runtime bugs, IDE IntelliSense, safer refactoring |
| **Styling** | Tailwind CSS | Utility-first CSS styling framework | Design token consistency, zero CSS bloat, fast DX |
| **State Management** | Zustand | Lightweight client UI state | Minimal boilerplate, small bundle size, simple hooks API |
| **Server State** | TanStack Query (React Query) | Data fetching, caching, synchronization | Automatic refetching, query deduplication, optimistic updates |
| **Form Management** | React Hook Form | High-performance form state management | Uncontrolled components, zero unnecessary re-renders |
| **Validation** | Zod | Runtime schema validation & type inference | TypeScript-first, seamless integration with React Hook Form |
| **HTTP Client** | Axios | Standardized REST client | Interceptors, request cancellation, request/response headers |
| **Icon Library** | Lucide React | Clean, tree-shakeable SVG icons | Consistent icon design, lightweight bundle impact |
| **Animation** | Framer Motion | Declarative UI animations & transitions | Layout animations, page transitions, gesture control |
| **Microfrontend** | Module Federation | Microfrontend runtime loading | Independent MFE deployments, shared React runtime |
| **Package Manager** | pnpm | Fast, disk-efficient dependency manager | Strict node_modules hierarchy, workspace support |
| **Monorepo Orchestrator** | Turborepo | Task orchestration & build caching | Parallel execution, incremental builds, zero configuration |

---

### 4.2 Backend Technology Stack

| Category | Approved Technology | Purpose / Responsibilities | Selection Rationale |
|---|---|---|---|
| **Runtime** | Node.js LTS | Backend execution runtime | Non-blocking I/O, vast npm library ecosystem |
| **Framework** | NestJS | Modular enterprise microservices framework | Dependency injection, module hierarchy, structured architecture |
| **Language** | TypeScript | Static typing across backend layers | Shared models with frontend, robust compile-time checks |
| **ORM** | Prisma ORM | Type-safe database queries & migrations | Auto-generated client, robust migration tool, zero SQL injection |
| **Validation** | class-validator | Declarative DTO input validation | Decorator-based validation, automatic error responses |
| **Transformation** | class-transformer | Object serialization & DTO transformation | Strips sensitive fields, converts plain JS objects to DTO classes |
| **Authentication** | JWT (JSON Web Tokens) | Stateless authentication & authorization | Standardized claims, API Gateway validation, decoupled auth |
| **API Specs** | OpenAPI / Swagger | Interactive API documentation | Auto-generated docs, interactive API testing sandbox |

---

### 4.3 Shared Libraries

The monorepo contains reusable shared packages located under `packages/`:

| Package Name | Scope | Contents & Responsibilities |
|---|---|---|
| `@omni/ui` | Frontend | Reusable UI component design system built with React & Tailwind CSS |
| `@omni/design-tokens` | Frontend | Theme tokens, color palettes, typography scale, spacing scales |
| `@omni/api-client` | Frontend | Pre-configured Axios instance, API endpoints, error interceptors |
| `@omni/common-dtos` | Universal | Shared DTO classes, payload interfaces, validation schemas |
| `@omni/logger` | Backend | Standardized Pino logger configuration, correlation ID context |
| `@omni/config` | Universal | Shared ESLint, Prettier, TypeScript `tsconfig.json` bases |
| `@omni/utils` | Universal | Common helper utility functions (date parsing, currency formatting) |

---

### 4.4 Monorepo & Development Tooling

| Tool | Purpose | Key Responsibilities |
|---|---|---|
| **Turborepo** | Build Orchestration | Manages build pipelines, caches build artifacts, parallel execution |
| **pnpm Workspaces** | Package Management | Manages monorepo dependencies, links local monorepo packages |
| **ESLint** | Static Analysis | Code linting, syntax error prevention, architectural boundary rules |
| **Prettier** | Code Formatting | Automated formatting, consistent code style across monorepo |
| **Husky** | Git Hooks | Triggers pre-commit linting, type checks, and commit message checks |
| **lint-staged** | Staged File Linting | Runs ESLint and Prettier exclusively on changed git files |
| **Conventional Commits** | Commit Standard | Standardizes git commit messages (`feat`, `fix`, `docs`, `refactor`) |
| **VS Code** | Standard IDE | Recommended editor with official extensions (Prisma, Tailwind, ESLint) |

---

### 4.5 Database & Persistence Technologies

| Technology | Role | Governance & Architectural Rules |
|---|---|---|
| **PostgreSQL 15+** | Relational System of Record | Each microservice MUST own an isolated PostgreSQL database instance/schema. Direct cross-service DB access is STRICTLY FORBIDDEN. |
| **Prisma ORM** | Data Access Layer | All DB operations MUST use Prisma Client. Raw SQL queries are restricted to complex analytical queries requiring explicit architecture review. |
| **Prisma Migrate** | Schema Management | Production schema changes MUST be executed via versioned migration files in `prisma/migrations`. Manual DB edits in production are PROHIBITED. |
| **PostgreSQL Connection Pool** | Connection Management | Max connections per service instance MUST be configured based on pod scaling thresholds to prevent DB connection exhaustion. |

---

### 4.6 Messaging & Event-Driven Technologies

| Technology | Role | Governance & Architectural Rules |
|---|---|---|
| **RabbitMQ** | Message Broker | Handles asynchronous inter-service events (Domain & Integration Events). Services MUST NOT share event queues. |
| **AMQP 0-9-1** | Protocol | Standard protocol for message routing between producers, exchanges, and queues. |
| **Dead-Letter Queue (DLQ)** | Error Recovery | Failed event consumers MUST push failed events to dedicated DLQs after max retries for manual inspection. |

---

### 4.7 Search Technologies

| Technology | Role | Governance & Architectural Rules |
|---|---|---|
| **Elasticsearch 8+** | Search Engine | Primary search index for product catalog, auto-complete, and faceted filtering. |
| **Async Index Sync** | Data Sync | Elasticsearch index data is DERIVED data. The primary PostgreSQL DB remains the single source of truth. Indexes are updated asynchronously via RabbitMQ domain events. |

---

### 4.8 Storage Technologies

| Environment | Approved Technology | Purpose |
|---|---|---|
| **Local Development** | MinIO | S3-compatible local Docker object storage container. |
| **Staging / Production** | Cloudflare R2 | Cost-effective, zero-egress S3-compatible object storage for media assets. |

---

### 4.9 Infrastructure & Networking Technologies

| Category | Approved Technology | Purpose & Capabilities |
|---|---|---|
| **Containerization** | Docker | Application container packaging & environment consistency |
| **Reverse Proxy** | Nginx | Edge proxy, SSL termination, request routing, static asset compression |
| **Edge & CDN** | Cloudflare | DNS management, TLS certificate authority, DDoS mitigation, WAF |
| **Operating System** | Linux (Alpine / Debian Slim) | Lightweight, secure container base images |
| **Container Registry** | GHCR (GitHub Container Registry) | Production container image storage and versioning |
| **Protocols** | HTTPS, TLS 1.3, HTTP/2, REST | Encrypted transit, multiplexed connections, resource-oriented APIs |

---

### 4.10 Testing Stack

| Layer | Approved Tool | Scope & Rules |
|---|---|---|
| **Unit Testing** | Jest | Unit tests for service logic, utils, hooks, state reducers. High coverage on business logic required. |
| **API / Integration** | Supertest | Integration tests for NestJS controllers and HTTP endpoints. |
| **Frontend Component** | React Testing Library | Component interaction testing focusing on user accessibility and behavior. |
| **End-to-End (E2E)** | Playwright | Browser E2E automation for critical checkout, login, and registration workflows. |
| **Load / Performance** | k6 | Performance and spike testing under peak customer traffic conditions. |

---

### 4.11 Security Stack

| Security Domain | Technology / Tool | Implementation Rule |
|---|---|---|
| **Authentication** | JWT | Short-lived access tokens (15 mins), HTTP-only refresh tokens (7 days). |
| **Password Hashing** | bcrypt | Salt factor >= 10 for all stored passwords. |
| **HTTP Security Headers** | Helmet | Configures CSP, HSTS, X-Frame-Options, Referrer-Policy on NestJS and Nginx. |
| **CORS** | NestJS CORS Guard | Strict whitelist of allowed origins (Customer Web, Admin, Seller domains). |
| **Rate Limiting** | `@nestjs/throttler` | Applied at API Gateway & BFF endpoints to block brute-force and DDoS. |
| **Input Validation** | class-validator & Zod | Strict sanitization of all incoming query params, request bodies, and headers. |

---

### 4.12 Observability Stack

| Pillar | Technology | Purpose |
|---|---|---|
| **Metrics** | Prometheus | Scrapes system metrics, request latencies, CPU/Memory, error rates. |
| **Visualization** | Grafana | Real-time monitoring dashboards and operational alert thresholds. |
| **Logging** | Loki | Centralized log collection for structured JSON logs. |
| **Tracing** | Tempo | Distributed APM tracing with correlation IDs across Gateway, BFF, and Microservices. |
| **Logger Library** | Pino | High-speed, non-blocking JSON application logger. |

---

### 4.13 DevOps & CI/CD Stack

| Tool | Purpose |
|---|---|
| **GitHub** | Source control repository, pull request reviews, branch protection. |
| **GitHub Actions** | Automated CI/CD pipelines (linting, testing, building, publishing containers). |
| **GHCR** | Image registry hosting tagged Docker containers for staging and production. |

---

### 4.14 Third-Party Integrations

| Domain | Provider | Integration Rule |
|---|---|---|
| **CDN & DNS** | Cloudflare | DNS management, edge caching, WAF security rules. |
| **Object Storage** | Cloudflare R2 | Production storage for images, invoices, product attachments. |
| **Payment Gateway** | VNPay | Online merchant payment processing via secure backend webhook verification. |
| **Email Gateway** | Transactional SMTP | Asynchronous email dispatch for registration, order confirmation, password resets. |
| **AI Integration** | OpenAI API *(Optional)* | Controlled AI service integrations isolated behind application service interfaces. |

---

## 5. Technology Decision Matrix & Rationale

The table below outlines key technical choices, evaluated alternatives, and engineering rationale:

| Decision Domain | Selected Tech | Evaluated Alternatives | Rationale for Decision |
|---|---|---|---|
| **Frontend Framework** | **Next.js** | Vite, Remix, CRA | Built-in App Router, Server Components, hybrid SSR/SSG rendering, SEO optimization. |
| **UI Styling** | **Tailwind CSS** | Styled Components, CSS Modules | Zero runtime overhead, rapid utility-first DX, standardized design tokens. |
| **Client State** | **Zustand** | Redux Toolkit, Jotai | Minimal boilerplate, small bundle size, simple hooks-based store management. |
| **Server State** | **TanStack Query** | SWR, Apollo Client | Advanced query caching, background refetching, mutation management, optimistic updates. |
| **Backend Framework** | **NestJS** | Express, Fastify, Koa | Enterprise-grade TypeScript framework, out-of-the-box Dependency Injection, modular architecture. |
| **Database ORM** | **Prisma ORM** | TypeORM, Sequelize, Drizzle | End-to-end type safety, auto-generated queries, excellent declarative migration system. |
| **Primary Database** | **PostgreSQL** | MySQL, MongoDB | Advanced ACID compliance, JSONB document capabilities, robust indexing, high reliability. |
| **Message Broker** | **RabbitMQ** | Apache Kafka, Redis Streams | Flexible exchange/queue routing, dead-letter support, lightweight AMQP protocol for microservices. |
| **Search Engine** | **Elasticsearch** | PostgreSQL FTS, Meilisearch | Industry standard full-text search, multi-faceted filtering, distributed scalability. |
| **Object Storage** | **Cloudflare R2** | AWS S3, Google Cloud Storage | Full S3 API compatibility with zero bandwidth egress fees. |
| **Package Manager** | **pnpm** | npm, Yarn | Fast installation speed, disk storage optimization, strict symlinked monorepo workspaces. |
| **Build Orchestrator**| **Turborepo** | Lerna, Nx | High performance, intelligent build caching, zero configuration overhead. |

---

## 6. Approved Alternatives & Replacement Workflow

### 6.1 Approved Alternatives List

Under specific, documented circumstances, the following approved alternatives may be used:

| Primary Technology | Approved Alternative | Permissible Context |
|---|---|---|
| Axios | Native Fetch API | Edge environments, Next.js Server Components |
| Zustand | Redux Toolkit | Legacy complex state migration scenarios |
| Framer Motion | Motion One | Lightweight animation requirements |
| Tailwind CSS | CSS Modules | Third-party widget isolation |
| Docker | Podman | Environments requiring rootless container execution |

---

### 6.2 Technology Replacement Workflow

To replace an approved technology or introduce a new technology into OmniCommerce, AI Agents and developers MUST follow this lifecycle:

```text
[ Architectural Proposal ]
           │
           ▼
[ Architecture Team Review (ADR) ]
           │
           ▼
[ Prototype / Proof of Concept ]
           │
           ▼
[ Technical Evaluation (Security, Perf, DX) ]
           │
           ▼
[ Formal Approval ]
           │
           ▼
[ Migration Plan & Staging Validation ]
           │
           ▼
[ Production Rollout & Doc Update ]
```

---

## 7. Technology Lifecycle & Governance Rules

Every technology in the codebase resides in one of six lifecycle stages:

```
Evaluation → Approved → Active → Maintenance → Deprecated → Retired
```

| Lifecycle Stage | Definition & Rules for AI Agents |
|---|---|
| **Evaluation** | Under research or POC prototyping. MUST NOT be used in production code. |
| **Approved** | Formally accepted for production use by the Architecture Team. |
| **Active** | Standard, recommended choice for all new features and applications. |
| **Maintenance** | Supported for existing apps, but NOT recommended for new projects. |
| **Deprecated** | Scheduled for removal. AI Agents MUST actively migrate away from deprecated tools. |
| **Retired** | No longer supported or allowed in the repository. |

---

## 8. Versioning & Upgrade Strategy

1. **Semantic Versioning (SemVer):** All packages, services, and shared libraries MUST follow `MAJOR.MINOR.PATCH` versioning.
2. **LTS Preference:** Always select Long-Term Support (LTS) versions for core runtimes (e.g., Node.js 20+ LTS).
3. **Controlled Major Upgrades:** Major dependency updates MUST be tested in staging environments before merging to `main`.
4. **Security Patching Priority:** High/Critical security advisories (npm audit / Snyk) receive top-priority patch deployment.

---

## 9. Technology Roadmap

- **Short-Term:** Complete CI/CD pipeline automation, establish Tempo distributed tracing, refine OpenAPI generation.
- **Mid-Term:** Optimize Elasticsearch index synchronization, expand microfrontend federated modules, automate load testing with k6.
- **Long-Term:** Multi-region deployment, advanced event streaming evaluation, intelligent automated monitoring and anomaly detection.

---

## 10. Cross-Reference Index

This agent reference guide complements the core platform specification documents:

- [TECHNOLOGY_STACK.md](../docs/01-overview/TECHNOLOGY_STACK.md)
- [SYSTEM_ARCHITECTURE.md](../docs/01-overview/SYSTEM_ARCHITECTURE.md)
- [BACKEND_ARCHITECTURE.md](../docs/02-architecture/BACKEND_ARCHITECTURE.md)
- [FRONTEND_ARCHITECTURE.md](../docs/02-architecture/FRONTEND_ARCHITECTURE.md)
- [MICROFRONTEND_ARCHITECTURE.md](../docs/02-architecture/MICROFRONTEND_ARCHITECTURE.md)
- [DATABASE_ARCHITECTURE.md](../docs/02-architecture/DATABASE_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](../docs/02-architecture/EVENT_ARCHITECTURE.md)
- [SEARCH_ARCHITECTURE.md](../docs/02-architecture/SEARCH_ARCHITECTURE.md)
- [OBSERVABILITY_ARCHITECTURE.md](../docs/02-architecture/OBSERVABILITY_ARCHITECTURE.md)
- [SECURITY_ARCHITECTURE.md](../docs/02-architecture/SECURITY_ARCHITECTURE.md)
- [DEVOPS_ARCHITECTURE.md](../docs/02-architecture/DEVOPS_ARCHITECTURE.md)
- [MONOREPO_GUIDE.md](../docs/02-architecture/MONOREPO_GUIDE.md)
- [context.md](./context.md)
- [glossary.md](./glossary.md)
- [project-map.md](./project-map.md)
