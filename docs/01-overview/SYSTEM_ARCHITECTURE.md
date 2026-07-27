# OmniCommerce System Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Software Architecture Document (SAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Architecture Style | Cloud-Native Enterprise E-Commerce Platform |
| Repository Type | Monorepo |
| Primary Language | TypeScript, Dart |
| Target Audience | Software Architects, Backend Engineers, Frontend Engineers, Mobile Engineers, DevOps Engineers, QA Engineers |
| Scope | Entire System |
| Related Documents | FRONTEND_ARCHITECTURE.md, BACKEND_ARCHITECTURE.md, MOBILE_ARCHITECTURE.md, DATABASE_ARCHITECTURE.md, DEPLOYMENT_ARCHITECTURE.md |

---

# Table of Contents

- 1. Introduction
- 2. Project Overview
- 3. Vision & Goals
- 4. Architecture Principles
- 5. High-Level Architecture
- 6. Architecture Layers
- 7. Repository Structure
- 8. Applications Overview
- 9. Shared Packages
- 10. Technology Stack
- 11. System Workflows
- 12. Architecture Decisions
- 13. Quality Attributes
- 14. Deployment Overview
- 15. Documentation Map
- 16. Future Roadmap

---

# 1. Introduction

## 1.1 Purpose

This document provides a high-level architectural overview of the OmniCommerce platform.

Its primary objective is to serve as the entry point for understanding the entire system, including its architectural style, project organization, technology stack, core components, communication model, and overall software design philosophy.

Rather than explaining implementation details, this document focuses on how every part of the platform fits together from a system-wide perspective.

Detailed implementation, domain-specific architecture, deployment strategies, database design, and development guidelines are documented separately in their respective architecture documents.

---

## 1.2 Scope

This document covers the architecture of the entire OmniCommerce ecosystem, including:

- Web Platform
- Mobile Platform
- Backend Services
- Backend for Frontend (BFF)
- API Gateway
- Microservices
- Event-Driven Communication
- Shared Libraries
- Infrastructure
- Repository Organization
- Technology Stack
- High-Level Workflows

The following topics are intentionally excluded from this document:

- API Specifications
- Database Schema
- Entity Design
- Sequence Diagrams
- Class Diagrams
- Source Code Structure of Individual Services
- CI/CD Pipeline Details
- Infrastructure Provisioning
- Kubernetes Configuration
- Docker Configuration
- Security Implementation Details

These topics are covered in dedicated architecture documents.

---

## 1.3 Intended Audience

This document is intended for:

- Software Architects
- Technical Leads
- Backend Engineers
- Frontend Engineers
- Flutter Engineers
- DevOps Engineers
- QA Engineers
- New Team Members
- Project Stakeholders

Reading this document should provide enough understanding to navigate the project without prior knowledge of the codebase.

---

## 1.4 Document Objectives

The objectives of this document are:

- Explain the overall architecture of the platform.
- Describe how major components interact.
- Introduce architectural principles.
- Define project organization.
- Standardize technical decisions.
- Establish a common understanding across teams.
- Provide references to detailed architecture documents.

---

# 2. Project Overview

## 2.1 About OmniCommerce

OmniCommerce is a modern cloud-native enterprise e-commerce platform designed to support multiple client applications through a unified backend ecosystem.

The platform is built around modern software architecture practices, enabling independent development, scalable deployment, and long-term maintainability.

Unlike traditional monolithic e-commerce systems, OmniCommerce adopts a distributed architecture where frontend applications, backend services, and infrastructure components evolve independently while remaining loosely coupled.

---

## 2.2 Platform Overview

OmniCommerce consists of multiple client applications serving different business roles.

### Customer Platform

Provides an online shopping experience for end users.

Core capabilities include:

- Product Browsing
- Product Search
- Shopping Cart
- Checkout
- Order Tracking
- Wishlist
- User Profile
- Reviews
- Authentication

---

### Admin Platform

Provides internal management capabilities.

Core capabilities include:

- Dashboard
- Product Management
- Inventory Management
- Order Management
- Customer Management
- Promotion Management
- Analytics
- Reports
- System Configuration

---

### Seller Platform

Provides merchants with tools to manage their stores.

Core capabilities include:

- Product Catalog
- Inventory
- Orders
- Revenue
- Shipping
- Promotions
- Store Management

---

### Mobile Platform

A native Flutter application delivering a complete shopping experience on Android and iOS devices.

Core capabilities include:

- Mobile Shopping
- Authentication
- Product Discovery
- Checkout
- Push Notifications
- Order Tracking
- Wishlist
- User Profile

The mobile application communicates with the same backend ecosystem as the web applications while maintaining an independent user experience optimized for mobile devices.

---

## 2.3 Business Domains

The platform is organized around multiple business domains.

Examples include:

- Authentication
- User Management
- Product Catalog
- Inventory
- Shopping Cart
- Checkout
- Orders
- Payments
- Shipping
- Promotions
- Search
- Notifications
- Analytics
- Media Management

Each domain is designed to evolve independently while collaborating through well-defined APIs and asynchronous events.

---

## 2.4 System Characteristics

OmniCommerce is designed with the following characteristics:

- Modular
- Distributed
- Scalable
- Event-Driven
- Cloud-Native
- API-First
- Mobile-Ready
- Multi-Platform
- Maintainable
- Highly Extensible

These characteristics enable the platform to adapt to future business growth while minimizing architectural constraints.

---

## 2.5 Core Architecture Overview

At a high level, the platform consists of the following major layers:

Client Layer

- Customer Web
- Admin Portal
- Seller Portal
- Flutter Mobile

Presentation Layer

- Shell Application
- Microfrontends

Backend Layer

- Backend for Frontend (BFF)
- API Gateway
- Microservices

Data Layer

- PostgreSQL
- Redis
- Elasticsearch
- Object Storage

Infrastructure Layer

- Docker
- Cloudflare
- Nginx
- Monitoring Stack

A more detailed explanation of each layer is provided later in this document.

---

# OmniCommerce System Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Software Architecture Document (SAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Architecture Style | Cloud-Native Enterprise E-Commerce Platform |
| Repository Type | Monorepo |
| Primary Language | TypeScript, Dart |
| Target Audience | Software Architects, Backend Engineers, Frontend Engineers, Mobile Engineers, DevOps Engineers, QA Engineers |
| Scope | Entire System |
| Related Documents | FRONTEND_ARCHITECTURE.md, BACKEND_ARCHITECTURE.md, MOBILE_ARCHITECTURE.md, DATABASE_ARCHITECTURE.md, DEPLOYMENT_ARCHITECTURE.md |

---

# Table of Contents

- 1. Introduction
- 2. Project Overview
- 3. Vision & Goals
- 4. Architecture Principles
- 5. High-Level Architecture
- 6. Architecture Layers
- 7. Repository Structure
- 8. Applications Overview
- 9. Shared Packages
- 10. Technology Stack
- 11. System Workflows
- 12. Architecture Decisions
- 13. Quality Attributes
- 14. Deployment Overview
- 15. Documentation Map
- 16. Future Roadmap

---

# 1. Introduction

## 1.1 Purpose

This document provides a high-level architectural overview of the OmniCommerce platform.

Its primary objective is to serve as the entry point for understanding the entire system, including its architectural style, project organization, technology stack, core components, communication model, and overall software design philosophy.

Rather than explaining implementation details, this document focuses on how every part of the platform fits together from a system-wide perspective.

Detailed implementation, domain-specific architecture, deployment strategies, database design, and development guidelines are documented separately in their respective architecture documents.

---

## 1.2 Scope

This document covers the architecture of the entire OmniCommerce ecosystem, including:

- Web Platform
- Mobile Platform
- Backend Services
- Backend for Frontend (BFF)
- API Gateway
- Microservices
- Event-Driven Communication
- Shared Libraries
- Infrastructure
- Repository Organization
- Technology Stack
- High-Level Workflows

The following topics are intentionally excluded from this document:

- API Specifications
- Database Schema
- Entity Design
- Sequence Diagrams
- Class Diagrams
- Source Code Structure of Individual Services
- CI/CD Pipeline Details
- Infrastructure Provisioning
- Kubernetes Configuration
- Docker Configuration
- Security Implementation Details

These topics are covered in dedicated architecture documents.

---

## 1.3 Intended Audience

This document is intended for:

- Software Architects
- Technical Leads
- Backend Engineers
- Frontend Engineers
- Flutter Engineers
- DevOps Engineers
- QA Engineers
- New Team Members
- Project Stakeholders

Reading this document should provide enough understanding to navigate the project without prior knowledge of the codebase.

---

## 1.4 Document Objectives

The objectives of this document are:

- Explain the overall architecture of the platform.
- Describe how major components interact.
- Introduce architectural principles.
- Define project organization.
- Standardize technical decisions.
- Establish a common understanding across teams.
- Provide references to detailed architecture documents.

---

# 2. Project Overview

## 2.1 About OmniCommerce

OmniCommerce is a modern cloud-native enterprise e-commerce platform designed to support multiple client applications through a unified backend ecosystem.

The platform is built around modern software architecture practices, enabling independent development, scalable deployment, and long-term maintainability.

Unlike traditional monolithic e-commerce systems, OmniCommerce adopts a distributed architecture where frontend applications, backend services, and infrastructure components evolve independently while remaining loosely coupled.

---

## 2.2 Platform Overview

OmniCommerce consists of multiple client applications serving different business roles.

### Customer Platform

Provides an online shopping experience for end users.

Core capabilities include:

- Product Browsing
- Product Search
- Shopping Cart
- Checkout
- Order Tracking
- Wishlist
- User Profile
- Reviews
- Authentication

---

### Admin Platform

Provides internal management capabilities.

Core capabilities include:

- Dashboard
- Product Management
- Inventory Management
- Order Management
- Customer Management
- Promotion Management
- Analytics
- Reports
- System Configuration

---

### Seller Platform

Provides merchants with tools to manage their stores.

Core capabilities include:

- Product Catalog
- Inventory
- Orders
- Revenue
- Shipping
- Promotions
- Store Management

---

### Mobile Platform

A native Flutter application delivering a complete shopping experience on Android and iOS devices.

Core capabilities include:

- Mobile Shopping
- Authentication
- Product Discovery
- Checkout
- Push Notifications
- Order Tracking
- Wishlist
- User Profile

The mobile application communicates with the same backend ecosystem as the web applications while maintaining an independent user experience optimized for mobile devices.

---

## 2.3 Business Domains

The platform is organized around multiple business domains.

Examples include:

- Authentication
- User Management
- Product Catalog
- Inventory
- Shopping Cart
- Checkout
- Orders
- Payments
- Shipping
- Promotions
- Search
- Notifications
- Analytics
- Media Management

Each domain is designed to evolve independently while collaborating through well-defined APIs and asynchronous events.

---

## 2.4 System Characteristics

OmniCommerce is designed with the following characteristics:

- Modular
- Distributed
- Scalable
- Event-Driven
- Cloud-Native
- API-First
- Mobile-Ready
- Multi-Platform
- Maintainable
- Highly Extensible

These characteristics enable the platform to adapt to future business growth while minimizing architectural constraints.

---

## 2.5 Core Architecture Overview

At a high level, the platform consists of the following major layers:

Client Layer

- Customer Web
- Admin Portal
- Seller Portal
- Flutter Mobile

Presentation Layer

- Shell Application
- Microfrontends

Backend Layer

- Backend for Frontend (BFF)
- API Gateway
- Microservices

Data Layer

- PostgreSQL
- Redis
- Elasticsearch
- Object Storage

Infrastructure Layer

- Docker
- Cloudflare
- Nginx
- Monitoring Stack

A more detailed explanation of each layer is provided later in this document.

---

# 3. Vision & Goals

## 3.1 Vision

The vision of OmniCommerce is to build a modern, cloud-native enterprise e-commerce platform capable of supporting multiple business channels, independent development teams, and long-term scalability.

The platform aims to provide a unified ecosystem where web applications, mobile applications, backend services, and infrastructure components can evolve independently without introducing unnecessary coupling.

Rather than focusing solely on current business requirements, OmniCommerce is designed as a long-term foundation that can continuously expand through modular architecture and standardized engineering practices.

---

## 3.2 Mission

The mission of OmniCommerce is to provide a flexible and maintainable platform that enables organizations to deliver digital commerce experiences across multiple platforms while maintaining high availability, security, and performance.

The architecture is designed to support:

- Continuous product evolution
- Independent team collaboration
- Rapid feature delivery
- High system reliability
- Enterprise-grade scalability

---

## 3.3 Long-Term Goals

The platform is designed to achieve the following long-term objectives.

### Business Goals

- Support multiple business domains.
- Support multiple client applications.
- Enable rapid business expansion.
- Minimize operational complexity.
- Accelerate product delivery.

---

### Technical Goals

- Independent deployment
- Loose coupling
- High cohesion
- Cloud-native architecture
- Domain-oriented services
- API-first development
- Event-driven communication
- Horizontal scalability
- High observability

---

### Engineering Goals

- Clean project organization
- Shared engineering standards
- Consistent architecture
- Reusable components
- Automated testing
- Automated deployment
- Comprehensive documentation

---

## 3.4 Non-Goals

The following objectives are intentionally outside the scope of the platform architecture.

- Supporting legacy systems
- Supporting multiple databases for a single business domain
- Tight coupling between frontend and backend
- Shared databases across unrelated services
- Direct service-to-database access from external applications

These constraints help maintain architectural consistency throughout the platform.

---

# 4. Architecture Principles

The architecture of OmniCommerce is guided by a set of engineering principles that influence every technical decision across the platform.

These principles are intentionally technology-independent and remain applicable regardless of future implementation changes.

---

## 4.1 Domain-Oriented Design

The system is organized around business domains rather than technical layers.

Each service owns its own business capability and data model.

Examples include:

- Authentication
- Product Catalog
- Inventory
- Orders
- Payments
- Shipping
- Notifications
- Search

Each domain should evolve independently with minimal dependencies on other domains.

---

## 4.2 Separation of Concerns

Every component within the platform has a clearly defined responsibility.

Examples include:

Frontend

Responsible for user interaction and presentation.

Backend for Frontend

Responsible for client-specific API composition.

API Gateway

Responsible for routing, authentication, rate limiting, and request forwarding.

Microservices

Responsible for business logic.

Infrastructure

Responsible for deployment, networking, storage, monitoring, and operations.

No component should assume responsibilities that belong to another layer.

---

## 4.3 Loose Coupling

Services communicate through well-defined interfaces instead of direct implementation knowledge.

Loose coupling enables:

- Independent deployment
- Easier maintenance
- Reduced regression risk
- Better scalability
- Technology flexibility

Communication should always occur through:

- REST APIs
- Asynchronous events
- Shared contracts

Never through shared databases or direct source code dependencies.

---

## 4.4 High Cohesion

Each application or service should focus on a single business capability.

Examples

Product Service

Responsible only for:

- Product Catalog
- Categories
- Brands
- Product Attributes

Order Service

Responsible only for:

- Orders
- Order Status
- Order History

Notification Service

Responsible only for:

- Email
- Push Notifications
- SMS
- Web Notifications

This approach simplifies maintenance and future enhancements.

---

## 4.5 API-First Development

All communication between applications must occur through well-defined APIs.

Every public API should be designed before implementation.

Benefits include:

- Consistent integration
- Independent development
- Better documentation
- Easier testing
- Clear contracts

---

## 4.6 Event-Driven Communication

Business events should be used whenever immediate synchronous communication is unnecessary.

Examples include:

Order Created

↓

Inventory Updated

↓

Notification Sent

↓

Analytics Recorded

↓

Recommendation Updated

This architecture reduces service dependencies while improving scalability.

---

## 4.7 Independent Deployability

Every deployable application should be independently released.

Examples include:

- Customer Web
- Admin Portal
- Flutter Mobile
- Customer BFF
- Product Service
- Inventory Service

Deployment of one application should not require redeployment of unrelated applications.

---

## 4.8 Shared Standards

Although services are independent, engineering standards remain consistent across the platform.

Shared standards include:

- Coding conventions
- API conventions
- Error handling
- Logging
- Validation
- Documentation
- Authentication
- Monitoring

Consistency improves maintainability across multiple teams.

---

## 4.9 Security by Design

Security is considered from the beginning of system design rather than added after implementation.

Examples include:

- JWT Authentication
- Refresh Tokens
- Role-Based Access Control
- API Gateway Validation
- HTTPS Everywhere
- Secure Secrets Management
- Principle of Least Privilege

---

## 4.10 Observability First

Every application should expose sufficient operational information for troubleshooting and monitoring.

Applications should provide:

- Structured Logs
- Metrics
- Health Checks
- Distributed Tracing
- Error Reporting

Observability enables faster incident detection and system maintenance.

---

# 5. High-Level Architecture

## 5.1 Overview

OmniCommerce follows a layered enterprise architecture composed of multiple independent applications that collaborate through standardized communication channels.

The system separates presentation, client orchestration, business logic, data storage, and infrastructure into independent architectural layers.

This separation improves maintainability, scalability, and operational flexibility.

---

## 5.2 Architectural Style

The platform combines several architectural styles.

| Architecture | Purpose |
|--------------|---------|
| Microservices | Independent business capabilities |
| Microfrontend | Independent frontend modules |
| Backend for Frontend (BFF) | Client-specific API composition |
| API Gateway | Centralized request routing |
| Event-Driven Architecture | Asynchronous business communication |
| Layered Architecture | Clear separation of responsibilities |
| Cloud-Native Architecture | Scalable deployment and infrastructure |

Each architectural style addresses a different concern and complements the others rather than replacing them.

---

## 5.3 Primary Components

The platform is composed of six primary component groups.

### Client Applications

Applications directly used by end users.

Includes:

- Customer Web
- Admin Portal
- Seller Portal
- Flutter Mobile Application

---

### Presentation Layer

Responsible for rendering user interfaces.

Includes:

- Shell Application
- Microfrontends

---

### Backend Layer

Responsible for API orchestration and business processing.

Includes:

- Customer BFF
- Admin BFF
- Seller BFF
- API Gateway
- Microservices

---

### Data Layer

Responsible for persistent storage and caching.

Includes:

- PostgreSQL
- Redis
- Elasticsearch
- Object Storage

---

### Messaging Layer

Responsible for asynchronous communication.

Includes:

- RabbitMQ

---

### Infrastructure Layer

Responsible for deployment, networking, monitoring, and operations.

Includes:

- Cloudflare
- Nginx
- Docker
- Monitoring Stack

---

## 5.4 Component Relationships

At a high level, client applications communicate with Backend for Frontend services.

Backend for Frontend services communicate with the API Gateway.

The API Gateway routes requests to the appropriate business services.

Business services interact with databases, caches, search engines, and messaging systems according to business requirements.

Infrastructure services provide networking, deployment, monitoring, and operational support for the entire platform.

---

## 5.5 Design Benefits

This architecture provides several advantages.

### Scalability

Individual services can scale independently based on workload.

---

### Maintainability

Business domains remain isolated, reducing system complexity.

---

### Flexibility

New services or applications can be introduced without affecting unrelated components.

---

### Independent Development

Multiple engineering teams can work simultaneously across different domains.

---

### Technology Evolution

Specific components can adopt newer technologies without requiring a complete platform redesign.

---

# 6. Architecture Layers

## 6.1 Overview

OmniCommerce adopts a layered architecture that separates responsibilities across multiple logical layers.

Each layer has a clearly defined purpose and communicates only with adjacent layers through well-defined interfaces.

This approach improves maintainability, scalability, security, and long-term extensibility while minimizing coupling between independent components.

The platform is composed of the following layers:

1. Client Layer
2. Edge Layer
3. Presentation Layer
4. Backend for Frontend Layer
5. API Gateway Layer
6. Business Layer
7. Data & Messaging Layer
8. Infrastructure & Observability Layer

---

## 6.2 Layer Responsibilities

| Layer | Primary Responsibility |
|--------|------------------------|
| Client Layer | User interaction |
| Edge Layer | Traffic management and protection |
| Presentation Layer | User interface rendering |
| Backend for Frontend | Client-specific API composition |
| API Gateway | Request routing and centralized cross-cutting concerns |
| Business Layer | Business logic implementation |
| Data & Messaging Layer | Data persistence and asynchronous communication |
| Infrastructure & Observability | Deployment, networking, monitoring, and operations |

Each layer focuses on a single architectural responsibility.

---

# 6.3 Client Layer

## Purpose

The Client Layer represents every application directly used by end users.

It is responsible for providing user experiences optimized for different platforms while consuming the same backend ecosystem.

---

## Components

### Customer Web

Provides the primary shopping experience.

Responsibilities include:

- Product browsing
- Search
- Shopping cart
- Checkout
- Order history
- Wishlist
- User profile

---

### Admin Portal

Provides internal management capabilities.

Responsibilities include:

- Dashboard
- Catalog management
- Inventory management
- Order management
- Customer management
- Reports
- Analytics

---

### Seller Portal

Provides merchant management functionality.

Responsibilities include:

- Product management
- Store management
- Order fulfillment
- Revenue overview
- Promotions

---

### Flutter Mobile Application

Provides a native mobile shopping experience.

Responsibilities include:

- Authentication
- Product browsing
- Checkout
- Push notifications
- Order tracking
- Profile management

---

## Responsibilities

The Client Layer should only contain:

- User interaction
- Navigation
- Form validation
- UI rendering
- Local state management

The Client Layer must never contain:

- Business rules
- Database access
- Authentication logic
- Authorization decisions
- Infrastructure concerns

---

# 6.4 Edge Layer

## Purpose

The Edge Layer acts as the public entry point into the platform.

It protects internal services while improving performance, availability, and security.

---

## Components

### Cloudflare

Responsible for:

- DNS
- CDN
- SSL
- WAF
- DDoS Protection
- Edge Caching

---

### Nginx

Responsible for:

- Reverse Proxy
- Static Asset Delivery
- Compression
- Load Balancing
- Request Forwarding

---

## Responsibilities

The Edge Layer is responsible for:

- Receiving external traffic
- SSL termination
- Traffic filtering
- Static content optimization
- Forwarding requests to internal applications

The Edge Layer must not contain business logic.

---

# 6.5 Presentation Layer

## Purpose

The Presentation Layer is responsible for rendering the user interface.

It provides a modular frontend architecture using a Shell Application and multiple Microfrontends.

---

## Components

### Shell Application

The Shell serves as the host application.

Responsibilities include:

- Application bootstrap
- Global routing
- Authentication state
- Shared layout
- Theme management
- Shared providers
- Loading Microfrontends

The Shell intentionally contains minimal business logic.

---

### Microfrontends

Each Microfrontend owns a single business domain.

Examples include:

- Catalog
- Cart
- Checkout
- Orders
- Account
- Dashboard
- Inventory

Each Microfrontend can evolve independently without affecting unrelated modules.

---

## Responsibilities

The Presentation Layer is responsible for:

- Rendering pages
- User interaction
- Navigation
- API consumption through BFF
- Local UI state

The Presentation Layer must not communicate directly with databases or backend services.

---

# 6.6 Backend for Frontend Layer

## Purpose

Backend for Frontend (BFF) provides APIs tailored for specific client applications.

Instead of exposing raw backend services directly to frontend applications, the BFF aggregates, transforms, and optimizes responses for each client.

---

## Components

### Customer BFF

Optimized for:

- Customer Web
- Flutter Mobile

---

### Admin BFF

Optimized for:

- Administrative operations
- Reporting
- Internal management

---

### Seller BFF

Optimized for:

- Merchant operations
- Store management
- Sales management

---

## Responsibilities

The BFF layer is responsible for:

- API aggregation
- Response transformation
- Client-specific validation
- API orchestration
- Request composition
- Lightweight caching
- Client-specific authorization

The BFF layer should not contain core business logic.

Business rules remain within the Business Layer.

---

# 6.7 API Gateway Layer

## Purpose

The API Gateway acts as the single entry point for all backend services.

It centralizes cross-cutting concerns while routing requests to the appropriate business service.

---

## Responsibilities

The API Gateway is responsible for:

- Request routing
- JWT validation
- Authorization
- Rate limiting
- API versioning
- Request logging
- Correlation IDs
- Service discovery
- Health checks

The Gateway should never implement domain-specific business logic.

---

# 6.8 Business Layer

## Purpose

The Business Layer contains the core business capabilities of the platform.

Each business domain is implemented as an independent microservice with its own lifecycle and ownership.

---

## Example Services

Authentication Service

Responsible for:

- Login
- Registration
- Refresh Tokens
- Roles
- Permissions

---

Product Service

Responsible for:

- Products
- Categories
- Brands
- Product Variants
- Attributes

---

Inventory Service

Responsible for:

- Warehouse inventory
- Stock updates
- Reservations
- Inventory synchronization

---

Order Service

Responsible for:

- Order creation
- Order lifecycle
- Order history
- Order status

---

Payment Service

Responsible for:

- Payment processing
- Payment status
- Refund requests
- Transaction records

---

Shipping Service

Responsible for:

- Shipping methods
- Shipment tracking
- Delivery status

---

Notification Service

Responsible for:

- Email
- Push notifications
- SMS
- In-app notifications

---

Search Service

Responsible for:

- Product indexing
- Search queries
- Search suggestions
- Filtering

---

Analytics Service

Responsible for:

- Business metrics
- Sales reports
- User behavior
- Operational statistics

---

## Responsibilities

Each service owns:

- Business rules
- Domain models
- Data persistence
- Domain events

Services should remain independent and communicate only through APIs or asynchronous events.

---

# 6.9 Data & Messaging Layer

## Purpose

The Data & Messaging Layer provides persistent storage, caching, search capabilities, and asynchronous communication.

---

## PostgreSQL

Primary relational database.

Responsible for:

- Transactional data
- Business entities
- Data consistency

---

## Redis

In-memory data store.

Responsible for:

- Caching
- Session storage
- Rate limiting
- Temporary data

---

## Elasticsearch

Search engine.

Responsible for:

- Full-text search
- Product indexing
- Search analytics

---

## Object Storage

Development

- MinIO

Production

- Cloudflare R2

Responsible for:

- Images
- Documents
- Media assets
- Static resources

---

## RabbitMQ

Responsible for asynchronous communication.

Example events include:

- OrderCreated
- PaymentCompleted
- InventoryUpdated
- ProductIndexed
- EmailRequested

Using asynchronous messaging reduces coupling between services and improves scalability.

---

# 6.10 Infrastructure & Observability Layer

## Purpose

The Infrastructure & Observability Layer supports deployment, networking, monitoring, logging, and operational management across the entire platform.

This layer ensures that applications remain reliable, observable, and scalable throughout their lifecycle.

---

## Infrastructure Components

Deployment

- Docker

Future Roadmap

- Kubernetes

Networking

- Cloudflare
- Nginx

---

## Monitoring

Responsible for collecting operational metrics.

Technology:

- Prometheus

---

## Visualization

Responsible for displaying system metrics.

Technology:

- Grafana

---

## Logging

Responsible for centralized log aggregation.

Technology:

- Loki

Application Logging

- Pino

---

## Distributed Tracing

Responsible for request tracing across multiple services.

Technology:

- Tempo

---

## Responsibilities

The Infrastructure & Observability Layer is responsible for:

- Deployment
- Monitoring
- Logging
- Metrics collection
- Distributed tracing
- Alerting
- Operational visibility

This layer operates independently from business logic while providing essential operational support for the entire platform.

---

# 6.11 Layer Communication Rules

To maintain architectural consistency, communication between layers follows strict rules.

| From | To | Allowed |
|------|----|----------|
| Client | Edge | ✅ |
| Edge | Presentation | ✅ |
| Presentation | BFF | ✅ |
| BFF | API Gateway | ✅ |
| API Gateway | Business Services | ✅ |
| Business Services | Data Layer | ✅ |
| Business Services | RabbitMQ | ✅ |
| Business Services | Other Services (API/Event) | ✅ |

The following interactions are prohibited:

- Client → Database
- Client → Microservice
- Presentation → Database
- Presentation → RabbitMQ
- BFF → Database
- API Gateway → Database
- Microservice → Another Service's Database

All inter-service communication must occur through public APIs or asynchronous events to preserve service boundaries and maintain loose coupling.

---

# 7. Repository Structure

## 7.1 Overview

OmniCommerce is organized as a **Monorepo**, allowing all applications, services, shared libraries, infrastructure, and documentation to reside within a single repository.

This approach promotes:

- Consistent development standards
- Shared tooling
- Simplified dependency management
- Unified CI/CD
- Easier code sharing
- Independent deployment

Although the repository is centralized, every deployable application remains logically independent.

---

## 7.2 Repository Structure

```text
omnicommerce/

apps/
├── frontend/
├── mobile/
├── bff/
└── backend/

packages/

infra/

docs/

scripts/

.github/

assets/

README.md
```

---

## 7.3 Root Directories

### apps/

Contains every deployable application.

This directory includes:

- Web Applications
- Flutter Mobile Application
- Backend for Frontend services
- API Gateway
- Business Microservices

Each application owns its own lifecycle, dependencies, configuration, and deployment process.

---

### packages/

Contains reusable libraries shared across multiple applications.

Unlike applications inside `apps/`, packages are **not deployable**.

Packages provide reusable functionality that helps eliminate duplicated code throughout the repository.

---

### infra/

Contains infrastructure resources used to deploy and operate the platform.

Examples include:

- Docker
- Kubernetes
- Reverse Proxy
- Monitoring
- Infrastructure as Code

No business logic should exist inside this directory.

---

### docs/

Contains all technical documentation.

Examples include:

- System Architecture
- Frontend Architecture
- Backend Architecture
- Database Design
- Deployment Guides
- ADRs

---

### scripts/

Contains automation scripts.

Examples include:

- Build scripts
- Development utilities
- Release scripts
- Database scripts
- Environment setup

---

### .github/

Contains GitHub-specific configuration.

Examples include:

- GitHub Actions
- Issue Templates
- Pull Request Templates
- Dependabot

---

### assets/

Contains shared project assets.

Examples include:

- Logos
- Architecture Images
- Diagrams
- Documentation Resources

---

# 8. Applications Overview

## 8.1 Overview

Applications represent independently deployable software units within the platform.

Each application owns a specific responsibility and should remain independent from unrelated applications.

Applications are categorized into four major groups:

- Frontend Applications
- Mobile Applications
- Backend for Frontend Applications
- Backend Services

---

# 8.2 Frontend Applications

Location

```text
apps/frontend/
```

The frontend platform adopts a **Microfrontend Architecture**.

Rather than building a single large frontend application, the platform is divided into multiple independent frontend modules.

---

## Shell Application

Directory

```text
apps/frontend/shell
```

### Responsibility

The Shell Application serves as the host application for all Microfrontends.

It provides common platform capabilities including:

- Application Bootstrap
- Global Routing
- Shared Layout
- Authentication Context
- Theme
- Global Providers
- Module Registration
- Navigation

The Shell intentionally contains very little business logic.

---

## Customer Microfrontends

Examples

```text
catalog

cart

checkout

account

orders

search
```

Each Microfrontend owns an independent business domain.

Responsibilities include:

- UI Rendering
- Local State
- Domain Components
- Domain Routing
- API Consumption through BFF

---

## Admin Microfrontends

Examples

```text
dashboard

catalog

inventory

orders

customers

analytics
```

Admin Microfrontends provide internal management functionality.

---

## Seller Microfrontends

Examples

```text
dashboard

products

orders

shipping

finance
```

Seller applications are optimized for merchant operations.

---

# 8.3 Mobile Application

Location

```text
apps/mobile/flutter
```

---

## Overview

The mobile platform is implemented using Flutter.

Unlike the web platform, Flutter is not part of the Microfrontend ecosystem.

Instead, it is developed as an independent native application while consuming the same backend ecosystem through the Customer BFF.

---

## Responsibilities

The Flutter application provides:

- Authentication
- Product Browsing
- Search
- Shopping Cart
- Checkout
- Order Tracking
- Wishlist
- User Profile
- Notifications

---

## Shared Resources

The mobile application shares logical contracts with the web platform through:

- API Specifications
- DTO Contracts
- Authentication Standards
- SDK Interfaces
- Shared Business Rules

User interface components are **not shared** between Flutter and React.

---

# 8.4 Backend for Frontend Applications

Location

```text
apps/bff/
```

---

## Overview

Backend for Frontend (BFF) applications provide APIs optimized for specific client platforms.

Rather than exposing raw backend services directly, each BFF aggregates and transforms data according to client needs.

---

## Customer BFF

Supports

- Customer Web
- Flutter Mobile

Responsibilities

- Aggregate Product APIs
- Aggregate Cart APIs
- Checkout APIs
- Customer Authentication
- Customer Profile
- Response Transformation

---

## Admin BFF

Supports

- Admin Portal

Responsibilities

- Dashboard APIs
- Management APIs
- Reporting APIs
- Analytics APIs

---

## Seller BFF

Supports

- Seller Portal

Responsibilities

- Merchant APIs
- Store APIs
- Revenue APIs
- Order APIs

---

# 8.5 Backend Services

Location

```text
apps/backend/
```

---

## Overview

Backend services implement the core business capabilities of the platform.

Each service owns its own domain, business logic, persistence, and deployment lifecycle.

Services communicate through REST APIs and asynchronous events.

---

## Core Services

Examples include:

Authentication Service

Responsible for identity management.

---

User Service

Responsible for user profiles and customer information.

---

Product Service

Responsible for product catalog management.

---

Inventory Service

Responsible for stock management.

---

Cart Service

Responsible for shopping cart operations.

---

Order Service

Responsible for order lifecycle management.

---

Payment Service

Responsible for payment processing.

---

Shipping Service

Responsible for shipment management.

---

Promotion Service

Responsible for discounts, vouchers, and campaigns.

---

Search Service

Responsible for search indexing and querying.

---

Notification Service

Responsible for notifications across all channels.

---

Analytics Service

Responsible for business analytics and reporting.

---

Media Service

Responsible for media uploads and asset management.

---

# 9. Shared Packages

## 9.1 Overview

Shared packages provide reusable functionality that can be consumed by multiple applications.

Packages improve consistency while reducing duplicated implementation across the repository.

Packages are libraries rather than deployable applications.

---

## 9.2 Package Organization

```text
packages/

auth/

config/

constants/

database/

dto/

events/

logger/

sdk/

types/

ui/

utils/

validation/

eslint-config/

tsconfig/
```

---

## auth/

Provides reusable authentication utilities.

Examples include:

- JWT Helpers
- Permission Utilities
- Role Definitions
- Authentication Middleware
- Authorization Helpers

Used by:

- Frontend
- Flutter
- BFF
- Backend Services

---

## config/

Provides centralized configuration management.

Examples include:

- Environment Configuration
- Redis Configuration
- Database Configuration
- RabbitMQ Configuration
- Storage Configuration

---

## constants/

Contains global constants shared across applications.

Examples include:

- Roles
- Permissions
- Routes
- Header Names
- Error Codes
- Event Names

---

## database/

Provides shared database-related utilities.

Examples include:

- Database Client
- Shared Helpers
- Common Repository Utilities

Business entities should remain inside their owning services.

---

## dto/

Contains shared request and response contracts.

Examples include:

- Authentication DTOs
- Product DTOs
- Order DTOs
- Pagination DTOs

DTOs define communication contracts rather than business logic.

---

## events/

Defines event contracts used for asynchronous communication.

Examples include:

- OrderCreated
- PaymentCompleted
- InventoryUpdated
- UserRegistered

---

## logger/

Provides standardized logging.

Examples include:

- Logger Factory
- Request Logger
- Correlation ID
- Log Formatters

---

## sdk/

Provides reusable API SDKs.

Examples include:

- Product SDK
- Order SDK
- Payment SDK
- User SDK

The SDK simplifies communication between client applications and backend services.

---

## types/

Contains shared TypeScript types.

Examples include:

- Common Types
- Pagination
- API Responses
- Generic Models

---

## ui/

Provides reusable React UI components.

Examples include:

- Button
- Modal
- Table
- Dialog
- Input
- Theme Components

This package is used exclusively by React-based web applications.

Flutter maintains its own design system.

---

## utils/

Contains general-purpose utilities.

Examples include:

- Date Utilities
- Currency Formatting
- Slug Generation
- UUID Helpers
- String Utilities

---

## validation/

Provides reusable validation schemas.

Examples include:

- Zod Schemas
- Common Validators
- Shared Validation Rules

---

## eslint-config/

Provides shared ESLint configuration for the entire workspace.

---

## tsconfig/

Provides shared TypeScript configuration.

---

# 10. Technology Stack

## 10.1 Overview

The technology stack is selected based on long-term maintainability, scalability, developer experience, and ecosystem maturity.

Every technology introduced into the platform should provide clear architectural value rather than increasing unnecessary complexity.

---

## 10.2 Technology Stack

| Layer | Technology |
|--------|------------|
| Web Frontend | React 19 |
| Framework | Next.js |
| Microfrontend | Module Federation |
| Styling | Tailwind CSS |
| UI Components | Shadcn UI |
| Forms | React Hook Form |
| Validation | Zod |
| Data Fetching | TanStack Query |
| State Management | Zustand |
| Mobile | Flutter |
| Mobile State | Riverpod |
| Mobile Networking | Dio |
| Mobile Routing | GoRouter |
| Backend Framework | NestJS |
| API Pattern | REST API |
| Architecture | Microservices |
| Client API Layer | Backend for Frontend |
| Gateway | API Gateway |
| Database | PostgreSQL |
| Cache | Redis |
| Search Engine | Elasticsearch |
| Object Storage (Development) | MinIO |
| Object Storage (Production) | Cloudflare R2 |
| Message Broker | RabbitMQ |
| Authentication | JWT + Refresh Token |
| Authorization | RBAC |
| Containerization | Docker |
| Reverse Proxy | Nginx |
| CDN & Edge | Cloudflare |
| Monitoring | Prometheus |
| Visualization | Grafana |
| Logging | Loki + Pino |
| Distributed Tracing | Tempo |
| Version Control | Git |
| CI/CD | GitHub Actions |

---

## 10.3 Technology Selection Principles

Technology choices follow these principles:

- Mature ecosystem
- Strong community support
- Long-term maintainability
- Cloud-native compatibility
- High scalability
- Excellent developer experience
- Enterprise adoption
- Low operational complexity

Technology selection is driven by architectural requirements rather than trends.

---