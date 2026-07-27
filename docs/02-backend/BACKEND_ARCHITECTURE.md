# Backend Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Backend Software Architecture Document (BSAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Backend |
| Architecture Style | Microservices + Backend for Frontend + API Gateway + Event-Driven Architecture |
| Primary Framework | NestJS |
| Communication | REST API + RabbitMQ |
| Audience | Backend Engineers, Software Architects, DevOps Engineers, QA Engineers |

---

# Table of Contents

1. Introduction
2. Backend Overview
3. Architectural Principles
4. Backend Topology
5. Backend Layers
6. References

---

# 1. Introduction

## 1.1 Purpose

This document defines the architecture of the backend platform for OmniCommerce.

Its primary objective is to provide a comprehensive understanding of the backend ecosystem, including service responsibilities, communication patterns, architectural boundaries, infrastructure dependencies, and backend engineering standards.

Unlike implementation guides, this document focuses on **architectural design decisions** rather than source code.

Detailed implementation for individual services, APIs, database schemas, deployment, monitoring, and security are documented separately.

---

## 1.2 Scope

This document covers the architecture of every backend component within OmniCommerce, including:

- Backend Platform
- API Gateway
- Backend for Frontend (BFF)
- Business Microservices
- Service Communication
- Data Ownership
- Event-Driven Communication
- Storage Architecture
- Caching
- Search
- Authentication
- Authorization
- Backend Infrastructure
- Backend Deployment Strategy

The following topics are intentionally excluded:

- Frontend Architecture
- Flutter Architecture
- UI Components
- Database Schema Design
- API Endpoint Specifications
- OpenAPI Documentation
- Infrastructure as Code
- Kubernetes Configuration
- CI/CD Implementation

These subjects are covered by their dedicated architecture documents.

---

## 1.3 Intended Audience

This document is intended for:

- Software Architects
- Backend Engineers
- Technical Leads
- DevOps Engineers
- QA Engineers
- New Team Members

Readers should be able to understand how the backend platform is organized, how services collaborate, and how backend responsibilities are distributed.

---

## 1.4 Design Goals

The backend platform is designed to achieve the following goals.

### Scalability

Allow services to scale independently according to workload.

---

### Maintainability

Keep services small, cohesive, and easy to maintain.

---

### Reliability

Provide fault-tolerant communication and resilient service interactions.

---

### Extensibility

Allow new business capabilities to be introduced without affecting existing services.

---

### Security

Protect business resources through centralized authentication and authorization.

---

### Observability

Provide complete visibility into backend operations through logs, metrics, traces, and health checks.

---

# 2. Backend Overview

## 2.1 Overview

The OmniCommerce backend is built as a distributed microservices platform.

Each business capability is implemented as an independent service with clearly defined ownership, responsibilities, and deployment lifecycle.

Services collaborate through synchronous REST APIs and asynchronous domain events while remaining loosely coupled.

The backend platform is composed of five major groups:

- Backend for Frontend (BFF)
- API Gateway
- Business Services
- Messaging Infrastructure
- Data Services

---

## 2.2 Architectural Style

The backend combines several architectural styles.

| Architecture | Purpose |
|--------------|---------|
| Microservices | Independent business capabilities |
| Backend for Frontend | Client-specific APIs |
| API Gateway | Centralized request routing |
| Event-Driven Architecture | Asynchronous communication |
| Layered Architecture | Internal service organization |
| Stateless Services | Horizontal scalability |

Each architectural style addresses a different concern while contributing to the overall system design.

---

## 2.3 Backend Responsibilities

The backend platform is responsible for:

### Identity Management

- Authentication
- Authorization
- Session Validation
- Token Management

---

### Business Processing

- Product Catalog
- Shopping Cart
- Orders
- Inventory
- Payments
- Shipping
- Promotions

---

### Data Management

- Data Persistence
- Data Consistency
- Search Indexing
- Caching
- File Storage

---

### Communication

- REST APIs
- Event Publishing
- Event Consumption
- Service Integration

---

### Platform Services

- Notifications
- Logging
- Monitoring
- Metrics
- Tracing
- Configuration

---

## 2.4 Non-Responsibilities

The backend intentionally does not handle:

- User Interface Rendering
- Client Navigation
- Frontend State Management
- Device-Specific Logic
- Presentation Components

These responsibilities belong to the client applications.

---

## 2.5 Backend Characteristics

The backend platform is designed with the following characteristics:

- Stateless
- Distributed
- Event-Driven
- API-First
- Cloud-Native
- Highly Available
- Horizontally Scalable
- Fault Tolerant
- Secure by Design
- Observable

---

# 3. Architectural Principles

The backend follows a consistent set of engineering principles that guide architectural decisions across every service.

---

## 3.1 Domain-Oriented Services

Each microservice owns a single business domain.

Examples include:

- Authentication
- Product
- Inventory
- Orders
- Payments
- Shipping
- Notifications
- Search

Every service should evolve independently without introducing unnecessary coupling.

---

## 3.2 Single Responsibility

Each service should solve one business problem.

For example:

Product Service

Responsible for:

- Products
- Categories
- Brands
- Product Variants

It should not contain:

- Orders
- Inventory
- Payments

---

## 3.3 Loose Coupling

Services communicate only through public interfaces.

Communication methods include:

- REST APIs
- RabbitMQ Events

Direct dependencies between service implementations are prohibited.

---

## 3.4 High Cohesion

Business logic related to the same domain should remain within the owning service.

A service owns:

- Business Rules
- Validation Rules
- Persistence Logic
- Domain Events

This reduces complexity and simplifies maintenance.

---

## 3.5 Database per Service

Every microservice owns its own database schema and persistence model.

Rules:

- No shared database ownership
- No cross-service table access
- No direct SQL queries to another service

Cross-service communication must occur through APIs or events.

---

## 3.6 API-First

Every public capability should be exposed through well-defined APIs before implementation.

Benefits include:

- Stable Contracts
- Independent Development
- Easier Testing
- Better Documentation

---

## 3.7 Event-Driven Collaboration

Whenever immediate responses are unnecessary, services should communicate asynchronously using domain events.

Example:

```text
Order Created

↓

Inventory Reserved

↓

Payment Processed

↓

Notification Sent

↓

Analytics Updated
```

This approach improves scalability and reduces runtime dependencies.

---

## 3.8 Stateless Services

Business services should not maintain user session state in memory.

Persistent or shared state should reside in external systems such as:

- PostgreSQL
- Redis
- Object Storage

This enables horizontal scaling and simplifies deployment.

---

## 3.9 Observability by Default

Every backend service should expose operational information.

Required capabilities include:

- Structured Logging
- Metrics
- Health Checks
- Distributed Tracing
- Correlation IDs

Operational visibility is considered a core architectural requirement.

---

## 3.10 Security by Design

Security is integrated into every layer of the backend platform.

Core principles include:

- Authentication before authorization
- Least privilege
- Secure defaults
- Input validation
- Output sanitization
- Encrypted communication
- Secret isolation

---

# 4. Backend Topology

## 4.1 Overview

The backend ecosystem consists of multiple independent components that collaborate to process requests from client applications.

At a high level, requests flow through several architectural layers before reaching the business services.

---

## 4.2 High-Level Request Flow

```text
                    Client Applications
      ┌───────────────────────────────────────────┐
      │ Web │ Admin │ Seller │ Flutter Mobile │
      └───────────────────────────────────────────┘
                         │
                         ▼
                  Backend for Frontend
        Customer BFF │ Admin BFF │ Seller BFF
                         │
                         ▼
                     API Gateway
                         │
     ┌───────────────────┼────────────────────┐
     ▼                   ▼                    ▼
 Auth Service      Product Service      Order Service
     │                   │                    │
 Inventory Service   Payment Service   Notification Service
     │                   │                    │
     └─────────────── RabbitMQ ───────────────┘
                         │
         ┌───────────────┼─────────────────┐
         ▼               ▼                 ▼
    PostgreSQL        Redis       Elasticsearch
                         │
                         ▼
              MinIO / Cloudflare R2
```

The Backend for Frontend layer provides client-specific APIs.

The API Gateway acts as the centralized entry point for backend services.

Business services own domain logic and collaborate using REST APIs and RabbitMQ events.

Infrastructure components provide persistence, caching, search, and object storage.

---

## 4.3 Backend Component Groups

The backend platform is divided into five major groups.

| Group | Responsibility |
|--------|----------------|
| Backend for Frontend | Client-specific API orchestration |
| API Gateway | Request routing and cross-cutting concerns |
| Business Services | Domain logic implementation |
| Messaging Infrastructure | Asynchronous communication |
| Data Infrastructure | Persistence, cache, search, and storage |

Each group will be described in detail in the following sections of this document.

---

# 5. Backend Layers

The backend platform is organized into logical layers that separate responsibilities and reduce coupling.

| Layer | Primary Responsibility |
|--------|------------------------|
| Backend for Frontend | Aggregate APIs for specific clients |
| API Gateway | Route and secure incoming requests |
| Business Layer | Execute domain-specific business logic |
| Messaging Layer | Publish and consume domain events |
| Data Layer | Persist, cache, and index business data |
| Infrastructure Layer | Logging, monitoring, configuration, deployment |

Each layer communicates only through defined interfaces and does not bypass architectural boundaries.

---

# 6. References

This document should be read together with the following architecture documents:

- `SYSTEM_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `API_ARCHITECTURE.md`
- `SECURITY_ARCHITECTURE.md`
- `DEPLOYMENT_ARCHITECTURE.md`
- `MONITORING_ARCHITECTURE.md`

---

# 7. Backend Service Landscape

## 7.1 Overview

The OmniCommerce backend is composed of multiple independently deployable microservices. Each service encapsulates a specific business capability and owns its domain logic, persistence model, API contracts, and lifecycle.

Services are designed following the principles of:

- Single Responsibility Principle (SRP)
- High Cohesion
- Loose Coupling
- Database per Service
- API-First Design
- Event-Driven Collaboration

A service should never assume responsibilities belonging to another business domain.

---

## 7.2 Service Categories

Backend services are grouped into logical business domains.

| Category | Services |
|----------|----------|
| Identity | Auth Service, User Service |
| Commerce | Product Service, Cart Service, Order Service |
| Inventory | Inventory Service |
| Payment | Payment Service |
| Logistics | Shipping Service |
| Marketing | Promotion Service |
| Content | Review Service, Media Service |
| Search | Search Service |
| Communication | Notification Service |
| Analytics | Analytics Service |

Grouping services by business capability improves maintainability and team ownership.

---

# 8. Service Architecture Standard

Every backend service should follow a consistent architectural model regardless of its business domain.

Each service is expected to contain:

- API Layer
- Application Layer
- Domain Layer
- Infrastructure Layer
- Persistence Layer

This standard ensures consistency across the entire backend ecosystem.

---

## Standard Responsibilities

| Layer | Responsibility |
|--------|----------------|
| Controller | HTTP / RPC entry point |
| Application | Use cases and orchestration |
| Domain | Business rules |
| Repository | Data access abstraction |
| Infrastructure | External integrations |
| Database | Data persistence |

Business logic should reside within the Domain and Application layers rather than controllers.

---

# 9. Core Services

## 9.1 Auth Service

### Purpose

The Auth Service is responsible for identity verification and access management across the platform.

It serves as the primary authority for authentication and token issuance.

---

### Responsibilities

- User Login
- User Registration
- JWT Generation
- Refresh Token Management
- Password Reset
- Email Verification
- Role Resolution
- Session Validation

---

### Owned Resources

- Credentials
- Refresh Tokens
- Authentication Sessions
- Verification Tokens

---

### External Dependencies

- User Service
- Notification Service
- Redis

---

### Published Events

- UserRegistered
- UserLoggedIn
- PasswordResetRequested
- PasswordChanged

---

### Consumed Events

- UserCreated
- UserDeleted

---

## 9.2 User Service

### Purpose

The User Service manages user profiles and account information.

Authentication remains the responsibility of the Auth Service.

---

### Responsibilities

- Customer Profiles
- Seller Profiles
- Admin Profiles
- Addresses
- Preferences
- Avatar Management

---

### Owned Resources

- User
- Address
- Profile
- Preferences

---

### Published Events

- UserCreated
- UserUpdated
- UserDeleted

---

### Consumed Events

- UserRegistered

---

## 9.3 Product Service

### Purpose

The Product Service manages the product catalog and all product-related business information.

---

### Responsibilities

- Products
- Categories
- Brands
- Attributes
- Product Variants
- Product Images
- Product Status

---

### Owned Resources

- Product
- Category
- Brand
- Variant
- Attribute

---

### Published Events

- ProductCreated
- ProductUpdated
- ProductDeleted

---

### Consumed Events

- MediaUploaded

---

## 9.4 Inventory Service

### Purpose

The Inventory Service manages stock availability and warehouse inventory.

---

### Responsibilities

- Inventory Tracking
- Warehouse Management
- Stock Reservation
- Stock Release
- Stock Adjustment

---

### Owned Resources

- Inventory
- Warehouse
- Stock Movement

---

### Published Events

- InventoryReserved
- InventoryReleased
- InventoryUpdated

---

### Consumed Events

- OrderCreated
- OrderCancelled
- PaymentFailed

---

## 9.5 Cart Service

### Purpose

The Cart Service manages temporary shopping carts before order placement.

---

### Responsibilities

- Shopping Cart
- Cart Items
- Quantity Updates
- Coupon Preview
- Price Estimation

---

### Owned Resources

- Cart
- Cart Item

---

### Published Events

- CartCheckedOut

---

### Consumed Events

- ProductUpdated
- InventoryUpdated

---

## 9.6 Order Service

### Purpose

The Order Service manages the complete order lifecycle.

---

### Responsibilities

- Order Creation
- Order Status
- Order History
- Order Cancellation
- Order Tracking

---

### Owned Resources

- Order
- Order Item
- Order Timeline

---

### Published Events

- OrderCreated
- OrderConfirmed
- OrderCancelled
- OrderCompleted

---

### Consumed Events

- PaymentCompleted
- InventoryReserved
- ShipmentDelivered

---

## 9.7 Payment Service

### Purpose

The Payment Service manages payment processing and transaction records.

---

### Responsibilities

- Payment Processing
- Transaction Management
- Refund Processing
- Payment Verification

---

### Owned Resources

- Payment
- Transaction
- Refund

---

### Published Events

- PaymentCompleted
- PaymentFailed
- RefundCompleted

---

### Consumed Events

- OrderCreated

---

## 9.8 Shipping Service

### Purpose

The Shipping Service manages shipment creation and delivery tracking.

---

### Responsibilities

- Shipment Creation
- Delivery Status
- Carrier Integration
- Shipping Cost Calculation

---

### Owned Resources

- Shipment
- Shipment Tracking

---

### Published Events

- ShipmentCreated
- ShipmentDispatched
- ShipmentDelivered

---

### Consumed Events

- PaymentCompleted

---

## 9.9 Promotion Service

### Purpose

The Promotion Service manages promotional campaigns and discount rules.

---

### Responsibilities

- Coupons
- Discount Rules
- Campaigns
- Flash Sales

---

### Owned Resources

- Coupon
- Promotion
- Campaign

---

### Published Events

- PromotionCreated
- PromotionExpired

---

### Consumed Events

- OrderCompleted

---

## 9.10 Review Service

### Purpose

The Review Service manages customer reviews and product ratings.

---

### Responsibilities

- Product Reviews
- Ratings
- Moderation
- Review Replies

---

### Owned Resources

- Review
- Rating

---

### Published Events

- ReviewCreated

---

### Consumed Events

- OrderCompleted

---

## 9.11 Media Service

### Purpose

The Media Service manages file uploads and digital assets.

---

### Responsibilities

- Image Upload
- File Storage
- Image Metadata
- File Access

---

### Owned Resources

- File Metadata
- Upload Records

---

### External Storage

- MinIO (Development)
- Cloudflare R2 (Production)

---

### Published Events

- MediaUploaded
- MediaDeleted

---

### Consumed Events

None

---

## 9.12 Search Service

### Purpose

The Search Service provides full-text search capabilities.

---

### Responsibilities

- Product Indexing
- Search Queries
- Suggestions
- Filtering

---

### Owned Resources

- Search Index

---

### External Dependencies

- Elasticsearch

---

### Published Events

- SearchIndexed

---

### Consumed Events

- ProductCreated
- ProductUpdated
- ProductDeleted

---

## 9.13 Notification Service

### Purpose

The Notification Service handles outbound communication across multiple channels.

---

### Responsibilities

- Email
- Push Notifications
- SMS
- In-App Notifications

---

### Owned Resources

- Notification
- Delivery Status
- Templates

---

### Published Events

- NotificationSent

---

### Consumed Events

- OrderCreated
- PaymentCompleted
- UserRegistered
- PasswordResetRequested

---

## 9.14 Analytics Service

### Purpose

The Analytics Service collects business events and generates operational insights.

---

### Responsibilities

- Sales Metrics
- Customer Analytics
- Product Analytics
- Dashboard Statistics

---

### Owned Resources

- Aggregated Metrics
- Reports

---

### Published Events

None

---

### Consumed Events

- OrderCompleted
- PaymentCompleted
- ProductViewed
- UserRegistered

---

# 10. Service Independence

Every service should remain autonomous throughout its lifecycle.

---

## Independent Deployment

Each service should be built, tested, and deployed independently.

Deploying one service must not require redeploying unrelated services.

---

## Independent Persistence

Each service owns its own persistence model.

Rules:

- No shared tables
- No direct SQL queries across services
- No foreign keys spanning service boundaries

---

## Independent Business Logic

Business rules must remain inside the owning service.

For example:

- Pricing belongs to Product Service.
- Inventory calculations belong to Inventory Service.
- Payment verification belongs to Payment Service.
- Order lifecycle belongs to Order Service.

Duplicating business logic across services is discouraged unless required for performance or resilience.

---

## Independent Scaling

Services should scale horizontally based on their own workload.

Examples:

- Search Service may require additional replicas during high search traffic.
- Notification Service may scale independently during promotional campaigns.
- Payment Service may scale separately during checkout peaks.

This independence enables efficient resource utilization and operational flexibility.

---

# 11. Service Communication

## 11.1 Overview

The OmniCommerce backend follows a hybrid communication model that combines synchronous APIs with asynchronous event-driven messaging.

Each communication mechanism serves a different architectural purpose.

| Communication | Technology | Usage |
|--------------|------------|-------|
| Synchronous | REST API | Request/Response |
| Asynchronous | RabbitMQ | Domain Events |

Choosing the appropriate communication model helps balance consistency, responsiveness, scalability, and service independence.

---

## 11.2 Communication Principles

All services must follow these principles.

### Explicit Service Contracts

Services communicate only through public contracts.

Examples include:

- REST APIs
- Event Contracts

Internal implementation details must never be exposed.

---

### Loose Coupling

A service should know **what another service provides**, not **how it is implemented**.

Dependencies should always target public interfaces rather than internal code.

---

### Stateless Communication

Each request must contain all information required for processing.

Business services must not rely on in-memory session state.

---

### Domain Ownership

A service may request information from another service but must never modify another service's data directly.

Every domain owns its own business rules and persistence.

---

## 11.3 Synchronous Communication

REST APIs are used whenever an immediate response is required.

Examples include:

- Login
- Product Detail
- Shopping Cart
- Checkout Validation
- Customer Profile

Typical request flow:

```text
Client
      │
      ▼
Customer BFF
      │
      ▼
API Gateway
      │
      ▼
Product Service
      │
      ▼
Response
```

Characteristics:

- Immediate response
- HTTP request/response
- Client waits for completion
- Suitable for read operations and short business transactions

---

## 11.4 Asynchronous Communication

Business events are published whenever downstream services do not need to respond immediately.

Example:

```text
Order Service
      │
OrderCreated
      │
      ▼
RabbitMQ
      │
 ┌────┼───────────────┐
 ▼    ▼               ▼
Inventory      Notification
Service         Service
                │
                ▼
          Analytics Service
```

Characteristics:

- Loose coupling
- Eventual consistency
- Independent processing
- Better scalability
- Fault isolation

---

## 11.5 Communication Selection

| Scenario | Communication |
|----------|---------------|
| Authentication | REST |
| Product Details | REST |
| Search | REST |
| Checkout Validation | REST |
| Reserve Inventory | REST |
| Payment Verification | REST |
| Order Created | RabbitMQ |
| Payment Completed | RabbitMQ |
| Inventory Updated | RabbitMQ |
| Send Email | RabbitMQ |
| Generate Analytics | RabbitMQ |
| Search Reindex | RabbitMQ |

General guideline:

- Use REST when the caller requires an immediate result.
- Use events when the operation can be processed asynchronously.

---

# 12. API Gateway

## 12.1 Overview

The API Gateway acts as the single entry point into the backend platform.

Client applications never communicate directly with business services.

Instead, every request passes through the Gateway before reaching its destination.

---

## 12.2 Responsibilities

The Gateway is responsible for:

- Request Routing
- JWT Validation
- Authorization
- API Versioning
- Rate Limiting
- Correlation ID Generation
- Request Logging
- Request Forwarding
- Health Checking

The Gateway intentionally does **not** contain business logic.

---

## 12.3 Request Flow

```text
Client
     │
     ▼
API Gateway
     │
     ├────────► Auth Service
     ├────────► Product Service
     ├────────► Order Service
     ├────────► Inventory Service
     └────────► Payment Service
```

---

## 12.4 Responsibilities Outside Gateway

The following responsibilities belong to business services rather than the Gateway.

- Product Validation
- Inventory Calculation
- Order Processing
- Business Rules
- Payment Logic
- Shipping Logic

---

## 12.5 Gateway Design Principles

The Gateway should remain:

- Stateless
- Lightweight
- Highly Available
- Horizontally Scalable

No business data should be persisted within the Gateway.

---

# 13. Backend for Frontend (BFF)

## 13.1 Overview

Backend for Frontend provides client-specific APIs optimized for different application types.

Rather than exposing raw backend services directly to clients, the BFF aggregates, transforms, and simplifies backend interactions.

---

## 13.2 BFF Architecture

```text
                 Client Applications
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Customer Web      Admin Portal    Seller Portal
        │              │              │
        ▼              ▼              ▼
 Customer BFF     Admin BFF      Seller BFF
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  API Gateway
                       ▼
                Business Services
```

---

## 13.3 Customer BFF

### Purpose

Provides APIs optimized for customer-facing applications.

Supported Clients:

- Customer Web
- Flutter Mobile

Responsibilities:

- Aggregate Product APIs
- Aggregate Cart APIs
- Checkout Orchestration
- Customer Profile
- Wishlist
- Order History

---

## 13.4 Admin BFF

Purpose:

Provide APIs optimized for internal administration.

Responsibilities:

- Dashboard
- Product Management
- Inventory Management
- User Management
- Reports
- Analytics

---

## 13.5 Seller BFF

Purpose:

Provide APIs optimized for merchant operations.

Responsibilities:

- Product Management
- Orders
- Revenue
- Shipping
- Store Management

---

## 13.6 BFF Responsibilities

The BFF may perform:

- API Aggregation
- Response Transformation
- Pagination Normalization
- Client-Specific Validation
- Response Composition
- Lightweight Caching

The BFF must not implement business rules owned by backend services.

---

# 14. Domain Boundaries

## 14.1 Overview

Each business domain owns its own data, business rules, and APIs.

Domain boundaries prevent coupling between unrelated services.

---

## Product Domain

Owns:

- Product
- Category
- Brand
- Variant
- Attributes

Does Not Own:

- Inventory
- Orders
- Payments

---

## Inventory Domain

Owns:

- Warehouse
- Stock
- Reservation
- Stock Adjustment

Does Not Own:

- Product Information
- Orders

---

## Order Domain

Owns:

- Orders
- Order Items
- Order Timeline

Does Not Own:

- Payment Transactions
- Warehouse Stock

---

## Payment Domain

Owns:

- Payment
- Transactions
- Refunds

Does Not Own:

- Orders
- Inventory

---

## Shipping Domain

Owns:

- Shipment
- Tracking
- Delivery Status

---

## Notification Domain

Owns:

- Email
- Push
- SMS
- Notification Templates

---

## Search Domain

Owns:

- Search Index
- Search Queries
- Suggestions

---

## Analytics Domain

Owns:

- Reports
- Metrics
- Dashboards

---

## Domain Ownership Rule

Every business capability has exactly one authoritative owner.

No other service should duplicate ownership of that capability.

---

# 15. Data Ownership

## 15.1 Principle

Every service owns its own persistent data.

Other services may access that information only through APIs or events.

---

## 15.2 Ownership Matrix

| Service | Owns |
|----------|------|
| Auth | Credentials, Sessions |
| User | User Profiles |
| Product | Products, Categories |
| Inventory | Stock, Warehouses |
| Cart | Shopping Carts |
| Order | Orders |
| Payment | Transactions |
| Shipping | Shipments |
| Promotion | Coupons |
| Review | Reviews |
| Search | Search Index |
| Notification | Notifications |
| Analytics | Metrics |
| Media | File Metadata |

---

## 15.3 Prohibited Access

The following practices are not allowed:

- Query another service's database directly.
- Create foreign keys across services.
- Share database tables.
- Share ORM entities.
- Reuse another service's repositories.

---

## 15.4 Data Synchronization

Cross-service data should be synchronized through:

- REST APIs
- RabbitMQ Events

Never through direct database synchronization.

---

# 16. Communication Rules

The following architectural rules apply to all backend services.

---

## Allowed Communication

```text
BFF
   │
   ▼
Gateway
   │
   ▼
Business Service
   │
   ├──► PostgreSQL
   ├──► Redis
   ├──► RabbitMQ
   └──► Elasticsearch (when applicable)
```

---

## Allowed Inter-Service Communication

```text
Order Service
       │ REST
       ▼
Inventory Service
```

```text
OrderCreated
       │
       ▼
RabbitMQ
       │
       ▼
Notification Service
```

---

## Prohibited Communication

### Direct Database Access

```text
Product Service
        │
        ▼
Inventory Database
```

**Not Allowed**

---

### Shared Repository

```text
Order Service

imports

Inventory Repository
```

**Not Allowed**

---

### Shared Entity

```text
Product Service

imports

Order Entity
```

**Not Allowed**

---

### Business Logic Duplication

The same business rule should not be implemented across multiple services.

When a business capability belongs to a service, that service remains the single source of truth.

---

## Architectural Compliance Checklist

Every backend service should satisfy the following requirements:

- Own a single business domain.
- Own its own persistence model.
- Expose public APIs.
- Publish domain events when appropriate.
- Consume only required events.
- Avoid direct database dependencies.
- Avoid implementation coupling.
- Remain independently deployable.
- Remain stateless.
- Expose health checks and operational metrics.

These rules ensure long-term maintainability, scalability, and consistency across the OmniCommerce backend platform.

---

# 17. Persistence Architecture

## 17.1 Overview

The persistence architecture is designed to provide reliable, scalable, and maintainable data storage for each business domain.

OmniCommerce adopts the **Database per Service** pattern, where every microservice owns its persistence layer and exposes data only through public APIs or domain events.

The backend uses multiple storage technologies, each selected based on its specific purpose.

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Transactional Data |
| Redis | Caching & Temporary Data |
| Elasticsearch | Full-Text Search |
| MinIO | Object Storage (Development) |
| Cloudflare R2 | Object Storage (Production) |

---

## 17.2 Database per Service

Each microservice owns:

- Database Schema
- Tables
- Indexes
- Migrations
- Data Access Layer

Example:

```text
Product Service
    │
    ▼
Product Database

------------------------

Order Service
    │
    ▼
Order Database

------------------------

Inventory Service
    │
    ▼
Inventory Database
```

Rules:

- No shared tables
- No cross-service foreign keys
- No direct SQL access
- No shared ORM models

---

## 17.3 PostgreSQL

### Purpose

PostgreSQL is the primary transactional database for the platform.

Suitable for:

- ACID Transactions
- Relational Data
- Business Entities
- Financial Records
- Inventory Records

---

### Responsibilities

Examples include:

- Products
- Orders
- Payments
- Warehouses
- Customers
- Promotions

---

### Design Principles

- Normalized schema
- Strong consistency
- Explicit constraints
- Indexed queries
- Transaction support

---

## 17.4 Redis

### Purpose

Redis provides high-speed in-memory storage.

Redis is **not** the source of truth.

Persistent data always resides in PostgreSQL.

---

### Typical Usage

- Cache
- Session Storage
- OTP Storage
- Refresh Tokens
- Rate Limiting
- Temporary Checkout Data

---

### Cache Strategy

OmniCommerce adopts the **Cache Aside Pattern**.

```text
Client
    │
    ▼
Service
    │
    ▼
Redis

Cache Hit

↓

Return Result

-------------------------

Cache Miss

↓

PostgreSQL

↓

Update Cache

↓

Return Result
```

---

### Cache Invalidation

Cache should be invalidated whenever:

- Product Updated
- Inventory Changed
- Promotion Changed
- User Updated

Cache consistency is maintained through domain events.

---

## 17.5 Elasticsearch

### Purpose

Elasticsearch provides fast full-text search capabilities.

Product search is intentionally separated from transactional storage.

---

### Indexed Data

Examples include:

- Product Name
- Category
- Brand
- Description
- Tags
- Search Keywords

---

### Synchronization

```text
Product Updated

↓

RabbitMQ

↓

Search Service

↓

Elasticsearch
```

Search indexes are eventually consistent with transactional data.

---

## 17.6 Object Storage

### Development

MinIO

### Production

Cloudflare R2

---

### Responsibilities

- Product Images
- User Avatars
- Documents
- Marketing Assets
- Attachments

---

### Storage Flow

```text
Client

↓

Media Service

↓

Object Storage

↓

Public URL

↓

Database Metadata
```

Only metadata should be stored in PostgreSQL.

Binary files remain inside Object Storage.

---

# 18. Event Architecture

## 18.1 Overview

OmniCommerce adopts an Event-Driven Architecture (EDA) to enable asynchronous collaboration between microservices.

Events reduce direct dependencies while improving scalability and fault tolerance.

RabbitMQ serves as the central message broker.

---

## 18.2 Event Lifecycle

```text
Business Action

↓

Business Service

↓

Domain Event

↓

RabbitMQ Exchange

↓

Queue

↓

Consumer

↓

Business Processing
```

---

## 18.3 Event Categories

### Domain Events

Represent meaningful business changes.

Examples:

- OrderCreated
- PaymentCompleted
- ProductUpdated
- InventoryReserved

---

### Integration Events

Used to synchronize information between independent services.

Examples:

- ProductIndexed
- NotificationRequested
- AnalyticsUpdated

---

## 18.4 Event Publishing

A service publishes events only after its local transaction completes successfully.

Example:

```text
Create Order

↓

Save Database

↓

Commit Transaction

↓

Publish OrderCreated
```

Publishing events before committing the transaction may produce inconsistent system state.

---

## 18.5 Event Consumption

Consumers subscribe only to events relevant to their business domain.

Example:

```text
OrderCreated

↓

Inventory Service

↓

Reserve Stock
```

Notification Service does not need to know how the Order Service works internally.

---

## 18.6 Event Versioning

Event contracts should support versioning.

Example:

```text
OrderCreated.v1

OrderCreated.v2
```

Breaking changes should result in a new event version rather than modifying existing contracts.

---

## 18.7 Idempotency

Consumers must process duplicate events safely.

Possible strategies include:

- Event ID Tracking
- Processed Event Table
- Redis Deduplication
- Business Keys

Every consumer should assume that duplicate delivery is possible.

---

## 18.8 Retry Strategy

When event processing fails:

1. Retry automatically
2. Apply exponential backoff
3. Retry a limited number of times
4. Move failed messages to a Dead Letter Queue (DLQ)

---

## 18.9 Dead Letter Queue

Messages that repeatedly fail processing are redirected to a dedicated Dead Letter Queue.

Purposes:

- Failure analysis
- Manual recovery
- Replay
- Operational monitoring

---

# 19. Authentication Architecture

## 19.1 Overview

Authentication verifies the identity of every client before allowing access to protected resources.

OmniCommerce adopts JWT-based authentication with Refresh Tokens.

---

## 19.2 Authentication Flow

```text
User

↓

Login

↓

Auth Service

↓

Access Token

+

Refresh Token
```

---

## 19.3 Access Token

Characteristics:

- Short-lived
- Stateless
- Signed
- Included in Authorization header

Purpose:

Authenticate API requests.

---

## 19.4 Refresh Token

Characteristics:

- Longer lifetime
- Securely stored
- Rotatable

Purpose:

Issue new Access Tokens without requiring users to log in again.

---

## 19.5 Token Rotation

Every successful refresh operation should invalidate the previous Refresh Token and issue a new one.

Benefits:

- Reduced replay attacks
- Better session security

---

## 19.6 Logout

Logout should:

- Revoke Refresh Token
- Remove active session
- Invalidate cached authentication data

Access Tokens naturally expire after their configured lifetime.

---

# 20. Authorization Architecture

## 20.1 Overview

Authorization determines what an authenticated user is allowed to do.

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

---

## 20.2 Role-Based Access Control (RBAC)

OmniCommerce adopts Role-Based Access Control.

Typical roles include:

- Customer
- Seller
- Admin
- Super Admin

Each role owns a predefined permission set.

---

## 20.3 Permission Model

Permissions represent individual actions.

Examples:

```text
product.read

product.create

product.update

product.delete

order.read

order.update

inventory.manage

payment.refund
```

Roles are assigned permissions rather than hardcoding authorization rules throughout the application.

---

## 20.4 Resource Ownership

Some operations require ownership validation.

Example:

Customer A

↓

Can View

↓

Customer A's Orders

Customer A

↓

Cannot View

↓

Customer B's Orders

Ownership validation should be performed by the owning service.

---

## 20.5 Authorization Layers

Authorization may occur at multiple layers.

| Layer | Responsibility |
|--------|----------------|
| API Gateway | Token Validation |
| BFF | Client Access Validation |
| Business Service | Business Authorization |

Business services remain the final authority for permission enforcement.

---

# 21. Backend Error Handling

## 21.1 Overview

A consistent error handling strategy improves maintainability, observability, and client experience.

All services should return standardized error responses.

---

## 21.2 Error Categories

| Category | Description |
|----------|-------------|
| Validation Error | Invalid request data |
| Authentication Error | Invalid or expired credentials |
| Authorization Error | Permission denied |
| Business Error | Domain rule violation |
| Resource Error | Resource not found |
| Infrastructure Error | Database, Redis, RabbitMQ |
| External Service Error | Third-party integration |

---

## 21.3 Standard Error Response

Example:

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Product not found",
  "timestamp": "...",
  "path": "/api/products/1",
  "correlationId": "..."
}
```

---

## 21.4 Global Exception Handling

Every backend service should implement a centralized exception handler.

Responsibilities:

- Convert internal exceptions
- Standardize responses
- Log errors
- Preserve correlation IDs

---

## 21.5 Retryable Errors

Retry should be applied only to transient failures.

Examples:

- Temporary database outage
- RabbitMQ unavailable
- External API timeout

Business validation errors should **never** be retried automatically.

---

## 21.6 Correlation ID

Every incoming request receives a Correlation ID.

The Correlation ID should propagate across:

- API Gateway
- BFF
- Business Services
- RabbitMQ Events
- Logs
- Distributed Traces

This enables end-to-end request tracing across the platform.

---

# 22. Observability Architecture

## 22.1 Overview

Observability enables engineers to understand the internal state of the backend platform by collecting and correlating logs, metrics, traces, and health information.

OmniCommerce adopts an observability-first approach where every backend service is expected to expose sufficient operational telemetry for monitoring, troubleshooting, and incident response.

---

## 22.2 Observability Stack

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Logging | Pino | Structured application logging |
| Log Aggregation | Loki | Centralized log storage |
| Metrics | Prometheus | Metrics collection |
| Visualization | Grafana | Dashboards & alert visualization |
| Tracing | Tempo | Distributed tracing |
| Health Check | NestJS Terminus (or equivalent) | Service health reporting |

---

## 22.3 Logging Strategy

All backend services must produce structured logs.

Every log entry should contain:

- Timestamp
- Log Level
- Service Name
- Environment
- Correlation ID
- Request ID
- User ID (when available)
- Message
- Metadata

Log Levels:

- TRACE
- DEBUG
- INFO
- WARN
- ERROR
- FATAL

Sensitive information must never be written to logs.

Examples:

- Passwords
- JWT Secret
- Refresh Tokens
- Credit Card Information
- OTP Codes

---

## 22.4 Metrics

Every service should expose Prometheus-compatible metrics.

Minimum metrics include:

Infrastructure

- CPU
- Memory
- Disk
- Network

Application

- Request Count
- Response Time
- Error Rate
- Active Connections
- Queue Length

Business

- Orders Created
- Payments Completed
- Inventory Reservations
- Login Success Rate

---

## 22.5 Distributed Tracing

Every request should be traceable across multiple services.

Typical trace flow:

```text
Client

↓

Customer BFF

↓

API Gateway

↓

Order Service

↓

Inventory Service

↓

RabbitMQ

↓

Notification Service
```

Each request must propagate:

- Correlation ID
- Trace ID
- Span ID

Tracing should support root cause analysis and performance optimization.

---

## 22.6 Health Checks

Each backend service must expose health endpoints.

Recommended endpoints:

```text
GET /health

GET /health/live

GET /health/ready
```

Health checks should validate:

- Database Connectivity
- Redis Connectivity
- RabbitMQ Connectivity
- External Dependencies
- Storage Connectivity

---

# 23. Security Architecture

## 23.1 Overview

Security is implemented as a cross-cutting concern throughout the backend platform.

Security mechanisms should be enforced consistently across all services rather than implemented individually in each feature.

---

## 23.2 Authentication

Authentication is based on:

- JWT Access Token
- Refresh Token
- Token Rotation

Every protected request must be authenticated before reaching business logic.

---

## 23.3 Authorization

Authorization follows Role-Based Access Control (RBAC).

Typical roles:

- Customer
- Seller
- Admin
- Super Admin

Authorization decisions remain the responsibility of the owning business service.

---

## 23.4 API Security

Every public API should enforce:

- HTTPS
- JWT Validation
- Request Validation
- Rate Limiting
- Request Size Limits

---

## 23.5 Input Validation

All incoming requests must be validated before entering the application layer.

Validation includes:

- Required Fields
- Data Types
- Length Constraints
- Value Ranges
- Enum Validation
- Custom Business Validation

Invalid requests should fail before reaching domain logic.

---

## 23.6 Common Security Controls

Backend services should protect against:

- SQL Injection
- NoSQL Injection
- XSS
- Command Injection
- Path Traversal
- File Upload Abuse
- Brute Force Attacks
- Replay Attacks

---

## 23.7 Secrets Management

Secrets should never be stored in source code.

Examples:

- Database Passwords
- JWT Secrets
- RabbitMQ Credentials
- Redis Passwords
- Cloudflare Credentials
- SMTP Credentials

Secrets should be managed through environment configuration or a dedicated secrets manager.

---

## 23.8 Audit Logging

Security-sensitive operations should generate audit logs.

Examples include:

- Login
- Logout
- Password Change
- Permission Changes
- Refund Approval
- Inventory Adjustment
- Product Deletion

Audit logs should be immutable and retained according to organizational policies.

---

# 24. Configuration Management

## 24.1 Overview

Configuration should be externalized from application code.

Applications should behave consistently across environments by relying on environment-specific configuration.

---

## 24.2 Configuration Sources

Typical configuration includes:

- Environment Variables
- Configuration Files
- Secret Store
- Feature Flags

---

## 24.3 Configuration Categories

Examples:

Infrastructure

- Database
- Redis
- RabbitMQ

Application

- JWT
- Upload Limits
- API Version

External Services

- SMTP
- Payment Gateway
- Object Storage

---

## 24.4 Configuration Principles

Configuration should be:

- Environment-specific
- Version controlled (excluding secrets)
- Strongly validated at startup
- Immutable during runtime unless explicitly supported

Applications should fail fast if mandatory configuration is missing.

---

# 25. Deployment Architecture

## 25.1 Overview

Every backend service is packaged and deployed independently.

Services should remain stateless to support horizontal scaling and rolling deployments.

---

## 25.2 Containerization

Every service should run inside its own Docker container.

Benefits include:

- Consistent runtime
- Isolation
- Simplified deployment
- Reproducible environments

---

## 25.3 Deployment Flow

```text
Developer

↓

Git Repository

↓

GitHub Actions

↓

Docker Image

↓

Container Registry

↓

Deployment Server

↓

Docker Compose

↓

Running Services
```

Future deployments may adopt Kubernetes without changing service boundaries.

---

## 25.4 Deployment Principles

Deployments should support:

- Zero or Minimal Downtime
- Independent Service Releases
- Rollback Capability
- Health Verification
- Version Tracking

---

# 26. Scalability Strategy

## 26.1 Overview

Scalability is achieved by allowing independent services to scale based on workload.

---

## 26.2 Horizontal Scaling

Business services should remain stateless.

Multiple instances of the same service may run simultaneously behind a load balancer.

---

## 26.3 Queue Scaling

RabbitMQ consumers should scale independently.

High-throughput consumers include:

- Notification Service
- Search Service
- Analytics Service

---

## 26.4 Cache Scaling

Redis reduces pressure on transactional databases by serving frequently accessed data.

---

## 26.5 Search Scaling

Elasticsearch clusters should scale independently from transactional databases.

---

## 26.6 Database Scaling

Scaling strategies may include:

- Read Replicas
- Connection Pooling
- Query Optimization
- Index Optimization

Database scaling should preserve transactional integrity.

---

# 27. Backend Engineering Standards

## 27.1 Coding Principles

Every backend service should follow consistent engineering standards.

General principles:

- SOLID
- Clean Architecture
- Separation of Concerns
- Dependency Injection
- Domain-Oriented Design

---

## 27.2 Naming Conventions

Use consistent naming across the platform.

Examples:

- PascalCase for Classes
- camelCase for Variables
- kebab-case for Routes
- UPPER_SNAKE_CASE for Constants

---

## 27.3 Layer Dependency Rules

Allowed dependency flow:

```text
Controller

↓

Application Service

↓

Domain

↓

Repository

↓

Database
```

Direct dependencies that bypass architectural layers are prohibited.

---

## 27.4 Error Handling Standard

Every service should:

- Throw domain-specific exceptions
- Return standardized error responses
- Preserve correlation IDs
- Log unexpected failures

---

## 27.5 Validation Standard

Validation should occur before business logic execution.

Business services should never process invalid requests.

---

## 27.6 Logging Standard

Every request should generate structured logs with consistent metadata.

Logs should support:

- Monitoring
- Debugging
- Auditing
- Incident Response

---

# 28. Reference Workflows

## 28.1 Customer Checkout

```text
Customer

↓

Customer BFF

↓

API Gateway

↓

Order Service

↓

Inventory Service

↓

Payment Service

↓

RabbitMQ

↓

Notification Service

↓

Analytics Service
```

---

## 28.2 User Authentication

```text
User

↓

Customer BFF

↓

API Gateway

↓

Auth Service

↓

JWT

↓

Protected APIs
```

---

## 28.3 Product Search

```text
Client

↓

Customer BFF

↓

API Gateway

↓

Search Service

↓

Elasticsearch

↓

Search Results
```

---

## 28.4 Product Update

```text
Admin

↓

Product Service

↓

PostgreSQL

↓

ProductUpdated Event

↓

RabbitMQ

↓

Search Service

↓

Elasticsearch
```

---

## 28.5 File Upload

```text
Client

↓

Media Service

↓

Object Storage

↓

Metadata Database

↓

Public URL
```

---

# 29. Architecture Decision Summary

The following architectural decisions guide the backend platform.

| Decision | Rationale |
|----------|-----------|
| NestJS | Modular architecture, strong TypeScript support, dependency injection, and enterprise-ready ecosystem |
| Microservices | Independent development, deployment, and scalability for each business capability |
| API Gateway | Centralized routing, authentication, rate limiting, and cross-cutting concerns |
| Backend for Frontend | Client-specific API composition and reduced frontend complexity |
| PostgreSQL | ACID compliance, strong relational modeling, and mature ecosystem |
| Redis | High-performance caching, session storage, and temporary data management |
| RabbitMQ | Reliable asynchronous messaging and loose coupling between services |
| Elasticsearch | Fast full-text search and filtering optimized for product discovery |
| MinIO / Cloudflare R2 | Scalable object storage for media assets across development and production environments |
| JWT + Refresh Token | Stateless authentication with secure session renewal |

Detailed design decisions and trade-off analyses are documented in the Architecture Decision Records (ADR).

---

# 30. Related Documents

This document should be read together with the following architecture documents:

- `SYSTEM_ARCHITECTURE.md`
- `FRONTEND_ARCHITECTURE.md`
- `MOBILE_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `API_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `SECURITY_ARCHITECTURE.md`
- `MONITORING_ARCHITECTURE.md`
- `DEPLOYMENT_ARCHITECTURE.md`
- `PROJECT_STRUCTURE.md`

---

# 31. Conclusion

The OmniCommerce backend is designed as a modular, event-driven microservices platform that emphasizes clear domain ownership, independent deployment, operational observability, and long-term maintainability.

By combining Backend for Frontend, API Gateway, REST APIs, asynchronous messaging, and dedicated persistence technologies, the platform provides a scalable foundation capable of supporting multiple client applications and evolving business requirements while maintaining architectural consistency across all backend services.