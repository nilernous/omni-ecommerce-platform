# API Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** API Software Architecture Document (ASAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | API Layer (Gateway, BFF, Microservice REST APIs) |
| Architecture Style | RESTful APIs + Backend for Frontend (BFF) + API Gateway |
| Primary Framework | NestJS (TypeScript) |
| Data Transfer Format | JSON (Application/json) |
| Communication | Synchronous HTTP/REST (Async via RabbitMQ documented in `EVENT_ARCHITECTURE.md`) |
| Audience | Frontend Engineers, Backend Engineers, API Designers, QA Engineers, Security Engineers |

---

# Table of Contents

1. Introduction
   1.1 Purpose  
   1.2 Scope  
   1.3 Intended Audience  
   1.4 Design Goals  
2. API Architectural Overview
   2.1 Overview  
   2.2 API Gateway Pattern  
   2.3 Backend for Frontend (BFF) Pattern  
   2.4 Microservices API Topology  
   2.5 High-Level API Request Flow  
3. API Design Principles & Standards
   3.1 RESTful Resource Design  
   3.2 Resource Naming Conventions  
   3.3 HTTP Methods & Semantics  
   3.4 Standard HTTP Status Codes  
   3.5 Idempotency Standards  
   3.6 Hypermedia & HATEOAS Policy  
4. Request & Response Specifications
   4.1 Response Format Philosophy  
   4.2 Standard Success Response Envelope  
   4.3 Standard Paginated Response Structure  
   4.4 Standard Error Response Structure  
   4.5 Standard HTTP Headers  
5. API Versioning Strategy
   5.1 Versioning Scheme  
   5.2 Breaking vs. Non-Breaking Changes  
   5.3 API Deprecation & Sunset Lifecycle  
6. API Gateway Routing & Cross-Cutting Policies
   6.1 Routing Architecture & Path Rules  
   6.2 Gateway Middleware Pipeline  
   6.3 Rate Limiting Strategy  
   6.4 Circuit Breaker & Resiliency  
7. Backend for Frontend (BFF) API Contracts
   7.1 Customer BFF API Contracts  
   7.2 Admin BFF API Contracts  
   7.3 Seller BFF API Contracts  
8. Core Microservice API Specifications
   8.1 Auth Service API  
   8.2 User Service API  
   8.3 Product Service API  
   8.4 Inventory Service API  
   8.5 Cart Service API  
   8.6 Order Service API  
   8.7 Payment Service API  
   8.8 Shipping Service API  
   8.9 Promotion Service API  
   8.10 Review Service API  
   8.11 Media Service API  
   8.12 Search Service API  
   8.13 Notification Service API  
   8.14 Analytics Service API  
9. Authentication & Security Model
   9.1 Bearer Token Authentication  
   9.2 Role-Based Access Control (RBAC) & Scopes  
   9.3 Resource Ownership Authorization  
   9.4 Input Validation & Injection Prevention  
10. NestJS Request Execution Pipeline
    10.1 Middleware, Guards, Interceptors, Pipes, Filters Flow  
    10.2 Global ValidationPipe Standard  
    10.3 Global ExceptionFilter Standard  
11. API Documentation & OpenAPI Standards
    11.1 OpenAPI / Swagger Specification  
    11.2 Contract Testing & Postman Collections  
12. Observability & Telemetry Standards
    12.1 Correlation ID Propagation  
    12.2 OpenTelemetry Distributed Tracing  
    12.3 API Telemetry Metrics  
13. Architecture Decision Summary
14. Related Documents
15. Conclusion

---

# 1. Introduction

## 1.1 Purpose

This document defines the comprehensive **API Architecture** for the OmniCommerce platform.

Its primary objective is to establish strict API standards, endpoint contracts, gateway routing rules, client-tailored BFF interfaces, security policies, and error formats across all backend services. 

By defining standardized interfaces before and during implementation, this specification ensures seamless frontend-backend integration, consistent developer experience, predictable payload structures, and high system reliability.

---

## 1.2 Scope

This document covers all synchronous application programming interfaces (APIs) within OmniCommerce, including:

- **API Gateway Layer**: Public edge routing, rate limiting, and global request validation.
- **Backend for Frontend (BFF) Layer**: Aggregated and transformed endpoints tailored for Customer Web/Mobile, Admin Portal, and Seller Portal.
- **Business Microservice APIs**: Domain-specific RESTful APIs across all 14 backend microservices.
- **API Standards & Conventions**: Naming rules, HTTP method usage, response envelopes, pagination models, and error schemas.
- **Security & Authorization**: JWT token handling, RBAC scope validation, and resource ownership checks.
- **Observability**: Request correlation, header propagation, and API metrics collection.

The following topics are intentionally excluded:

- Asynchronous message broker topologies and event schemas (see `EVENT_ARCHITECTURE.md`).
- Relational schema modeling and database DDL (see `DATABASE_ARCHITECTURE.md`).
- Frontend UI state management and component code (see `FRONTEND_ARCHITECTURE.md`).
- Infrastructure configuration and CI/CD pipelines (see `DEPLOYMENT_ARCHITECTURE.md`).

---

## 1.3 Intended Audience

This document is designed for:

- **Backend Engineers & NestJS Developers**: For building API controllers, DTOs, request pipes, and inter-service HTTP clients.
- **Frontend Engineers (Web & Flutter)**: For consuming BFF endpoints and handling standard request/response envelopes and error codes.
- **Software Architects**: For reviewing system boundary compliance and contract stability.
- **QA & Automation Engineers**: For crafting API integration tests, contract tests, and end-to-end suite validations.

---

## 1.4 Design Goals

The OmniCommerce API layer is engineered according to six core design goals:

### Consistency
All API endpoints follow unified naming conventions, HTTP verb semantics, pagination structures, and error response envelopes regardless of the underlying microservice.

### Developer Experience (DX)
Clear, self-describing RESTful endpoints accompanied by OpenAPI (Swagger 3.0) specifications enable frontend developers to integrate quickly with minimal friction.

### High Performance & Efficiency
Client-specific Backend for Frontend (BFF) layers aggregate multiple internal microservice calls into single network roundtrips, reducing payload over-fetching and mobile latency.

### Security by Default
Centralized token validation, strict CORS rules, rate limiting, role-based access control (RBAC), and automated input sanitization prevent common security vulnerabilities at the API boundary.

### Backward Compatibility & Evolution
Clear URI versioning and explicit deprecation headers (`Deprecation`, `Sunset`) allow backend services to evolve without breaking active client applications.

### Observability & Traceability
Every API request carries a mandatory Correlation ID (`X-Correlation-ID`) propagated through Gateway, BFF, microservices, and log telemetry to allow end-to-end tracing.

---

# 2. API Architectural Overview

## 2.1 Overview

OmniCommerce implements a multi-tiered API architecture designed to decouple public client interfaces from internal microservice implementations.

```text
 Client Layer                 API Gateway & BFF Layer            Business Microservices Layer
┌──────────────┐             ┌─────────────────────────┐          ┌───────────────────────────┐
│ Customer Web │────────────►│ Customer BFF            │─┐        │ Auth Service              │
└──────────────┘             └─────────────────────────┘ │        └───────────────────────────┘
┌──────────────┐             ┌─────────────────────────┐ │        ┌───────────────────────────┐
│ Flutter App  │────────────►│ Customer BFF            │ │        │ User Service              │
└──────────────┘             └─────────────────────────┘ │        └───────────────────────────┘
┌──────────────┐             ┌─────────────────────────┐ │        ┌───────────────────────────┐
│ Admin Web    │────────────►│ Admin BFF               │ │        │ Product Service           │
└──────────────┘             └─────────────────────────┘ ├───────►└───────────────────────────┘
┌──────────────┐             ┌─────────────────────────┐ │        ┌───────────────────────────┐
│ Seller Web   │────────────►│ Seller BFF              │ │        │ Order Service             │
└──────────────┘             └─────────────────────────┘ │        └───────────────────────────┘
                                                         │        ┌───────────────────────────┐
                                                         ├───────►│ Inventory Service         │
                                                         │        └───────────────────────────┘
                                                         │        ┌───────────────────────────┐
                                                         │        │ Payment / Shipping / Etc. │
                                                         └───────►└───────────────────────────┘
```

---

## 2.2 API Gateway Pattern

The **API Gateway** serves as the single public entry point (reverse proxy) for all incoming client HTTP requests.

### Core Gateway Capabilities
- **Unified Domain Entry**: Exposes single public endpoints (e.g., `https://api.omnicommerce.com`).
- **Path-Based Request Routing**: Routes requests to specific BFFs or direct microservices.
- **Global Rate Limiting**: Protects downstream microservices from DDoS and brute force attacks.
- **Cross-Cutting Security**: Validates JWT signatures and enforces TLS 1.3.
- **Correlation ID Injection**: Generates UUIDv4 correlation IDs if missing from request headers.

---

## 2.3 Backend for Frontend (BFF) Pattern

Client applications differ significantly in network bandwidth, user roles, screen sizes, and data requirements. OmniCommerce employs dedicated BFF microservices to serve distinct application types:

1. **Customer BFF (`/api/v1/customer`)**:
   - Tailored for Customer Web & Flutter Mobile apps.
   - Aggregates Product catalog, Cart, Promotions, and Shipping estimations into unified mobile-optimized payloads.
   - Reduces over-fetching and mobile battery/data overhead.

2. **Admin BFF (`/api/v1/admin`)**:
   - Tailored for internal management dashboards.
   - Provides rich analytics aggregations, multi-tenant user administration, inventory controls, and platform audit logs.

3. **Seller BFF (`/api/v1/seller`)**:
   - Tailored for merchant store administration.
   - Exposes merchant store operations, order fulfillment pipelines, payout metrics, and product management.

---

## 2.4 Microservices API Topology

Behind the Gateway and BFF layers, business capabilities are encapsulated into 14 stateless NestJS microservices.

- Each microservice exposes internal RESTful APIs consumed by BFFs or sibling microservices.
- Microservices strictly adhere to **Database per Service** principles.
- Direct cross-microservice database queries or shared ORM entities are explicitly prohibited.

---

## 2.5 High-Level API Request Flow

```text
Client Application
       │
       │ 1. HTTP GET /api/v1/customer/products/checkout-summary (Bearer JWT, X-Correlation-ID)
       ▼
  API Gateway
       │
       │ 2. Validate TLS, Rate Limit, Verify JWT signature, Inject X-Correlation-ID
       ▼
  Customer BFF
       │
       ├───► 3a. REST GET /api/v1/cart (Cart Service)
       ├───► 3b. REST POST /api/v1/inventory/check-stock (Inventory Service)
       └───► 3c. REST POST /api/v1/promotions/preview (Promotion Service)
       │
       │ 4. Aggregate & Transform Responses into Customer Checkout Payload
       ▼
Client Application (Unified 200 OK Response Envelope)
```

---

# 3. API Design Principles & Standards

## 3.1 RESTful Resource Design

OmniCommerce APIs are designed around **resources** rather than actions or RPC methods. A resource is a business entity (e.g., `product`, `order`, `user`) identified by a unique URI.

- URIs represent **nouns** (resources), never verbs.
- HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) define the **action** performed on the resource.
- Plural nouns are strictly used for resource collection endpoints (e.g., `/products`, not `/product`).

---

## 3.2 Resource Naming Conventions

All API paths, query parameters, payload keys, and response fields must follow standardized casing conventions:

| Element | Casing Convention | Example |
|---------|------------------|---------|
| **URI Path Segments** | `kebab-case` | `/api/v1/product-categories/featured-items` |
| **Query Parameters** | `camelCase` | `?page=1&limit=20&sortBy=createdAt&sortOrder=desc` |
| **JSON Payload Keys** | `camelCase` | `{ "firstName": "John", "shippingAddressId": "uuid" }` |
| **HTTP Request Headers** | `Train-Case` | `X-Correlation-ID`, `X-Client-Version` |
| **Database/Event Fields** | `snake_case` (Internal) | Converted to `camelCase` at API boundary by NestJS interceptors |

---

## 3.3 HTTP Methods & Semantics

API endpoints must strictly comply with standard HTTP method semantics:

| Method | Idempotent | Safe | Primary Usage | Standard Success Status |
|--------|------------|------|---------------|------------------------|
| `GET` | Yes | Yes | Retrieve a resource or collection | `200 OK` |
| `POST` | No | No | Create a new resource or initiate an operation | `201 Created` / `200 OK` |
| `PUT` | Yes | No | Replace an entire resource definition | `200 OK` |
| `PATCH` | No | No | Partially update attributes of a resource | `200 OK` |
| `DELETE` | Yes | No | Delete a resource by identifier | `200 OK` / `204 No Content` |

---

## 3.4 Standard HTTP Status Codes

OmniCommerce microservices return explicit, semantic HTTP status codes:

### 2xx Success
- `200 OK`: Request succeeded. Returned for read operations, updates (`PUT`/`PATCH`), and deletions.
- `201 Created`: Resource successfully created. Returned for `POST` creation requests.
- `204 No Content`: Request succeeded but response contains no body (e.g., standard `DELETE`).

### 4xx Client Errors
- `400 Bad Request`: Payload/query validation failure, malformed JSON, or syntax errors.
- `401 Unauthorized`: Missing, invalid, or expired Access Token.
- `403 Forbidden`: Authenticated user lacks required role/permission scope.
- `404 Not Found`: Requested resource or endpoint path does not exist.
- `409 Conflict`: Resource state conflict (e.g., duplicate email registration, concurrent stock update conflict).
- `422 Unprocessable Entity`: Business logic rule violation (e.g., insufficient account balance, expired coupon).
- `429 Too Many Requests`: Rate limit threshold exceeded.

### 5xx Server Errors
- `500 Internal Server Error`: Unhandled server exception or unexpected failure.
- `502 Bad Gateway`: Gateway or BFF failed to receive valid response from upstream microservice.
- `503 Service Unavailable`: Downstream microservice temporarily unavailable or undergoing maintenance.
- `504 Gateway Timeout`: Upstream service request timed out.

---

## 3.5 Idempotency Standards

Operations that modify system state must prevent duplicate execution when retried by clients due to network drops.

- **Idempotency Keys**: Critical mutation requests (e.g., `POST /api/v1/payments/process`, `POST /api/v1/orders`) support an optional `Idempotency-Key: <UUIDv4>` header.
- **Cache Window**: Idempotency keys are cached in Redis for 24 hours. Duplicate requests with the identical key return the original response payload instantly without re-executing business logic.

---

## 3.6 Hypermedia & HATEOAS Policy

While OmniCommerce does not require strict HATEOAS for all microservice internal APIs, public BFF endpoints for paginated lists and multi-step workflows (e.g., Checkout pipeline) must include hypermedia action links (`links` object) to guide client state transitions.

---

# 4. Request & Response Specifications

## 4.1 Response Format Philosophy

All API endpoints must return standardized JSON response envelopes. Unhandled raw string or non-enveloped arrays are strictly prohibited at the API boundary.

---

## 4.2 Standard Success Response Envelope

Every successful API response (HTTP 2xx) follows this structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": {
    "id": "prd_987654321",
    "name": "Wireless Noise-Canceling Headphones",
    "sku": "AUD-WNC-001",
    "price": 299.99,
    "currency": "USD",
    "status": "ACTIVE"
  },
  "meta": {
    "timestamp": "2026-07-27T14:54:00.000Z",
    "path": "/api/v1/customer/products/prd_987654321",
    "correlationId": "c8f2a1b0-4d5e-4f6a-8b9c-0d1e2f3a4b5c"
  }
}
```

---

## 4.3 Standard Paginated Response Structure

Collection endpoints (`GET /api/v1/products`, `GET /api/v1/orders`) require structured pagination meta tags:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products collection retrieved successfully",
  "data": [
    {
      "id": "prd_001",
      "name": "Mechanical Keyboard",
      "price": 149.00
    },
    {
      "id": "prd_002",
      "name": "Ergonomic Gaming Mouse",
      "price": 79.99
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 154,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "timestamp": "2026-07-27T14:54:00.000Z",
    "path": "/api/v1/customer/products",
    "correlationId": "c8f2a1b0-4d5e-4f6a-8b9c-0d1e2f3a4b5c"
  },
  "links": {
    "self": "/api/v1/customer/products?page=1&limit=20",
    "next": "/api/v1/customer/products?page=2&limit=20",
    "prev": null,
    "first": "/api/v1/customer/products?page=1&limit=20",
    "last": "/api/v1/customer/products?page=8&limit=20"
  }
}
```

---

## 4.4 Standard Error Response Structure

All failed requests (HTTP 4xx/5xx) return a standardized error schema generated by the global NestJS `ExceptionFilter`:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed for request payload",
  "details": [
    {
      "field": "email",
      "issue": "email must be a valid email address"
    },
    {
      "field": "password",
      "issue": "password must be longer than or equal to 8 characters"
    }
  ],
  "meta": {
    "timestamp": "2026-07-27T14:54:00.000Z",
    "path": "/api/v1/auth/register",
    "correlationId": "c8f2a1b0-4d5e-4f6a-8b9c-0d1e2f3a4b5c"
  }
}
```

---

## 4.5 Standard HTTP Headers

### Incoming Request Headers

| Header Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| `Authorization` | Yes (Protected) | Bearer Access Token | `Bearer eyJhbGciOiJKV1Qi...` |
| `Content-Type` | Yes (Body requests)| Payload encoding | `application/json` |
| `X-Correlation-ID` | Recommended | Unique client request identifier | `c8f2a1b0-4d5e-4f6a-8b9c-0d1e2f3a4b5c` |
| `X-Client-ID` | Yes | Client type identifier | `customer-web`, `flutter-mobile` |
| `X-Client-Version` | Recommended | Client application version | `1.4.2` |
| `Accept-Language` | Optional | Locale selection for localized strings | `en-US`, `vi-VN` |
| `Idempotency-Key` | Optional (Mutations)| Unique token to ensure single execution | `uuid-v4-string` |

### Outgoing Response Headers

| Header Name | Description | Example |
|-------------|-------------|---------|
| `X-Correlation-ID` | Mirrored correlation ID for tracing | `c8f2a1b0-4d5e-4f6a-8b9c-0d1e2f3a4b5c` |
| `RateLimit-Limit` | Maximum allowed requests per window | `100` |
| `RateLimit-Remaining` | Remaining requests in current window | `94` |
| `RateLimit-Reset` | Time in seconds until rate limit resets | `42` |

---

# 5. API Versioning Strategy

## 5.1 Versioning Scheme

OmniCommerce uses **URI Path Versioning** for all external public APIs and BFF endpoints.

- **URL Format**: `/api/v{major_version}/{domain_or_bff}/{resource}`
- **Current Active Version**: `v1` (e.g., `/api/v1/customer/products`, `/api/v1/auth/login`).

---

## 5.2 Breaking vs. Non-Breaking Changes

### Non-Breaking Changes (Minor Update - No Version Bump Required)
- Adding new optional query parameters or headers.
- Adding new fields to response payloads.
- Adding new endpoints to existing resources.

### Breaking Changes (Major Update - Requires `/v2/` Endpoint Bump)
- Removing or renaming an existing endpoint URI.
- Removing or renaming fields in JSON request/response payloads.
- Changing data types of payload fields (e.g., `string` to `number`).
- Adding new mandatory validation constraints to existing payload fields.

---

## 5.3 API Deprecation & Sunset Lifecycle

When an API version or endpoint is scheduled for retirement, backend microservices must inject standard IETF deprecation headers into responses:

```text
HTTP/1.1 200 OK
Deprecation: @1785196800
Sunset: Sun, 01 Nov 2026 00:00:00 GMT
Link: <https://developer.omnicommerce.com/docs/migration/v2>; rel="deprecation"
```

- **Deprecation Grace Period**: Active client applications are granted a minimum **6-month notice** before deprecated endpoints are decommissioned.

---

# 6. API Gateway Routing & Cross-Cutting Policies

## 6.1 Routing Architecture & Path Rules

The API Gateway routes incoming HTTP requests to their corresponding destination services according to uniform prefix rules:

| Ingress Path Pattern | Target Upstream Service | Public / Auth Required |
|----------------------|-------------------------|------------------------|
| `/api/v1/auth/*` | Auth Service | Public (Select Protected) |
| `/api/v1/customer/*` | Customer BFF | Mix (Public reads / Protected writes)|
| `/api/v1/admin/*` | Admin BFF | Protected (`ADMIN`, `SUPER_ADMIN`)|
| `/api/v1/seller/*` | Seller BFF | Protected (`SELLER`)|
| `/api/v1/media/*` | Media Service | Protected |
| `/health` | API Gateway Health Check | Public |

---

## 6.2 Gateway Middleware Pipeline

Every incoming HTTP request traverses the following sequential gateway pipeline:

```text
Request ──► TLS Termination ──► Rate Limiter ──► Cors Guard ──► Correlation ID Injector ──► JWT Validator ──► Reverse Proxy Forward
```

---

## 6.3 Rate Limiting Strategy

Rate limiting is enforced at the Gateway using Redis sliding window counters:

| Client Tier | Rate Limit Window | Max Requests | Exceeded Status |
|-------------|-------------------|--------------|-----------------|
| **Anonymous Public APIs** | 1 Minute | 60 requests / IP | `429 Too Many Requests` |
| **Authenticated Customer** | 1 Minute | 300 requests / User ID | `429 Too Many Requests` |
| **Authenticated Seller** | 1 Minute | 600 requests / User ID | `429 Too Many Requests` |
| **Authenticated Admin** | 1 Minute | 1200 requests / User ID | `429 Too Many Requests` |
| **Auth Login Endpoint** | 1 Minute | 10 requests / IP | `429 Too Many Requests` |

---

## 6.4 Circuit Breaker & Resiliency

To prevent cascade failures across business services, inter-service API calls and gateway routings use **Circuit Breakers** (via Resilience4j / NestJS Axios interceptors):

- **Failure Rate Threshold**: 50% failed responses over a 10-second window triggers Circuit Open.
- **Open Circuit Behavior**: Returns immediate `503 Service Unavailable` with `Retry-After: 30`.
- **Half-Open Evaluation**: Retries 5 requests after 30 seconds to test service recovery.

---

# 7. Backend for Frontend (BFF) API Contracts

## 7.1 Customer BFF API Contracts

Base Route: `/api/v1/customer`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/products` | Search/browse catalog with filters, categories, and pagination | Public |
| `GET` | `/products/{id}` | Get unified product detail, inventory status, and reviews | Public |
| `GET` | `/cart` | Retrieve customer active cart with current prices | Customer |
| `POST` | `/cart/items` | Add item to cart | Customer |
| `PATCH` | `/cart/items/{itemId}` | Update item quantity | Customer |
| `DELETE` | `/cart/items/{itemId}` | Remove item from cart | Customer |
| `POST` | `/checkout/preview` | Estimate order totals, tax, shipping, and coupon discounts | Customer |
| `POST` | `/checkout/place-order` | Place order (orchestrates cart, inventory, order, payment) | Customer |
| `GET` | `/orders` | List customer order history | Customer |
| `GET` | `/orders/{id}` | Get detailed order tracking timeline and items | Customer |
| `GET` | `/profile` | Get customer profile & delivery addresses | Customer |

---

## 7.2 Admin BFF API Contracts

Base Route: `/api/v1/admin`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard/metrics` | Retrieve platform sales summary, revenue, & active users | Admin |
| `GET` | `/users` | List and search all platform user accounts | Admin |
| `PATCH` | `/users/{id}/status` | Block/unblock user account or modify roles | Admin |
| `GET` | `/products/approvals` | List merchant product submission queue | Admin |
| `POST` | `/products/{id}/approve` | Approve/reject seller product listing | Admin |
| `GET` | `/orders` | Platform-wide order monitoring & dispute lookup | Admin |
| `POST` | `/payments/{id}/refund` | Trigger administrative payment refund | Admin |

---

## 7.3 Seller BFF API Contracts

Base Route: `/api/v1/seller`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/store/profile` | Get seller store configuration and settings | Seller |
| `GET` | `/products` | List seller catalog items with stock status | Seller |
| `POST` | `/products` | Create new seller product submission | Seller |
| `PUT` | `/products/{id}` | Update product information | Seller |
| `GET` | `/orders` | List seller store fulfillment orders | Seller |
| `POST` | `/orders/{id}/fulfill` | Update shipping status and carrier tracking number | Seller |
| `GET` | `/analytics/sales` | Retrieve store revenue and item performance analytics | Seller |

---

# 8. Core Microservice API Specifications

## 8.1 Auth Service API

Base Route: `/api/v1/auth`

```text
POST /register           - Customer/Seller Registration
POST /login              - Authenticate Credentials & Issue Tokens
POST /refresh-token      - Rotate Access & Refresh Tokens
POST /logout             - Revoke Active Session
POST /forgot-password    - Trigger Password Reset Email
POST /reset-password     - Submit Password Reset Token
GET  /me                 - Get Current Authenticated Identity
```

---

## 8.2 User Service API

Base Route: `/api/v1/users`

```text
GET    /profile          - Get Detailed User Profile
PATCH  /profile          - Update Profile Attributes
GET    /addresses        - List Delivery Addresses
POST   /addresses        - Create Delivery Address
PUT    /addresses/{id}   - Update Address Details
DELETE /addresses/{id}   - Remove Address
PATCH  /preferences      - Update User Notification Preferences
```

---

## 8.3 Product Service API

Base Route: `/api/v1/products`

```text
GET    /                 - List Products (Filters, Search Params)
GET    /{id}             - Get Product by Identifier or Slug
POST   /                 - Create Product Listing (Seller/Admin)
PUT    /{id}             - Update Product Specification
DELETE /{id}             - Soft-delete Product
GET    /categories       - List Product Categories Tree
POST   /categories       - Create Product Category (Admin)
GET    /brands           - List Product Brands
```

---

## 8.4 Inventory Service API

Base Route: `/api/v1/inventory`

```text
GET  /stock/{sku}          - Get Current Stock Balance
POST /reserve              - Reserve Stock Items for Checkout
POST /release              - Release Expired Stock Reservation
POST /adjust               - Warehouse Manual Stock Adjustment
GET  /warehouses           - List Warehouses
```

---

## 8.5 Cart Service API

Base Route: `/api/v1/cart`

```text
GET    /                   - Retrieve Active Shopping Cart
POST   /items              - Add Item to Cart
PATCH  /items/{id}         - Update Item Quantity
DELETE /items/{id}         - Remove Item
DELETE /                   - Clear Entire Cart
```

---

## 8.6 Order Service API

Base Route: `/api/v1/orders`

```text
POST /                      - Create Order from Checkout Cart
GET  /                      - List User/Seller Orders
GET  /{id}                  - Get Order Details & Items
POST /{id}/cancel           - Cancel Pending Order
GET  /{id}/timeline         - Retrieve Order Lifecycle Audit Log
```

---

## 8.7 Payment Service API

Base Route: `/api/v1/payments`

```text
POST /process               - Process Credit Card / Gateway Payment
POST /verify                - Webhook Verification Callback
GET  /transactions/{id}     - Retrieve Transaction Receipt
POST /refunds               - Process Full/Partial Order Refund
```

---

## 8.8 Shipping Service API

Base Route: `/api/v1/shipping`

```text
POST /calculate-rate        - Calculate Shipping Rates & Delivery Time
POST /shipments             - Create Carrier Shipping Label
GET  /shipments/{id}/track  - Fetch Real-time Delivery Carrier Tracking
```

---

## 8.9 Promotion Service API

Base Route: `/api/v1/promotions`

```text
POST /coupons/validate      - Validate & Preview Coupon Discount Code
GET  /campaigns             - List Active Marketing Promotions
POST /flash-sales           - Create Flash Sale Event (Admin)
```

---

## 8.10 Review Service API

Base Route: `/api/v1/reviews`

```text
GET  /products/{productId}  - List Product Reviews & Rating Summary
POST /products/{productId}  - Post Product Customer Review
POST /{id}/moderate         - Moderate Review Content (Admin)
```

---

## 8.11 Media Service API

Base Route: `/api/v1/media`

```text
POST /upload                - Upload Image / File (Multipart/form-data)
GET  /{id}/metadata         - Retrieve File Metadata
DELETE /{id}                - Delete Uploaded File Asset
```

---

## 8.12 Search Service API

Base Route: `/api/v1/search`

```text
GET /products               - Elasticsearch Full-text Product Search
GET /suggestions            - Auto-complete Query Suggestions
```

---

## 8.13 Notification Service API

Base Route: `/api/v1/notifications`

```text
GET  /                      - List User In-App Notifications
PATCH/{id}/read             - Mark Notification as Read
POST /send-test             - Send Test Email/SMS (Admin)
```

---

## 8.14 Analytics Service API

Base Route: `/api/v1/analytics`

```text
GET /sales-summary          - Retrieve Platform Sales Analytics
GET /top-products           - Fetch Best Selling Product Metrics
```

---

# 9. Authentication & Security Model

## 9.1 Bearer Token Authentication

Public client requests to protected endpoints must transmit an HTTP `Authorization` header containing a valid **JSON Web Token (JWT)**:

```text
Authorization: Bearer eyJhbGciOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### JWT Payload Contents

```json
{
  "sub": "usr_9988776655",
  "email": "customer@example.com",
  "roles": ["CUSTOMER"],
  "permissions": ["order:create", "order:read", "cart:write"],
  "iss": "omnicommerce-auth-service",
  "iat": 1785168000,
  "exp": 1785171600
}
```

- **Access Token TTL**: 1 hour (3600 seconds).
- **Refresh Token TTL**: 7 days (stored securely in HttpOnly cookies or encrypted storage).

---

## 9.2 Role-Based Access Control (RBAC) & Scope Mapping

Access control is enforced at both the API Gateway / BFF layer (route level) and within microservices using NestJS `@Roles()` decorators and `RolesGuard`:

| User Role | Default Permissions & Scopes |
|-----------|------------------------------|
| `CUSTOMER` | `profile:self`, `cart:*`, `order:create`, `order:read_self`, `review:create` |
| `SELLER` | `store:self`, `product:create`, `product:update_self`, `order:read_store`, `shipping:fulfill` |
| `ADMIN` | `product:approve`, `user:read`, `user:block`, `order:read_all`, `payment:refund` |
| `SUPER_ADMIN` | `*` (Full unrestricted platform administrative permissions) |

---

## 9.3 Resource Ownership Authorization

Role checks alone are insufficient for tenant security. Microservice controllers validate resource ownership before returning data:

```typescript
// Example Ownership Guard logic in Order Controller
if (user.role !== 'ADMIN' && order.customerId !== user.id) {
  throw new ForbiddenException('You are not authorized to view this order');
}
```

---

## 9.4 Input Validation & Injection Prevention

To protect against SQL injection, NoSQL injection, and Cross-Site Scripting (XSS):

- All incoming request DTOs are validated using `class-validator` and `class-transformer`.
- NestJS controllers utilize strict `ValidationPipe` configurations to strip non-whitelisted payload properties automatically.

---

# 10. NestJS Request Execution Pipeline

## 10.1 Execution Pipeline Order

Every incoming HTTP request passing into a NestJS microservice executes through a deterministic pipeline:

```text
Incoming Request
       │
       ▼
 1. Middleware (Logging, CORS, Request Body Parsing)
       │
       ▼
 2. Guards (JwtAuthGuard ──► RolesGuard)
       │
       ▼
 3. Interceptors (Pre-controller: Logging, Tracing Start)
       │
       ▼
 4. Pipes (ValidationPipe: DTO Transformation & Constraints)
       │
       ▼
 5. Controller Handler (Execution of Use Case Business Logic)
       │
       ▼
 6. Interceptors (Post-controller: Response Envelope Formatting)
       │
       ▼
 7. Exception Filters (Global HttpExceptionFilter for Standard Errors)
       │
       ▼
Outgoing JSON Response
```

---

## 10.2 Global ValidationPipe Standard

All NestJS microservices configure `main.ts` with the following global `ValidationPipe`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,               // Automatically strip non-decorated properties
    forbidNonWhitelisted: true,    // Reject requests containing unknown fields
    transform: true,               // Automatically transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  }),
);
```

---

## 10.3 Global ExceptionFilter Standard

Custom global `HttpExceptionFilter` intercepts all thrown exceptions and formats uniform error envelopes:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      success: false,
      statusCode: status,
      error: this.getErrorCode(status),
      message: this.getErrorMessage(exception),
      details: this.getErrorDetails(exception),
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        correlationId: request.headers['x-correlation-id'] || 'N/A',
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

---

# 11. API Documentation & OpenAPI Standards

## 11.1 OpenAPI / Swagger Specification

All OmniCommerce microservices and BFFs must auto-generate interactive OpenAPI 3.0 documentation using NestJS `@nestjs/swagger`.

- **Swagger Endpoints**: Exposed at `/docs` in development and staging environments (e.g., `http://localhost:3000/docs`).
- **DTO Annotations**: Every DTO field must specify `@ApiProperty()` with explicit types, examples, and descriptions.

```typescript
export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Mouse', description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({ example: 49.99, description: 'Price in USD' })
  @IsNumber()
  @IsPositive()
  readonly price: number;
}
```

---

## 11.2 Contract Testing & Postman Collections

- **Postman Workspace**: Maintained alongside codebase with pre-configured environment variables for local, staging, and production testing.
- **Contract Verification**: Microservices run contract checks during CI pipeline builds to detect payload breaking changes before merging pull requests.

---

# 12. Observability & Telemetry Standards

## 12.1 Correlation ID Propagation

Every HTTP request must carry a unique `X-Correlation-ID` header across all microservice boundaries.

- If client omits `X-Correlation-ID`, the API Gateway generates a new UUIDv4.
- NestJS HTTP interceptors automatically forward `X-Correlation-ID` during inter-service REST calls using `HttpService` (Axios).

---

## 12.2 OpenTelemetry Distributed Tracing

API endpoints populate W3C Trace Context headers (`traceparent`, `tracestate`) to enable end-to-end distributed tracing in Tempo & Grafana:

```text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

---

## 12.3 API Telemetry Metrics

Every microservice controller records standard Prometheus API metrics:

- `http_requests_total{method, route, status}`: Counter of incoming API calls.
- `http_request_duration_seconds{method, route, status}`: Histogram of response latency.
- `http_active_requests{method}`: Gauge of concurrent requests.

---

# 13. Architecture Decision Summary

| Decision | Selected Standard | Architectural Rationale |
|----------|-------------------|-------------------------|
| **API Format** | REST over HTTP/2 | Standardized, web-friendly, highly accessible for frontend/mobile apps |
| **API Versioning** | URI Path (`/api/v1/...`) | Explicit, easy to route at Gateway level, zero caching ambiguity |
| **Edge Routing** | API Gateway + BFF | Shields business microservices, optimizes payloads per client device |
| **Response Format** | Standardized Envelope | Consistent contract parsing for Web, Flutter, and third-party consumers |
| **Authentication** | Bearer JWT + Refresh Cookie | Stateless, scalable horizontally across stateless NestJS instances |
| **Documentation** | OpenAPI 3.0 (Swagger) | Auto-generated directly from NestJS TypeScript code and DTO decorators |

---

# 14. Related Documents

This document should be read alongside the full OmniCommerce architecture series:

- [BACKEND_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/BACKEND_ARCHITECTURE.md)
- `SYSTEM_ARCHITECTURE.md`
- `FRONTEND_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `SECURITY_ARCHITECTURE.md`
- `DEPLOYMENT_ARCHITECTURE.md`
- `MONITORING_ARCHITECTURE.md`

---

# 15. Conclusion

The OmniCommerce API Architecture provides a robust, scalable, and secure interface foundation for the platform. By enforcing consistent RESTful modeling, client-tailored BFF composition, centralized gateway routing, strict DTO validation pipes, and uniform error envelopes, the platform ensures long-term contract stability and an outstanding developer experience across all engineering teams.
