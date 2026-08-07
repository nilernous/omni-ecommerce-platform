# Part 1 — Foundation

---

# 1. Introduction

## 1.1 Purpose

This document defines the **standard architectural blueprint** for the **NestJS API Gateway** service within the OmniCommerce platform.

The API Gateway serves as the single entry point for external client applications (Web Frontends, Mobile Apps, Third-Party Integrations, and BFFs). It acts as an edge proxy that centralizes cross-cutting concerns—such as authentication, authorization, rate limiting, request validation, CORS, SSL termination, and response transformation—before dispatching requests to underlying backend microservices via gRPC or RabbitMQ.

This document standardizes:

- Gateway overall architecture & design philosophy
- Project organization and directory layout
- Configuration management
- Common utilities, constants, decorators, guards, and filters
- Shared infrastructure and microservice client bindings
- Feature module proxying and controller structure
- Request lifecycle and execution pipeline
- Operational guidelines and compliance checklist

---

## 1.2 Scope

This document applies specifically to the **API Gateway** (`gateway` / `api-gateway`) service within the OmniCommerce ecosystem.

It defines how the gateway receives external REST HTTP requests and bridges them to downstream domain microservices, including:

- Authentication Service (`auth-service`)
- User Service (`user-service`)
- Product / Catalog Service (`product-service`)
- Inventory Service (`inventory-service`)
- Cart Service (`cart-service`)
- Order Service (`order-service`)
- Payment Service (`payment-service`)
- Shipping Service (`shipping-service`)
- Promotion / Coupon Service (`promotion-service`)
- Review Service (`review-service`)
- Notification Service (`notification-service`)

This document does not cover internal domain database schemas or microservice internal business logic.

---

## 1.3 Audience

This document is intended for:

- Solution Architects & Tech Leads
- Backend Engineers working on API Gateway endpoints
- Platform & DevOps Engineers maintaining network routing and security
- Frontend & Mobile Developers consuming Gateway REST APIs

---

## 1.4 Objectives

The primary objectives of the API Gateway architecture are to:

- **Single Entry Point**: Expose a unified, secured RESTful API surface to external consumers.
- **Protocol Translation**: Seamlessly translate client HTTP REST requests into microservice RPC calls / RabbitMQ messages.
- **Centralized Edge Security**: Enforce JWT authentication, Role-Based Access Control (RBAC), Permission-Based Access Control (PBAC), and rate limiting at the perimeter.
- **Offload Cross-Cutting Concerns**: Relieve downstream domain services from handling CORS, Swagger generation, client rate limiting, and request payload parsing.
- **High Availability & Low Latency**: Minimize gateway overhead with lightweight request proxying, asynchronous messaging, and Redis caching.

---

## 1.5 Architecture Principles

### Zero Business Logic Invariants in Gateway

The API Gateway must remain **stateless and free of domain business logic**. It coordinates requests, enforces edge rules, and proxies payloads to business microservices.

### Contract-Driven Microservice Client Dispatches

All downstream calls from the gateway to microservices use standardized message pattern tokens (`patterns.constant.ts`), target queue names (`queues.constant.ts`), and client providers (`shared/microservices/`).

### Edge Security Enforcement

No request reaches downstream domain services without passing edge authentication (`jwt.guard.ts`), rate limiting (`throttler.guard.ts`), and permission checks (`roles.guard.ts`, `permissions.guard.ts`), unless explicitly decorated with `@Public()`.

---

# 2. Architecture Goals

## 2.1 Architectural Characteristics

| Characteristic | Standard |
|----------------|----------|
| Architecture Style | API Gateway / Edge Proxy |
| Framework | NestJS |
| Language | TypeScript |
| Transport Protocols | HTTP/REST (Inbound) ➔ RabbitMQ / gRPC (Outbound) |
| Authentication | JWT Bearer Verification |
| Authorization | RBAC (Role-Based) & PBAC (Permission-Based) |
| Abuse Prevention | Throttler (Rate Limiting via Redis) |
| API Documentation | OpenAPI 3.0 / Swagger |
| Scalability | Stateless & Horizontally Scalable |

---

## 2.2 Primary Goals

1. **Request Routing & Proxying**: Map REST HTTP endpoints directly to microservice request patterns.
2. **Unified Edge Authentication**: Validate JWT access tokens once at the gateway and inject authenticated user metadata into execution context (`@CurrentUser()`).
3. **Abuse & Attack Protection**: Apply rate limits per client IP or user ID to prevent Denial of Service (DoS) attacks.
4. **Standardized Responses**: Format all success payloads via `transform.interceptor.ts` and catch all exceptions via `http-exception.filter.ts`.
5. **Interactive Documentation**: Expose a consolidated Swagger UI aggregating endpoints across modules.

---

# Part 2 — Structure & Blueprint

---

# 3. Gateway Directory Structure

## 3.1 Full Directory Tree

Below is the standard, authoritative directory tree that must be followed by the API Gateway service within OmniCommerce:

```text
gateway/
│
├── src/
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── auth.config.ts
│   │   ├── cors.config.ts
│   │   ├── rabbitmq.config.ts
│   │   ├── redis.config.ts
│   │   ├── swagger.config.ts
│   │   ├── throttler.config.ts
│   │   ├── validation.config.ts
│   │   └── index.ts
│   │
│   ├── common/
│   │   │
│   │   ├── constants/
│   │   │   ├── patterns.constant.ts
│   │   │   ├── queues.constant.ts
│   │   │   ├── services.constant.ts
│   │   │   ├── roles.constant.ts
│   │   │   ├── permissions.constant.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── permissions.decorator.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── dto/
│   │   │
│   │   ├── enums/
│   │   │
│   │   ├── exceptions/
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exception.filter.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── permissions.guard.ts
│   │   │   ├── throttler.guard.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/
│   │   │
│   │   ├── pipes/
│   │   │
│   │   ├── interfaces/
│   │   │
│   │   ├── types/
│   │   │
│   │   └── utils/
│   │
│   ├── shared/
│   │   │
│   │   ├── logger/
│   │   ├── cache/
│   │   ├── redis/
│   │   ├── jwt/
│   │   ├── validation/
│   │   ├── health/
│   │   │
│   │   └── microservices/
│   │       ├── clients.module.ts
│   │       ├── clients.providers.ts
│   │       ├── rmq.module.ts
│   │       ├── rmq.service.ts
│   │       └── index.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── services/
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── user/
│   │   ├── product/
│   │   ├── category/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── order/
│   │   ├── payment/
│   │   ├── shipping/
│   │   ├── coupon/
│   │   ├── review/
│   │   ├── notification/
│   │   ├── health/
│   │   └── <module-name>/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env
└── package.json
```

---

## 3.2 Root Configuration & Files

| Item Name | Type | Description |
|-----------|------|-------------|
| `src/` | Directory | Main application source code. |
| `test/` | Directory | End-to-end (E2E) and integration test suites. |
| `.env` | File | Environment variable declarations (port, secrets, broker URLs). |
| `package.json` | File | Project manifest and dependency management. |

---

# 4. Source Code Structure (`src/`)

---

## 4.1 Configuration Directory (`src/config/`)

Centralized strongly-typed configuration modules loaded via `@nestjs/config`.

| Configuration File | Purpose & Settings |
|--------------------|--------------------|
| `app.config.ts` | Host, port, environment name, API prefix (`/api/v1`). |
| `auth.config.ts` | JWT secret keys, access token expiration, refresh token TTL. |
| `cors.config.ts` | Allowed origins, methods, headers, credentials rules. |
| `rabbitmq.config.ts` | RabbitMQ connection URL, exchange topology, queue bindings. |
| `redis.config.ts` | Redis host, port, key prefixes, TTLs for caching & rate limiting. |
| `swagger.config.ts` | OpenAPI documentation path (`/docs`), title, version, Bearer Auth setup. |
| `throttler.config.ts` | Rate limit TTL (seconds) and request limit cap per interval. |
| `validation.config.ts` | Global pipe validation rules (`whitelist`, `transform`, `forbidNonWhitelisted`). |
| `index.ts` | Barrel export aggregating all configuration functions. |

---

## 4.2 Common Directory (`src/common/`)

Cross-cutting system utilities, constants, decorators, filters, guards, and interceptors.

### 4.2.1 Constants (`src/common/constants/`)

- `patterns.constant.ts`: Message pattern string tokens matching downstream microservice message listeners (e.g., `ORDER_CREATE`, `PRODUCT_GET_BY_ID`).
- `queues.constant.ts`: Queue name tokens (e.g., `ORDER_QUEUE`, `PRODUCT_QUEUE`, `AUTH_QUEUE`).
- `services.constant.ts`: Service injection tokens for NestJS ClientProxy injection (e.g., `ORDER_SERVICE_TOKEN`).
- `roles.constant.ts`: User role definitions (`ADMIN`, `CUSTOMER`, `SELLER`).
- `permissions.constant.ts`: Fine-grained permission string keys (`order:create`, `product:delete`).
- `index.ts`: Barrel export file.

### 4.2.2 Decorators (`src/common/decorators/`)

- `current-user.decorator.ts`: Parameter decorator extracting authenticated user object from `ExecutionContext`.
- `public.decorator.ts`: Route decorator marking an endpoint as publicly accessible, bypassing JWT Guard.
- `roles.decorator.ts`: Route decorator attaching required roles to endpoint metadata.
- `permissions.decorator.ts`: Route decorator attaching required permissions to endpoint metadata.
- `index.ts`: Barrel export file.

### 4.2.3 Filters (`src/common/filters/`)

- `http-exception.filter.ts`: Catches HTTP exceptions and formats standard JSON error structures (`statusCode`, `message`, `error`, `timestamp`, `path`).
- `all-exception.filter.ts`: Fallback filter for uncaught exceptions, shielding raw internal errors from clients.

### 4.2.4 Guards (`src/common/guards/`)

- `jwt.guard.ts`: Enforces JWT verification on routes unless marked `@Public()`.
- `roles.guard.ts`: Verifies user roles against `@Roles()` requirements.
- `permissions.guard.ts`: Verifies user permissions against `@Permissions()` requirements.
- `throttler.guard.ts`: Enforces rate limit caps using Redis storage.
- `index.ts`: Barrel export file.

### 4.2.5 Interceptors (`src/common/interceptors/`)

- `logging.interceptor.ts`: Logs HTTP request method, URL, execution time, and response status.
- `timeout.interceptor.ts`: Enforces request timeout thresholds to prevent hung proxy calls.
- `transform.interceptor.ts`: Wraps outgoing response payloads in standard JSON formats (`{ success: true, data: ... }`).
- `index.ts`: Barrel export file.

---

## 4.3 Shared Infrastructure Directory (`src/shared/`)

Reusable infrastructure modules and microservice client binding utilities.

- `logger/`: Pino / NestJS structured logging module.
- `cache/` & `redis/`: Redis client connection management and caching helpers.
- `jwt/`: Token verification and signing service wrappers.
- `validation/`: Cross-cutting schema validation utilities.
- `health/`: Health check indicators for gateway readiness and downstream connectivity.
- `microservices/`:
  - `clients.module.ts`: Registers ClientProxy providers for each downstream microservice.
  - `clients.providers.ts`: Factory definitions creating RabbitMQ / gRPC ClientProxy instances using configuration tokens.
  - `rmq.module.ts`: RabbitMQ module wrapper providing transport options.
  - `rmq.service.ts`: Helper service for creating RabbitMQ options and managing client communication.
  - `index.ts`: Barrel export.

---

## 4.4 Feature Modules (`src/modules/`)

Feature modules in the Gateway are organized by domain area. Each gateway module acts as an HTTP REST adapter that receives client requests and proxies them to downstream microservices via `ClientProxy`.

### Auth Module (`src/modules/auth/`)
Contains authentication-specific gateway logic:
- `controllers/`: Endpoints `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`.
- `dto/`: Login, Register, Refresh Token request/response DTOs.
- `guards/`: Custom auth guards (e.g., Local Auth, Refresh Token Guard).
- `strategies/`: Passport strategies (`jwt.strategy.ts`, `local.strategy.ts`, `refresh.strategy.ts`).
- `services/`: Gateway auth service orchestrating token validation or forwarding to Auth Microservice.
- `auth.module.ts`: Auth module declaration.

### Business Domain Gateway Modules (`src/modules/`)
Each domain gateway module contains controllers and DTOs for client-facing REST APIs:
- `user/`: User profile management endpoints.
- `product/`: Catalog browsing, product searching, and creation endpoints.
- `category/`: Category hierarchy endpoints.
- `inventory/`: Stock lookup and reservation proxy endpoints.
- `cart/`: Shopping cart item management endpoints.
- `order/`: Order placement, tracking, and cancellation endpoints.
- `payment/`: Payment gateway checkout and webhook handling endpoints.
- `shipping/`: Delivery calculation and tracking endpoints.
- `coupon/`: Discount promotion and voucher endpoints.
- `review/`: Product rating and comment endpoints.
- `notification/`: User notification preference and broadcast endpoints.
- `health/`: Consolidated system health endpoint `/health`.
- `<module-name>/`: Standard placeholder structure for new gateway feature modules.

---

## 4.5 Root Files (`src/app.module.ts` & `src/main.ts`)

- `app.module.ts`: Root module importing `ConfigModule`, `SharedModule` (Logger, Redis, Health, Microservices), and all feature modules. Applies global guards (`JwtGuard`, `RolesGuard`, `PermissionsGuard`, `ThrottlerGuard`) via NestJS provider bindings.
- `main.ts`: Application bootstrap entry point. Configures CORS, Helmet security headers, global pipes (`ValidationPipe`), global exception filters, global interceptors, and Swagger documentation at `/docs`.

---

# Part 3 — Governance & Guidelines

---

# 5. Execution Pipeline & Routing Flow

## 5.1 Request Execution Lifecycle

```text
HTTP Request (Client)
     │
     ▼
[CORS & Helmet Security Middleware]
     │
     ▼
[Logging Interceptor (Start)]
     │
     ▼
[Throttler Guard (Rate Limit)] ────── Fail ───► [429 Too Many Requests]
     │
     ▼
[JWT Guard] ───────────────────────── Fail ───► [401 Unauthorized]
     │
     ▼
[Roles & Permissions Guards] ──────── Fail ───► [403 Forbidden]
     │
     ▼
[Global Validation Pipe] ──────────── Fail ───► [400 Bad Request]
     │
     ▼
[Gateway Controller (e.g., OrderController)]
     │
     ▼
[RMQ ClientProxy / Microservice Dispatch]
     │
     ▼
Downstream Microservice Processing (RabbitMQ / gRPC)
     │
     ▼
[Transform Interceptor (Format JSON Payload)]
     │
     ▼
HTTP Response (Client)
```

---

# 6. Summary & Checklist for Gateway Development

When creating or modifying gateway endpoints in OmniCommerce:

- [ ] Directory structure strictly adheres to the blueprint tree defined in **Section 3.1**.
- [ ] Centralized configuration settings reside in `src/config/`.
- [ ] Route constants (`patterns.constant.ts`, `queues.constant.ts`, `services.constant.ts`) are used for microservice client calls.
- [ ] Routes are protected by default via `JwtGuard`; public routes are explicitly annotated with `@Public()`.
- [ ] Endpoints requiring specific privileges use `@Roles()` or `@Permissions()` decorators.
- [ ] Client request payloads are validated using strong class-validator DTOs.
- [ ] Controller methods forward requests to downstream microservices using `ClientProxy` (`send` for Request-Response, `emit` for Event publishing).
- [ ] Gateway controllers contain zero direct database access or persistent domain logic.
