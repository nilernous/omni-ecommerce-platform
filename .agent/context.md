# OmniCommerce System Context & Architectural Guidelines

> **Target File:** `.agent/context.md`  
> **Source:** [SYSTEM_ARCHITECTURE.md](../docs/01-overview/SYSTEM_ARCHITECTURE.md)  
> **Purpose:** Agent reference guide for system architecture, monorepo organization, technical stack, and design boundaries.

---

## 1. Project Overview & Architectural Style

**OmniCommerce** is a cloud-native, enterprise-grade e-commerce platform designed with a multi-client distributed ecosystem. It supports Web (Customer, Admin, Seller) and Mobile (Flutter) clients driven by a decoupled backend microservices architecture.

### Primary Architectural Patterns
- **Monorepo Architecture:** Centralized codebase containing all applications, shared packages, infrastructure configurations, and technical documentation.
- **Microservice Architecture:** Independent, domain-oriented backend services owning their business logic and persistent data.
- **Microfrontend Architecture:** Modular frontend user interfaces loaded host-side via Module Federation in a Shell application.
- **Backend for Frontend (BFF):** Dedicated aggregation layer translating client-specific requirements to downstream services.
- **API Gateway Pattern:** Unified entry point for centralized security, JWT authentication, rate limiting, and request routing.
- **Event-Driven Architecture (EDA):** Asynchronous message broadcasting for decoupled business workflow execution.

---

## 2. Core Architecture Principles

1. **Domain-Oriented Design:** Services and packages are bounded by business capabilities, not technical layers.
2. **Separation of Concerns:** Rigid segregation between Client UI, BFF composition, Gateway routing, Business logic, Data storage, and Infrastructure.
3. **Loose Coupling & High Cohesion:** Services communicate via public REST APIs and asynchronous events—never direct database coupling.
4. **API-First Development:** Contracts (DTOs, OpenAPI, events) are established before implementation.
5. **Independent Deployability:** Each app inside `apps/` is independently versioned, built, and deployed.
6. **Shared Engineering Standards:** Unified TypeScript/ESLint configs, standardized logging, validation schemas, and common UI components.
7. **Security & Observability by Design:** JWT authentication, RBAC, HTTPS everywhere, correlation IDs, structured logging (Pino/Loki), and distributed tracing (Tempo).

---

## 3. High-Level Layer Architecture & Boundaries

```
[ Client Layer ]          Customer Web | Admin Portal | Seller Portal | Flutter Mobile
       │
[ Edge Layer ]            Cloudflare (CDN / WAF / DDoS) → Nginx (Reverse Proxy)
       │
[ Presentation Layer ]    Shell Application + Microfrontends (Module Federation)
       │
[ BFF Layer ]             Customer BFF | Admin BFF | Seller BFF
       │
[ API Gateway Layer ]     Request Routing / Rate Limiting / Token Validation
       │
[ Business Layer ]        Microservices (Auth, Product, Order, Inventory, Payment, etc.)
       │
[ Data & Event Layer ]    PostgreSQL | Redis | Elasticsearch | MinIO/R2 | RabbitMQ
       │
[ Infra & Observability ] Docker | Prometheus | Grafana | Loki | Tempo
```

### Layer Communication Rules

| From Layer | To Layer | Allowed? |
| :--- | :--- | :---: |
| Client | Edge | ✅ |
| Edge | Presentation / Client | ✅ |
| Presentation / Client | BFF | ✅ |
| BFF | API Gateway | ✅ |
| API Gateway | Business Microservices | ✅ |
| Microservice | Data Stores (DB, Redis, ES, Storage) | ✅ (Owned Stores Only) |
| Microservice | RabbitMQ (Event Publish/Subscribe) | ✅ |
| Microservice | Other Microservice (REST/Events) | ✅ |

#### Strictly Prohibited Interactions:
- ❌ **Client / Presentation** directly accessing Database, Redis, or RabbitMQ.
- ❌ **Presentation** direct call to core Microservices (must go through BFF).
- ❌ **BFF** directly accessing Database or persistent data layers.
- ❌ **API Gateway** directly executing domain business logic or accessing databases.
- ❌ **Microservice** querying another Microservice's database directly.

---

## 4. Repository Structure Map

```text
omnicommerce/
├── apps/                        # Independently deployable applications
│   ├── frontend/                # Web Microfrontends & Shell App
│   │   ├── shell/               # Host application (Bootstrap, Layout, Auth, Theme)
│   │   └── [modules]/           # Microfrontends (catalog, cart, checkout, orders, etc.)
│   ├── mobile/                  # Flutter application
│   │   └── flutter/             # Native Android/iOS Flutter codebase
│   ├── bff/                     # Backend for Frontend applications
│   │   ├── customer-bff/        # Tailored APIs for Customer Web & Flutter Mobile
│   │   ├── admin-bff/           # Tailored APIs for Admin Portal & Reporting
│   │   └── seller-bff/          # Tailored APIs for Merchant Store Operations
│   └── backend/                 # Core Microservices (NestJS)
│       ├── api-gateway/         # Central API Gateway
│       ├── auth-service/        # Authentication & Identity
│       ├── user-service/        # User Profile Management
│       ├── product-service/     # Product Catalog & Categories
│       ├── inventory-service/   # Warehouse Stock & Reservations
│       ├── cart-service/        # Shopping Cart Operations
│       ├── order-service/       # Order Lifecycle Management
│       ├── payment-service/     # Payment Processing & Gateway Integrations
│       ├── shipping-service/    # Fulfillment & Carrier Shipping
│       ├── promotion-service/   # Vouchers & Discounts
│       ├── search-service/      # Elasticsearch Product Indexing & Querying
│       ├── notification-service/# Email, Push & In-App Notifications
│       ├── analytics-service/   # Business Intelligence & Metrics
│       └── media-service/       # Image & Media Asset Uploads
│
├── packages/                    # Shared reusable libraries (Non-deployable)
│   ├── auth/                    # Shared Auth utilities, JWT helpers & RBAC
│   ├── config/                  # Shared environment & client configs
│   ├── constants/               # System enums, error codes, and header constants
│   ├── database/                # Base DB connection helpers & clients
│   ├── dto/                     # Shared Request/Response DTO contracts
│   ├── events/                  # Event schemas for RabbitMQ messaging
│   ├── logger/                  # Pino logger factory & correlation tracing
│   ├── sdk/                     # Service API client SDKs
│   ├── types/                   # Shared TypeScript definitions
│   ├── ui/                      # React Design System (Shadcn / Tailwind)
│   ├── utils/                   # Shared helpers (date, slug, uuid, currency)
│   ├── validation/              # Zod validation schemas
│   ├── eslint-config/           # Monorepo ESLint configurations
│   └── tsconfig/                # Monorepo TypeScript configurations
│
├── infra/                       # Docker, Kubernetes, Nginx & Monitoring setup
├── docs/                        # SADs, ADRs, and technical documentation
└── scripts/                     # Automation, build, database, and dev scripts
```

---

## 5. Summary Technology Stack

| Layer | Primary Technology | Details / Tooling |
| :--- | :--- | :--- |
| **Web Frontend** | React 19 + Next.js | Module Federation, Tailwind CSS, Shadcn UI, Zustand, TanStack Query |
| **Mobile App** | Flutter (Dart) | Riverpod (State), Dio (HTTP), GoRouter |
| **Backend Services** | NestJS (TypeScript) | Microservice Architecture, REST API, RxJS |
| **API Gateway & BFF** | NestJS | JWT validation, client response composition |
| **Relational Database** | PostgreSQL | Primary transactional relational storage |
| **Cache & In-Memory** | Redis | Session cache, rate limiting, temporary data |
| **Search Engine** | Elasticsearch | Product catalog search & full-text indexing |
| **Object Storage** | MinIO (Dev) / Cloudflare R2 (Prod) | Asset and media file storage |
| **Message Broker** | RabbitMQ | Asynchronous domain events (e.g., `OrderCreated`) |
| **Observability** | Prometheus, Grafana, Loki, Pino, Tempo | Metrics, dashboards, structured logs, correlation tracing |
| **Containers & Ops** | Docker, Nginx, Cloudflare | Containerization, reverse proxying, CDN & DDoS protection |

---

## 6. Developer & Agent Operational Guidelines

When generating code, modifying existing services, or creating new components in this monorepo:

1. **Preserve Monorepo Boundaries:**
   - Keep shared logic in `packages/`. Do not duplicate types, DTOs, or utilities across apps.
   - Do not import code directly between microservices; communicate via `packages/sdk`, REST, or `packages/events`.
2. **Follow Type Safety & Validation:**
   - Define contracts using `packages/dto` and validate incoming payloads with `packages/validation` (Zod).
3. **Respect Framework Standards:**
   - Web frontend uses React 19 / Next.js with Tailwind & Shadcn.
   - Mobile uses Flutter with Riverpod.
   - Backend services use NestJS microservices modules with Pino logging.
4. **Refer to Specific SAD Documents for Deep Dives:**
   - Detailed domain specifics are maintained under `docs/01-overview/` and domain SADs (`FRONTEND_ARCHITECTURE.md`, `BACKEND_ARCHITECTURE.md`, `MOBILE_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md`, `DEPLOYMENT_ARCHITECTURE.md`).
