# OmniCommerce Project Map & Repository Navigation Guide

> **Target File:** `.agent/project-map.md`  
> **Source Documents:** [SYSTEM_ARCHITECTURE.md](../docs/01-overview/SYSTEM_ARCHITECTURE.md), [BACKEND_ARCHITECTURE.md](../docs/02-backend/BACKEND_ARCHITECTURE.md), [FRONTEND_ARCHITECTURE.md](../docs/03-frontend/FRONTEND_ARCHITECTURE.md), [DEPLOYMENT_ARCHITECTURE.md](../docs/04-infrastructure/DEPLOYMENT_ARCHITECTURE.md), [API_ARCHITECTURE.md](../docs/02-backend/API_ARCHITECTURE.md), [GLOSSARY.md](../docs/01-overview/GLOSSARY.md)  
> **Purpose:** Master repository navigation guide, directory map, application/package index, service topology, API mapping, and infrastructure layout for AI Agents.  
> **Version:** 1.0.0  
> **Last Updated:** July 2026  

---

## Document Information

| Item | Description |
|---|---|
| **Project** | OmniCommerce |
| **Document Type** | Repository Navigation Guide & Project Map for AI Agents |
| **Scope** | Platform-Wide (`apps/`, `packages/`, `infra/`, `docs/`, `.agent/`) |
| **Related Agent Files** | [context.md](./context.md), [technology-stack.md](./technology-stack.md), [glossary.md](./glossary.md) |
| **Core Specs** | [SYSTEM_ARCHITECTURE.md](../docs/01-overview/SYSTEM_ARCHITECTURE.md), [BACKEND_ARCHITECTURE.md](../docs/02-backend/BACKEND_ARCHITECTURE.md), [FRONTEND_ARCHITECTURE.md](../docs/03-frontend/FRONTEND_ARCHITECTURE.md), [DEPLOYMENT_ARCHITECTURE.md](../docs/04-infrastructure/DEPLOYMENT_ARCHITECTURE.md), [API_ARCHITECTURE.md](../docs/02-backend/API_ARCHITECTURE.md), [GLOSSARY.md](../docs/01-overview/GLOSSARY.md) |

---

## Table of Contents

- [1. Executive Summary \& Navigation Rules for Agents](#1-executive-summary--navigation-rules-for-agents)
- [2. Full Monorepo Directory Tree](#2-full-monorepo-directory-tree)
- [3. Applications Index (`apps/`)](#3-applications-index-apps)
  - [3.1 Frontend Web Applications (`apps/frontend/`)](#31-frontend-web-applications-appsfrontend)
  - [3.2 Mobile Application (`apps/mobile/`)](#32-mobile-application-appsmobile)
  - [3.3 Backend for Frontend Applications (`apps/bff/`)](#33-backend-for-frontend-applications-appsbff)
  - [3.4 API Gateway \& Backend Microservices (`apps/backend/`)](#34-api-gateway--backend-microservices-appsbackend)
- [4. Shared Packages Index (`packages/`)](#4-shared-packages-index-packages)
- [5. Infrastructure \& DevOps Layout (`infra/`)](#5-infrastructure--devops-layout-infra)
- [6. Documentation Structure Map (`docs/`)](#6-documentation-structure-map-docs)
- [7. Service Topology, Network Ports \& Gateway Routes](#7-service-topology-network-ports--gateway-routes)
- [8. Layer Interactions \& Boundary Rules](#8-layer-interactions--boundary-rules)
- [9. Feature-to-File Location Matrix for AI Agents](#9-feature-to-file-location-matrix-for-ai-agents)

---

## 1. Executive Summary & Navigation Rules for Agents

This document serves as the **definitive codebase map** for AI Agents operating within the **OmniCommerce** repository. OmniCommerce is organized as a **pnpm + Turborepo monorepo** containing independently deployable applications, shared packages, infrastructure manifests, and architectural documentation.

### Core Workspace Rules for Agents

1. **Workspace Boundary:** All application code resides in `apps/`, shared code in `packages/`, infrastructure in `infra/`, documentation in `docs/`, and AI agent guides in `.agent/`.
2. **Package Boundaries:** Never write application-specific code inside `packages/`. Shared packages must remain domain-agnostic or expose pure, reusable interfaces.
3. **Import Boundaries:** Applications MUST NOT directly import source files from other applications (e.g., `import from '../../apps/backend/src'`). Shared logic must be exported from a package in `packages/`.
4. **Database per Service:** Each microservice inside `apps/backend/` owns its persistence schema. Never write code in Service A that directly queries or modifies Service B's database.
5. **API First & Contract Driven:** When modifying APIs, update DTO contracts in `packages/dto/` and OpenAPI annotations first before updating controllers or frontend consumers.

---

## 2. Full Monorepo Directory Tree

```text
omnicommerce/
├── .agent/                      # AI Agent Context, Rules & Navigation Guides
│   ├── README.md                # Overview of agent guides
│   ├── context.md               # System architecture & core rules guide
│   ├── technology-stack.md      # Approved tech stack & matrix guide
│   ├── glossary.md              # Technical lexicon & domain terms guide
│   └── project-map.md           # Master directory & navigation map (this file)
│
├── apps/                        # Deployable applications & microservices
│   ├── frontend/                # Web Microfrontends & Next.js applications
│   │   ├── shell/               # Main Host Shell App (Module Federation Container)
│   │   ├── customer/            # Customer Web Application & Remotes
│   │   ├── admin/               # Admin Management Portal & Remotes
│   │   └── seller/              # Seller Store Management Portal & Remotes
│   ├── mobile/                  # Native Mobile Application
│   │   └── flutter/             # Flutter codebase for iOS & Android
│   ├── bff/                     # Backend for Frontend API aggregation apps
│   │   ├── customer-bff/        # Tailored APIs for Customer Web & Mobile App
│   │   ├── admin-bff/           # Tailored APIs for Admin Management Portal
│   │   └── seller-bff/          # Tailored APIs for Merchant Seller Portal
│   └── backend/                 # API Gateway & Core Microservices (NestJS)
│       ├── api-gateway/         # Edge Request Routing & Rate Limiting Gateway
│       ├── auth-service/        # Identity, JWT Tokens & Authentication
│       ├── user-service/        # User Profiles, Addresses & Roles
│       ├── product-service/     # Product Catalog, Categories & Brands
│       ├── inventory-service/   # Warehouse Stock & Reservations
│       ├── cart-service/        # Active Shopping Carts & Guest Carts
│       ├── order-service/       # Order Lifecycle & State Machine
│       ├── payment-service/     # Gateway Integrations & Transactions
│       ├── shipping-service/    # Fulfillment, Rates & Tracking
│       ├── promotion-service/   # Coupons, Discounts & Campaigns
│       ├── review-service/      # Product Ratings & Customer Reviews
│       ├── media-service/       # Image/File Uploads & CDN Assets
│       ├── search-service/      # Catalog Search Indexing (Elasticsearch)
│       ├── notification-service/# Email, SMS & Mobile Push Notifications
│       └── analytics-service/   # Metrics Aggregation & Reporting
│
├── packages/                    # Shared workspace NPM packages & libraries
│   ├── auth/                    # JWT verification, RBAC guards & passport strategies
│   ├── config/                  # Centralized env, database, redis & RabbitMQ configs
│   ├── constants/               # Global roles, permissions, error codes & event names
│   ├── database/                # Prisma ORM clients, base models & migration scripts
│   ├── dto/                     # Shared request/response DTOs & validation classes
│   ├── events/                  # AMQP event schemas, publisher & consumer contracts
│   ├── logger/                  # Pino structured JSON logger & correlation ID middleware
│   ├── sdk/                     # Typed HTTP API client SDKs for frontend/mobile
│   ├── types/                   # Shared TypeScript type definitions & interfaces
│   ├── ui/                      # React UI Component Library & Design System
│   ├── utils/                   # Shared helpers (date, formatters, slugifiers, UUID)
│   ├── validation/              # Shared Zod schemas & validator decorators
│   ├── eslint-config/           # Monorepo ESLint governance rules
│   └── tsconfig/                # Base TypeScript compiler options (`tsconfig.base.json`)
│
├── infra/                       # Infrastructure, DevOps & Container Deployment
│   ├── docker/                  # Dockerfiles & Docker Compose (Local / Dev / Staging)
│   ├── k8s/                     # Kubernetes manifests, Helm charts & ingress configs
│   ├── nginx/                   # Reverse proxy configuration & SSL termination
│   ├── monitoring/              # Prometheus, Grafana, Loki & Tempo configurations
│   └── scripts/                 # Seed scripts, migration runners & deployment scripts
│
└── docs/                        # Formal System Architecture Specifications
    ├── 01-overview/             # High-level architecture, principles, tech stack & glossary
    ├── 02-backend/              # Backend, API, database, cache, search & event specs
    ├── 03-frontend/             # Frontend, microfrontends, components & motion specs
    └── 04-infrastructure/       # Deployment, container, network & K8s specifications
```

---

## 3. Applications Index (`apps/`)

### 3.1 Frontend Web Applications (`apps/frontend/`)

The web presentation layer is built with **React** and **Next.js** following a **Microfrontend Architecture** using Webpack/Rspack **Module Federation**.

| Application Name | Directory Path | Architecture Pattern | Port | Description / Key Modules |
|---|---|---|---|---|
| **Shell App** | `apps/frontend/shell/` | Host Container | `3050` | Main application shell, global navigation, user session context, global layout, theme provider, and dynamic remote MFE router. |
| **Customer Web** | `apps/frontend/customer/` | Remote Microfrontend | `3051` | Customer-facing storefront exposing remotes: product catalog, search, shopping cart, checkout flow, user profile, and order tracking. |
| **Admin Portal** | `apps/frontend/admin/` | Remote Microfrontend | `3052` | Internal admin dashboard exposing remotes: product management, inventory control, order management, customer support, and system analytics. |
| **Seller Portal** | `apps/frontend/seller/` | Remote Microfrontend | `3053` | Merchant-facing web portal exposing remotes: store dashboard, catalog publishing, inventory tracking, order fulfillment, and revenue reports. |

### 3.2 Mobile Application (`apps/mobile/`)

| Application Name | Directory Path | Framework / Tech | Description |
|---|---|---|---|
| **Flutter Mobile App** | `apps/mobile/flutter/` | Flutter (Dart) | Cross-platform native mobile application for iOS and Android delivering product browsing, push notifications, cart, checkout, order tracking, and account management. |

### 3.3 Backend for Frontend Applications (`apps/bff/`)

BFF applications aggregate downstream microservice APIs into client-optimized responses. Built with **NestJS**.

| BFF Application | Directory Path | Primary Clients Supported | Port | Responsibilities |
|---|---|---|---|---|
| **Customer BFF** | `apps/bff/customer-bff/` | Customer Web (`:3051`), Flutter Mobile | `4001` | Tailored APIs for shopping experience: product detail composition, cart calculations, multi-step checkout orchestration, customer auth sessions. |
| **Admin BFF** | `apps/bff/admin-bff/` | Admin Portal (`:3052`) | `4002` | Tailored APIs for administration: aggregated metrics dashboards, multi-service management requests, bulk operations, reporting APIs. |
| **Seller BFF** | `apps/bff/seller-bff/` | Seller Portal (`:3053`) | `4003` | Tailored APIs for merchants: store catalog publishing, merchant order processing, revenue reporting, store profile settings. |

### 3.4 API Gateway & Backend Microservices (`apps/backend/`)

All microservices are implemented using **NestJS**, operating as independent domain-bounded units.

| Service Name | Directory Path | Default Port | Primary Data Store | Primary Domain Responsibility |
|---|---|---|---|---|
| **API Gateway** | `apps/backend/api-gateway/` | `3000` | Redis (Rate Limits) | Central entry point, public routing, SSL, JWT verification, rate limiting, correlation ID injection. |
| **Auth Service** | `apps/backend/auth-service/` | `3001` | PostgreSQL + Redis | Identity management, user registration, JWT issue/refresh, OAuth2, password hashing, session revocation. |
| **User Service** | `apps/backend/user-service/` | `3002` | PostgreSQL | User profiles, shipping addresses, customer preferences, RBAC role definitions. |
| **Product Service** | `apps/backend/product-service/` | `3003` | PostgreSQL | Master product catalog, SKU management, categories, brands, product variants, attributes. |
| **Inventory Service**| `apps/backend/inventory-service/` | `3004` | PostgreSQL + Redis | Stock levels across warehouses, stock reservations during checkout, safety stock alerts. |
| **Cart Service** | `apps/backend/cart-service/` | `3005` | Redis | Active shopping cart items, guest cart persistence, quantity modifications, cart TTL. |
| **Order Service** | `apps/backend/order-service/` | `3006` | PostgreSQL | Order creation, state machine transitions (Pending, Paid, Shipped, Delivered, Cancelled). |
| **Payment Service** | `apps/backend/payment-service/` | `3007` | PostgreSQL | Payment gateway integrations (Stripe, PayPal), transaction logs, refund processing, webhooks. |
| **Shipping Service** | `apps/backend/shipping-service/` | `3008` | PostgreSQL | Carrier integrations, shipment generation, tracking numbers, shipping rate calculation. |
| **Promotion Service**| `apps/backend/promotion-service/` | `3009` | PostgreSQL + Redis | Discount codes, flash sale rules, promotional campaigns, voucher validation. |
| **Review Service** | `apps/backend/review-service/` | `3010` | PostgreSQL | Product ratings, customer review submission, review moderation, rating aggregates. |
| **Media Service** | `apps/backend/media-service/` | `3011` | MinIO / Cloudflare R2 | Image & video upload processing, thumbnail generation, CDN asset URL delivery. |
| **Search Service** | `apps/backend/search-service/` | `3012` | Elasticsearch | Full-text product search indexing, autocomplete, facet filters, search sync from Product Service. |
| **Notification** | `apps/backend/notification-service/` | `3013` | Redis (Queue) | Email delivery (Nodemailer), SMS gateway, Firebase Cloud Messaging (FCM) mobile push alerts. |
| **Analytics Service**| `apps/backend/analytics-service/` | `3014` | PostgreSQL (TimescaleDB) | Event metrics aggregation, sales reports, user conversion tracking, system usage telemetry. |

---

## 4. Shared Packages Index (`packages/`)

Packages are managed through **pnpm workspaces** and exported under the `@omnicommerce/*` namespace.

```text
packages/
├── auth/            # @omnicommerce/auth          -> JWT helpers, Passport strategies, RBAC guards
├── config/          # @omnicommerce/config        -> Environment variables, Redis, DB & AMQP configs
├── constants/       # @omnicommerce/constants     -> Global enums, roles, status codes, header keys
├── database/        # @omnicommerce/database      -> Prisma schema, client instances, base repository
├── dto/             # @omnicommerce/dto           -> Type-safe request DTOs & response schemas
├── events/          # @omnicommerce/events        -> AMQP RabbitMQ domain event payload contracts
├── logger/          # @omnicommerce/logger        -> Pino JSON logging instance & OpenTelemetry trace setup
├── sdk/             # @omnicommerce/sdk           -> Typed API Client SDK for Web and Flutter integration
├── types/           # @omnicommerce/types         -> Common TypeScript interfaces & generic utility types
├── ui/              # @omnicommerce/ui            -> Shared React component library & Design System
├── utils/           # @omnicommerce/utils         -> General helper utilities (formatting, date, math)
├── validation/      # @omnicommerce/validation    -> Zod schemas & custom class-validator decorators
├── eslint-config/   # @omnicommerce/eslint-config -> Shared ESLint linting configurations
└── tsconfig/        # @omnicommerce/tsconfig      -> Shared tsconfig.json extensions
```

### Package Consumption Matrix

| Package | Used By Apps/Services | Key Exports |
|---|---|---|
| `packages/auth` | API Gateway, BFFs, Backend Services | `JwtAuthGuard`, `RolesGuard`, `PermissionsDecorator`, `tokenUtils` |
| `packages/config` | All Backend Apps & BFFs | `getDatabaseConfig()`, `getRedisConfig()`, `getRabbitMQConfig()` |
| `packages/constants` | Workspace-Wide | `USER_ROLES`, `ORDER_STATUS`, `HTTP_HEADER_KEYS`, `ERROR_CODES` |
| `packages/database` | Backend Services | `PrismaService`, `BaseRepository`, Prisma Client models |
| `packages/dto` | BFFs, Microservices, SDK | `CreateOrderDto`, `ProductFilterDto`, `StandardApiResponseDto` |
| `packages/events` | Microservices, Event Bus | `OrderCreatedEvent`, `PaymentCompletedEvent`, `EventPublisher` |
| `packages/logger` | Workspace-Wide | `PinoLogger`, `CorrelationIdMiddleware`, `TraceInterceptor` |
| `packages/sdk` | Web Frontends, Flutter Mobile | `OmniCustomerClient`, `OmniAdminClient`, `OmniSellerClient` |
| `packages/ui` | Customer, Admin, Seller Web | `<Button />`, `<Modal />`, `<Table />`, `<InputField />`, `<ThemeProvider />` |

---

## 5. Infrastructure & DevOps Layout (`infra/`)

The infrastructure layer provisions local development dependencies, containerized runtime environments, and cloud deployment manifests.

```text
infra/
├── docker/
│   ├── docker-compose.yml       # Local development services (Postgres, Redis, RabbitMQ, ES, MinIO)
│   ├── docker-compose.infra.yml # Observability stack (Prometheus, Grafana, Loki, Tempo)
│   ├── Dockerfile.gateway       # Production container build for API Gateway
│   ├── Dockerfile.bff           # Multi-stage container build for BFF applications
│   └── Dockerfile.service       # Standardized multi-stage container build for NestJS microservices
│
├── k8s/                         # Kubernetes deployment manifests
│   ├── base/                    # Kustomize base deployment & service manifests
│   ├── overlays/
│   │   ├── staging/             # Staging environment configs & resource limits
│   │   └── production/          # Production environment configs & ingress manifests
│   └── helm/                    # Helm charts for custom infrastructure orchestration
│
├── nginx/
│   ├── nginx.conf               # Edge reverse proxy configuration
│   └── conf.d/
│       ├── gateway.conf         # Public domain routing to API Gateway
│       └── mfe.conf             # Static asset and MFE remote module routing
│
├── monitoring/
│   ├── prometheus.yml           # Metrics scraping targets & interval rules
│   ├── grafana/                 # Pre-configured Grafana dashboards (JVM/Node, HTTP, RabbitMQ)
│   ├── loki/                    # Loki log ingestion configuration
│   └── tempo/                   # OpenTelemetry distributed trace collector setup
│
└── scripts/
    ├── dev-setup.sh             # One-command developer bootstrap script
    ├── db-seed.ts               # Database master seeding script
    └── migration-runner.ts      # Automated multi-service database migration executor
```

---

## 6. Documentation Structure Map (`docs/`)

The repository contains formal, detailed software specifications under `docs/`:

```text
docs/
├── 01-overview/
│   ├── SYSTEM_ARCHITECTURE.md   # Master Software Architecture Document (SAD)
│   ├── ARCHITECTURE_PRINCIPLES.md # 10 Core Architecture Principles & Design Boundary Rules
│   ├── TECHNOLOGY_STACK.md      # Approved Tech Stack Matrix, Versioning & Rationale
│   └── GLOSSARY.md              # Architectural Lexicon & Technical Dictionary
│
├── 02-backend/
│   ├── BACKEND_ARCHITECTURE.md  # Backend Microservices & Topology Specification
│   ├── API_ARCHITECTURE.md      # API Gateway, BFF Contracts, REST Standards & Envelopes
│   ├── DATABASE_ARCHITECTURE.md # Database per Service, Schemas, ORM & Replication
│   ├── CACHE_ARCHITECTURE.md    # Redis Caching Patterns, TTL Strategy & Eviction Policy
│   ├── EVENT_ARCHITECTURE.md    # RabbitMQ AMQP Topology, Event Schemas & DLQ Strategy
│   ├── FILE_STORAGE_ARCHITECTURE.md # MinIO / S3 Object Storage & CDN Architecture
│   ├── SEARCH_ARCHITECTURE.md   # Elasticsearch Indexing & Sync Architecture
│   └── CONFIGURATION_ARCHITECTURE.md # Environment Variables & Vault Secret Management
│
├── 03-frontend/
│   ├── FRONTEND_ARCHITECTURE.md # Web Presentation Layer & Next.js Architecture
│   ├── MICROFRONTEND_ARCHITECTURE.md # Shell Host, Module Federation & Remote Modules
│   ├── COMPONENT_ARCHITECTURE.md # Design System, Component Trees & Atomic Structure
│   ├── DESIGN_SYSTEM.md         # UI Tokens, Color Palette, Typography & Layout Rules
│   ├── MOTION_ARCHITECTURE.md    # Framer Motion & CSS Animation Standard
│   ├── ROUTING_ARCHITECTURE.md  # App Router, MFE Dynamic Routes & Auth Navigation
│   └── STATE_MANAGEMENT.md      # Zustand (Client State) & React Query (Server State)
│
└── 04-infrastructure/
    └── DEPLOYMENT_ARCHITECTURE.md # Docker, Kubernetes, Network Topology & CI/CD Pipelines
```

---

## 7. Service Topology, Network Ports & Gateway Routes

| Component / Service | Type | Path | Port | Public / Gateway Route | Dependent Storage / Broker |
|---|---|---|---|---|---|
| **Nginx Reverse Proxy** | Reverse Proxy | `infra/nginx/` | `80 / 443` | `https://api.omnicommerce.com` | N/A |
| **API Gateway** | Gateway | `apps/backend/api-gateway/` | `3000` | `/api/v1/*` | Redis (`6379`) |
| **Customer BFF** | BFF | `apps/bff/customer-bff/` | `4001` | `/api/v1/customer/*` | Microservices |
| **Admin BFF** | BFF | `apps/bff/admin-bff/` | `4002` | `/api/v1/admin/*` | Microservices |
| **Seller BFF** | BFF | `apps/bff/seller-bff/` | `4003` | `/api/v1/seller/*` | Microservices |
| **Auth Service** | Microservice | `apps/backend/auth-service/` | `3001` | `/api/v1/auth/*` | PostgreSQL, Redis |
| **User Service** | Microservice | `apps/backend/user-service/` | `3002` | `/api/v1/users/*` | PostgreSQL |
| **Product Service** | Microservice | `apps/backend/product-service/` | `3003` | `/api/v1/products/*` | PostgreSQL |
| **Inventory Service**| Microservice | `apps/backend/inventory-service/` | `3004` | `/api/v1/inventory/*` | PostgreSQL, Redis |
| **Cart Service** | Microservice | `apps/backend/cart-service/` | `3005` | `/api/v1/cart/*` | Redis (`6379`) |
| **Order Service** | Microservice | `apps/backend/order-service/` | `3006` | `/api/v1/orders/*` | PostgreSQL, RabbitMQ |
| **Payment Service** | Microservice | `apps/backend/payment-service/` | `3007` | `/api/v1/payments/*` | PostgreSQL, RabbitMQ |
| **Shipping Service** | Microservice | `apps/backend/shipping-service/` | `3008` | `/api/v1/shipping/*` | PostgreSQL, RabbitMQ |
| **Promotion Service**| Microservice | `apps/backend/promotion-service/` | `3009` | `/api/v1/promotions/*` | PostgreSQL, Redis |
| **Review Service** | Microservice | `apps/backend/review-service/` | `3010` | `/api/v1/reviews/*` | PostgreSQL |
| **Media Service** | Microservice | `apps/backend/media-service/` | `3011` | `/api/v1/media/*` | MinIO / S3 (`9000`) |
| **Search Service** | Microservice | `apps/backend/search-service/` | `3012` | `/api/v1/search/*` | Elasticsearch (`9200`) |
| **Notification** | Microservice | `apps/backend/notification-service/` | `3013` | Internal AMQP | Redis, RabbitMQ |
| **Analytics Service**| Microservice | `apps/backend/analytics-service/` | `3014` | `/api/v1/analytics/*` | TimescaleDB |

---

## 8. Layer Interactions & Boundary Rules

### High-Level Request Flow Map

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER                                                                     │
│  - Customer Web (:3051)   - Admin Portal (:3052)   - Seller Portal (:3053)       │
│  - Flutter Mobile App (Android / iOS)                                           │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ HTTP(S) / REST / JSON
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ EDGE LAYER                                                                       │
│  - Cloudflare CDN / WAF -> Nginx Reverse Proxy (:80 / :443)                      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Forward Request
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (Web)                                                         │
│  - Shell Host App (:3050) dynamic loading of Module Federation Remotes           │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ API Request
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ BACKEND FOR FRONTEND (BFF) LAYER                                                 │
│  - Customer BFF (:4001)   - Admin BFF (:4002)   - Seller BFF (:4003)            │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ API Aggregation & Delegation
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ API GATEWAY LAYER                                                                │
│  - API Gateway (:3000): JWT Authentication, Rate Limiting, Correlation ID        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Synchronous HTTP/REST Calls
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ BUSINESS MICROSERVICES LAYER                                                     │
│  - Auth, User, Product, Inventory, Cart, Order, Payment, Shipping, Search, etc.  │
└───────────────────┬──────────────────────────────────────────┬───────────────────┘
                    │                                          │
    Owned DB Access │ (SQL / Redis / ES)        AMQP Events    │ (RabbitMQ :5672)
                    ▼                                          ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────────┐
│ PERSISTENCE & STORAGE LAYER           │  │ ASYNCHRONOUS MESSAGING BROKER         │
│  - PostgreSQL  - Redis  - ES  - S3   │  │  - RabbitMQ Domain Event Bus          │
└───────────────────────────────────────┘  └───────────────────────────────────────┘
```

### Strict Layer Interaction Governance

- **Allowed:** `Client` -> `BFF` -> `API Gateway` -> `Microservice` -> `Owned Database`.
- **Allowed:** `Microservice` -> `RabbitMQ Event Bus` -> `Subscribing Microservice`.
- **Prohibited:** `Client / Web` directly calling internal Microservice APIs (bypassing BFF/Gateway).
- **Prohibited:** `BFF` directly accessing PostgreSQL / Redis / Elasticsearch databases.
- **Prohibited:** `Microservice A` directly querying `Microservice B`'s database.

---

## 9. Feature-to-File Location Matrix for AI Agents

Use this reference table to immediately locate target files when performing common engineering tasks:

| Engineering Goal / Task | Primary Target Directory / File | Secondary Packages / Files |
|---|---|---|
| **Add a new REST API endpoint to a Microservice** | `apps/backend/[service]/src/controllers/` | `packages/dto/src/`, `apps/backend/[service]/src/services/` |
| **Add or update an API contract DTO** | `packages/dto/src/[domain]/` | `packages/dto/src/index.ts` |
| **Modify API Gateway routing or rate limit rules** | `apps/backend/api-gateway/src/routes/` | `apps/backend/api-gateway/src/guards/` |
| **Create or update a Backend for Frontend (BFF) API** | `apps/bff/[client]-bff/src/` | `packages/sdk/src/` |
| **Modify database models or add a migration** | `packages/database/prisma/schema.prisma` | `packages/database/src/` |
| **Publish or consume a new RabbitMQ AMQP event** | `packages/events/src/events/[domain]/` | `apps/backend/[service]/src/events/` |
| **Create or modify a React UI Component** | `packages/ui/src/components/` | `apps/frontend/[app]/src/components/` |
| **Add a new Microfrontend (MFE) remote route** | `apps/frontend/[app]/src/pages/` or `app/` | `apps/frontend/shell/src/remotes.d.ts` |
| **Add a new mobile screen or state feature** | `apps/mobile/flutter/lib/features/` | `apps/mobile/flutter/lib/core/` |
| **Update global roles, permissions, or error codes** | `packages/constants/src/` | `packages/auth/src/` |
| **Configure environment variables or app configs** | `packages/config/src/` | `.env.example` |
| **Modify Docker Compose or local dev setup** | `infra/docker/docker-compose.yml` | `infra/docker/` |
| **Modify Kubernetes deployment manifests** | `infra/k8s/base/` or `overlays/` | `infra/k8s/` |
| **Update system architectural specs** | `docs/` | `.agent/` |

---
