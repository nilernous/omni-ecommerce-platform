# OmniCommerce System Glossary

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Architectural Lexicon & Technical Glossary  
> **Last Updated:** July 2026  
> **Owner:** Architecture Team  

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Document Type | System Glossary & Technical Lexicon |
| Scope | Platform-Wide (Domain Concepts, Technologies, Architectural Patterns, Infrastructure, Security) |
| Related Documents | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md), [ARCHITECTURE_PRINCIPLES.md](./ARCHITECTURE_PRINCIPLES.md) |

---

# Table of Contents

- [1. Introduction](#1-introduction)
- [2. Quick Reference (A–Z Index)](#2-quick-reference-az-index)
- [3. Architectural & Design Patterns](#3-architectural--design-patterns)
- [4. Client & Presentation Layer Terms](#4-client--presentation-layer-terms)
- [5. Backend, Orchestration & API Terms](#5-backend-orchestration--api-terms)
- [6. Business Domains & Microservices](#6-business-domains--microservices)
- [7. Data, Persistence & Storage Terms](#7-data-persistence--storage-terms)
- [8. Messaging & Event-Driven Terms](#8-messaging--event-driven-terms)
- [9. Infrastructure, Edge & DevOps Terms](#9-infrastructure-edge--devops-terms)
- [10. Observability & Diagnostics Terms](#10-observability--diagnostics-terms)
- [11. Security & Compliance Terms](#11-security--compliance-terms)
- [12. Tooling, Monorepo & Development Terms](#12-tooling-monorepo--development-terms)
- [13. Acronyms & Abbreviations Matrix](#13-acronyms--abbreviations-matrix)
- [14. References](#14-references)

---

# 1. Introduction

This document provides a comprehensive technical dictionary and domain lexicon for the **OmniCommerce** enterprise e-commerce platform.

It standardizes terms, abbreviations, architectural patterns, technologies, component names, and domain concepts used throughout the codebase, documentation, pull requests, and architectural discussions.

Standardizing terminology ensures clear communication across frontend, backend, mobile, DevOps, QA, and software architecture teams.

---

# 2. Quick Reference (A–Z Index)

| Term | Category | Brief Definition |
|------|----------|------------------|
| **ADR** | Architecture Governance | Architectural Decision Record documenting key technical choices. |
| **AMQP** | Messaging | Advanced Message Queuing Protocol used by RabbitMQ. |
| **API Gateway** | Backend | Single entry point routing requests to internal microservices. |
| **BFF** | Backend | Backend for Frontend; API layer optimized for specific client types. |
| **Circuit Breaker** | Resiliency | Resiliency pattern blocking calls to failing external services. |
| **Correlation ID** | Observability | Unique identifier (`X-Correlation-ID`) traced across request flows. |
| **Dead Letter Queue (DLQ)** | Messaging | RabbitMQ queue holding messages that failed processing retries. |
| **Domain Event** | Messaging | Asynchronous notification emitted when domain state changes. |
| **Elasticsearch** | Data / Search | Distributed search engine used for product catalog indexing. |
| **Eventual Consistency** | Data / Architecture | Data alignment model across services driven asynchronously. |
| **Flutter** | Client / Mobile | Cross-platform framework used for native mobile iOS/Android apps. |
| **GHCR** | Infrastructure | GitHub Container Registry for storing Docker container images. |
| **Grafana** | Observability | Visualization platform for system metrics, logs, and traces. |
| **Idempotency** | Messaging / API | Property ensuring operations produce identical results if retried. |
| **JWT** | Security | JSON Web Token used for stateless authentication. |
| **Loki** | Observability | Log aggregation system integrated with Grafana and Pino. |
| **Microservices** | Architecture | Distributed architecture where domains run as isolated services. |
| **Microfrontend** | Presentation | Frontend architecture splitting web UIs into independent modules. |
| **Module Federation** | Presentation | Webpack/Rspack technology enabling dynamic microfrontend loading. |
| **Monorepo** | Development | Single repository (`omnicommerce`) containing all apps and packages. |
| **NestJS** | Backend | Enterprise Node.js framework used for backend services and BFFs. |
| **Next.js** | Presentation | React framework providing App Router, SSR, and hybrid rendering. |
| **Pino** | Observability | High-performance structured JSON logger for Node.js services. |
| **pnpm Workspaces** | Development | Package manager managing monorepo workspace dependencies. |
| **PostgreSQL** | Data | Primary relational database system of record. |
| **Prisma ORM** | Data / Backend | Next-generation Node.js ORM used for type-safe database queries. |
| **Prometheus** | Observability | Time-series metrics collection system. |
| **RabbitMQ** | Messaging | Open-source message broker facilitating event-driven workflows. |
| **RBAC** | Security | Role-Based Access Control enforcing user permissions. |
| **Redis** | Data / Cache | In-memory key-value store used for session storage and caching. |
| **Shell Application** | Presentation | Host container loading remote microfrontends. |
| **Tempo** | Observability | Open-source distributed tracing backend by Grafana. |
| **Turborepo** | Development | Build orchestration tool for monorepos with intelligent caching. |
| **Zod** | Development / Security | TypeScript-first schema validation library. |
| **Zustand** | Presentation | Lightweight client state management library for React. |

---

# 3. Architectural & Design Patterns

### Architecture Style
The overarching structural design of OmniCommerce, combining Microservices, Microfrontends, Backend for Frontend (BFF), Event-Driven Architecture, and Cloud-Native infrastructure.

### Backend for Frontend (BFF)
An architectural pattern where dedicated backend services aggregate, transform, and optimize microservice APIs specifically for individual client applications (e.g., Customer BFF, Admin BFF, Seller BFF).

### Microservices Architecture
A software architecture style that structures an application as a collection of loosely coupled, independently deployable domain services communicating via lightweight protocols (REST, AMQP).

### Microfrontend Architecture
An architectural pattern extending microservice concepts to the web presentation layer, decomposing a monolithic frontend into independent, domain-owned web modules composed at runtime.

### Event-Driven Architecture (EDA)
A software architecture paradigm in which microservices publish and consume domain events asynchronously to communicate state changes without direct service coupling.

### Domain-Driven Design (DDD)
An approach to software development emphasizing the alignment of system design with business domains, bounded contexts, and explicit domain models.

### Bounded Context
A central pattern in Domain-Driven Design defining explicit logical boundaries within which a domain model applies and remains strictly consistent.

### Database per Service
An architectural pattern mandating that each microservice owns its private database. Other services cannot directly access the database tables; they must consume public APIs or events.

### Single Source of Truth (SSOT)
The authoritative datastore for a given entity or domain (e.g., PostgreSQL for orders and catalog items). Auxiliary stores (Redis, Elasticsearch) contain derived or cached representations.

### Eventual Consistency
A consistency model used in distributed systems where data replicas or derived indexes (e.g., Elasticsearch search indexes) update asynchronously and become consistent over time.

### Circuit Breaker Pattern
A design pattern used in distributed systems to detect failures and prevent cascading failures by temporarily blocking calls to an un-responsive downstream or third-party service.

### Idempotency
A property of API endpoints or event consumers where executing the same request or message multiple times yields the exact same state result as executing it once.

### Monorepo Architecture
A software development strategy where code for all applications (`apps/`), shared libraries (`packages/`), infrastructure (`infra/`), and documentation (`docs/`) resides in a single version-controlled repository.

---

# 4. Client & Presentation Layer Terms

### Customer Web (`apps/frontend/customer`)
The customer-facing web application delivering online shopping capabilities (browsing, cart, checkout, profile management).

### Admin Portal (`apps/frontend/admin`)
The internal management web platform used by administrators for system management, catalog control, inventory management, customer support, and business analytics.

### Seller Portal (`apps/frontend/seller`)
The merchant-facing web platform providing tools for store setup, product publishing, inventory tracking, order fulfillment, and revenue reports.

### Flutter Mobile (`apps/mobile/flutter`)
The cross-platform native mobile application built with Flutter, delivering shopping, order tracking, and push notification capabilities for iOS and Android.

### Shell Application (`apps/frontend/shell`)
The host web application in a Microfrontend architecture responsible for bootstrapping, shared navigation, layout rendering, global authentication state context, and dynamic loading of remote microfrontends.

### Remote Microfrontend
An independent frontend module (e.g., Catalog MFE, Checkout MFE, Cart MFE) compiled and hosted separately, loaded dynamically by the Shell Application via Module Federation.

### Module Federation
A JavaScript module loading technology (via Webpack or Rspack) enabling separate frontend builds to share modules and load remote components dynamically at runtime.

### Design Tokens
Centralized design constants (colors, typography, spacing, breakpoints, shadows) defined in `packages/ui` to maintain visual consistency across web applications.

---

# 5. Backend, Orchestration & API Terms

### API Gateway (`apps/bff/api-gateway` or root gateway)
The unified public access point for backend services, handling centralized cross-cutting concerns such as request routing, JWT validation, rate limiting, CORS, request logging, and correlation ID injection.

### Customer BFF (`apps/bff/customer-bff`)
Backend for Frontend tailored for Customer Web and Flutter Mobile applications, optimizing catalog payloads, cart operations, and checkout workflows.

### Admin BFF (`apps/bff/admin-bff`)
Backend for Frontend tailored for Admin Portal, optimizing data aggregation for dashboards, bulk operations, management reports, and analytics.

### Seller BFF (`apps/bff/seller-bff`)
Backend for Frontend tailored for Seller Portal, handling store operations, merchant inventory adjustments, and order processing workflows.

### NestJS
The enterprise Node.js framework using TypeScript, dependency injection, modules, controllers, providers, guards, and interceptors to build scalable backend services.

### Data Transfer Object (DTO)
An object defining data contracts for transmitting data between software layers or over network APIs without exposing domain entities directly.

### REST API
Representational State Transfer API protocol using standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) for synchronous resource manipulation.

### Swagger / OpenAPI
An open specification and tooling framework used in NestJS services to document REST API endpoints, schemas, and interactive test clients automatically.

---

# 6. Business Domains & Microservices

### Authentication Service (`apps/backend/auth-service`)
Microservice managing identity, login, registration, password hashing, JWT generation, refresh tokens, and user role assignments.

### User Service (`apps/backend/user-service`)
Microservice managing customer profiles, addresses, user preferences, and merchant profile metadata.

### Product Catalog Service (`apps/backend/product-service`)
Microservice managing master product details, SKUs, categories, brands, variants, attributes, and product specifications.

### Inventory Service (`apps/backend/inventory-service`)
Microservice managing warehouse stock levels, stock reservations during checkout, safety stock thresholds, and stock updates.

### Cart Service (`apps/backend/cart-service`)
Microservice handling temporary customer shopping carts, item additions, quantity updates, and price calculations prior to checkout.

### Order Service (`apps/backend/order-service`)
Microservice managing the complete lifecycle of customer orders, order placement, order status transitions, and order history records.

### Payment Service (`apps/backend/payment-service`)
Microservice orchestrating online payment processing, third-party payment gateway integration (VNPay), payment verification, and refund requests.

### Shipping Service (`apps/backend/shipping-service`)
Microservice managing shipping providers, shipping rate calculations, package tracking numbers, and delivery status tracking.

### Promotion Service (`apps/backend/promotion-service`)
Microservice managing marketing campaigns, discount codes, vouchers, tier discounts, and promotional rules.

### Search Service (`apps/backend/search-service`)
Microservice handling full-text product search indexing, auto-completion, multi-attribute filtering, and faceted search queries via Elasticsearch.

### Notification Service (`apps/backend/notification-service`)
Microservice responsible for delivering transactional communications (emails via SMTP, push notifications via FCM, SMS, in-app alerts).

### Analytics Service (`apps/backend/analytics-service`)
Microservice processing business metrics, sales telemetry, user behavior logs, and aggregation reports for business intelligence.

### Media Service (`apps/backend/media-service`)
Microservice handling media file uploads, image transformations, object storage uploads (MinIO/R2), and asset CDN links.

---

# 7. Data, Persistence & Storage Terms

### PostgreSQL
The primary enterprise open-source relational database management system used as the system of record for all business domain microservices.

### Prisma ORM
Next-generation TypeScript ORM providing type-safe database queries, schema definition (`schema.prisma`), transaction helpers, and automated migrations (`prisma migrate`).

### Redis
High-performance in-memory key-value data store used for API caching, session storage, rate limiting counters, and pub/sub signaling.

### Elasticsearch
Distributed, JSON-based full-text search engine optimized for fast querying, catalog filtering, auto-complete, and aggregated search results.

### Object Storage
Blob storage system storing unstructured files (product images, user avatars, invoices). Uses **MinIO** in development environments and **Cloudflare R2** in production.

### Connection Pooling
Database connection management technique reusing database connections to prevent exhaustion of backend database connection limits under high request loads.

---

# 8. Messaging & Event-Driven Terms

### RabbitMQ
An open-source message broker implementing AMQP, enabling asynchronous message queuing, exchange-based message routing, and publish-subscribe integration across microservices.

### Advanced Message Queuing Protocol (AMQP)
The open standard wire protocol utilized by RabbitMQ for message delivery, queues, and exchanges.

### Domain Event
An immutable object representing a significant business state change that occurred in a domain service (e.g., `OrderCreated`, `PaymentCompleted`, `InventoryUpdated`).

### Message Exchange
A RabbitMQ routing agent that receives messages published by producers and routes them to binding queues based on routing keys.

### Message Queue
A RabbitMQ buffer storing published messages until consuming microservices process and acknowledge (`ACK`) them.

### Dead Letter Queue (DLQ)
A specialized RabbitMQ queue configured to catch messages that fail consumption retries due to errors or unhandled exceptions.

### Idempotent Consumer
A consumer implementation designed to process incoming domain events safely multiple times without causing duplicate state changes or side effects.

---

# 9. Infrastructure, Edge & DevOps Terms

### Docker
Containerization platform packaging applications and runtime dependencies into isolated container images for predictable execution across environments.

### Container Image
An immutable, executable software package containing application code, runtimes, libraries, and environment settings.

### GitHub Container Registry (GHCR)
The container image registry used by OmniCommerce to store versioned Docker images generated by CI/CD pipelines.

### Nginx
High-performance reverse proxy server and web server handling SSL termination, static asset serving, compression, and HTTP request proxying.

### Cloudflare
Global edge network providing Domain Name System (DNS), Content Delivery Network (CDN), SSL/TLS encryption, Web Application Firewall (WAF), and DDoS protection.

### Cloudflare R2
S3-compatible, zero-egress-fee cloud object storage service used for hosting media files and static assets in production.

### Infrastructure as Code (IaC)
The practice of managing and provisioning computing infrastructure through version-controlled configuration files rather than manual procedures.

### GitHub Actions
CI/CD automation service executing automated workflows for linting, testing, building container images, and deploying services.

---

# 10. Observability & Diagnostics Terms

### Three Pillars of Observability
The comprehensive diagnostic paradigm consisting of **Metrics** (Prometheus), **Logs** (Pino & Loki), and **Traces** (Tempo).

### Prometheus
Time-series metrics collection engine scraping operational metrics (request rate, CPU usage, memory, response latencies) from application `/metrics` endpoints.

### Grafana
Visualization suite rendering real-time dashboards for metrics, centralized log queries, and distributed transaction trace visualization.

### Loki
Log aggregation system designed by Grafana to centralize, index, and query structured application logs across containers efficiently.

### Pino
High-performance, low-overhead structured JSON application logging library standardized across Node.js backend services and BFFs.

### Tempo
Distributed tracing backend storing and querying request trace spans generated across microservice boundaries.

### Correlation ID (`X-Correlation-ID`)
A unique UUID injected into HTTP request headers and propagated through AMQP message headers to trace a single user operation across multiple microservices.

### Health Check Endpoint
A dedicated URL endpoint (`/health`) exposed by services to report operational readiness and liveness to API Gateway and load balancers.

---

# 11. Security & Compliance Terms

### JSON Web Token (JWT)
A compact, URL-safe token format representing cryptographically signed claims used for stateless user authentication across services.

### Access Token
A short-lived JWT token presented by client applications in the `Authorization: Bearer <token>` header to access protected API endpoints.

### Refresh Token
A long-lived, securely stored token presented to refresh expired Access Tokens without requiring users to re-enter credentials.

### Role-Based Access Control (RBAC)
An authorization mechanism granting access rights based on assigned user roles (e.g., `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN`).

### bcrypt
Password hashing function incorporating salt and adaptive work factors to store user passwords securely against brute-force attacks.

### Helmet
Express/NestJS middleware setting HTTP security headers (CSP, HSTS, X-Frame-Options) to mitigate web vulnerabilities.

### Cross-Origin Resource Sharing (CORS)
Security mechanism permitting or restricting resources on a web page to be requested from another domain outside the domain from which the resource originated.

### Rate Limiting
Security technique restricting the maximum number of HTTP requests a client IP or authenticated user can perform within a given time window.

### Zero Trust Architecture
Security framework requiring all users, services, and network requests to be continuously authenticated, authorized, and validated regardless of network location.

---

# 12. Tooling, Monorepo & Development Terms

### pnpm Workspaces
The package manager and workspace engine orchestrating package installation, symlinking, and dependency isolation across monorepo packages.

### Turborepo
High-performance build system for JavaScript/TypeScript monorepos, managing task execution graphs (`pnpm build`, `pnpm test`, `pnpm lint`) with intelligent caching.

### TypeScript
Statically typed superset of JavaScript providing compile-time type checking across applications (`apps/`) and shared libraries (`packages/`).

### Zod
TypeScript-first schema declaration and validation library used for runtime parameter checking, configuration validation, and DTO parsing.

### React Hook Form
Performant, lightweight form management library used in React web applications for managing form state and validation workflows.

### TanStack Query (React Query)
Server state management library for React handling data fetching, background synchronization, response caching, and query mutation workflows.

### Zustand
Small, fast, unopinionated client state management library used for local UI state in React applications.

### ESLint
Static code analysis tool identifying code smells, anti-patterns, style violations, and forbidden imports across TypeScript files.

### Prettier
Opinionated code formatter enforcing uniform code styling across the workspace automatically.

### Husky & lint-staged
Git hook automation tools executing ESLint, Prettier, and type-checking checks exclusively on staged files prior to committing code.

---

# 13. Acronyms & Abbreviations Matrix

| Acronym | Full Name | Primary Context |
|---------|-----------|-----------------|
| **ADR** | Architecture Decision Record | Architecture Governance |
| **AMQP** | Advanced Message Queuing Protocol | Messaging |
| **API** | Application Programming Interface | Software Integration |
| **BFF** | Backend for Frontend | Backend / Orchestration |
| **CDN** | Content Delivery Network | Infrastructure / Edge |
| **CI/CD** | Continuous Integration / Continuous Delivery | DevOps / Automation |
| **CSP** | Content Security Policy | Web Security |
| **DLQ** | Dead Letter Queue | Messaging / Resiliency |
| **DNS** | Domain Name System | Networking |
| **DTO** | Data Transfer Object | API Design / Data |
| **E2E** | End-to-End (Testing) | Quality Assurance |
| **EDA** | Event-Driven Architecture | Architecture Style |
| **GHCR** | GitHub Container Registry | DevOps / Storage |
| **HSTS** | HTTP Strict Transport Security | Web Security |
| **HTTP / HTTPS** | Hypertext Transfer Protocol (Secure) | Networking |
| **JWT** | JSON Web Token | Security / Auth |
| **LTS** | Long-Term Support | Technology Governance |
| **MFE** | Microfrontend | Presentation Layer |
| **ORM** | Object-Relational Mapping | Database / Persistence |
| **RBAC** | Role-Based Access Control | Security / Authorization |
| **REST** | Representational State Transfer | Synchronous APIs |
| **SAD** | Software Architecture Document | Technical Documentation |
| **SDK** | Software Development Kit | Developer Tooling |
| **SEO** | Search Engine Optimization | Web Frontend |
| **SSOT** | Single Source of Truth | Data Management |
| **SSR** | Server-Side Rendering | Web Frontend |
| **TLS** | Transport Layer Security | Network Security |
| **TTL** | Time-To-Live | Caching / Messaging |
| **UI / UX** | User Interface / User Experience | Presentation / Product |
| **WAF** | Web Application Firewall | Edge Security |

---

# 14. References

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - System Architecture Document
- [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md) - Approved Technology Stack & Governance
- [ARCHITECTURE_PRINCIPLES.md](./ARCHITECTURE_PRINCIPLES.md) - Architecture Principles & Standards
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - Microservices Architecture
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Web Presentation Architecture
- [MICROFRONTEND_ARCHITECTURE.md](./MICROFRONTEND_ARCHITECTURE.md) - Module Federation Architecture
