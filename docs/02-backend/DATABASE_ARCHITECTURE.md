# Database Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Database Architecture Document (DAD)  
> **Last Updated:** July 2026  
> **Owner:** Backend & Data Architecture Team  

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Persistence & Data Architecture Layer |
| Primary Database | PostgreSQL 16 (Relational System of Record) |
| In-Memory Datastore | Redis 7.2 (Caching, Distributed Locking, Cart, BullMQ Queues) |
| Search Engine | Elasticsearch 8.x (Full-Text Search & Catalog Aggregations) |
| Time-Series Engine | TimescaleDB / PostgreSQL Hyper-tables (Analytics & Metric Rollups) |
| Object Storage | MinIO / Cloudflare R2 / AWS S3 (Binary Media & Labels) |
| ORM & Migrations | Prisma ORM 5.x |
| Audience | Software Architects, Backend Engineers, Database Administrators, DevOps Engineers |

---

# Table of Contents

- [1. Executive Overview & Database Architecture Philosophy](#1-executive-overview--database-architecture-philosophy)
  - [1.1 Purpose & Scope](#11-purpose--scope)
  - [1.2 Polyglot Persistence Topology](#12-polyglot-persistence-topology)
  - [1.3 Database-per-Service & Data Isolation](#13-database-per-service--data-isolation)
  - [1.4 Single Source of Truth & Derived Data Isolation](#14-single-source-of-truth--derived-data-isolation)
  - [1.5 Cross-Service Consistency & Outbox Pattern](#15-cross-service-consistency--outbox-pattern)
- [2. Global Database Engineering Standards](#2-global-database-engineering-standards)
  - [2.1 Primary Keys & Identifier Strategy](#21-primary-keys--identifier-strategy)
  - [2.2 Standard Audit Columns](#22-standard-audit-columns)
  - [2.3 Financial & Currency Precision Standard](#23-financial--currency-precision-standard)
  - [2.4 Prisma ORM Conventions & Migration Governance](#24-prisma-orm-conventions--migration-governance)
  - [2.5 Indexing Strategy & Naming Conventions](#25-indexing-strategy--naming-conventions)
  - [2.6 Outbox Pattern Database Schema Standard](#26-outbox-pattern-database-schema-standard)
- [3. Microservice Database Schemas](#3-microservice-database-schemas)
  - [3.1 Auth Service (`auth_db` - PostgreSQL)](#31-auth-service-auth_db---postgresql)
  - [3.2 User Service (`user_db` - PostgreSQL)](#32-user-service-user_db---postgresql)
  - [3.3 Product Catalog Service (`product_db` - PostgreSQL)](#33-product-catalog-service-product_db---postgresql)
  - [3.4 Inventory Service (`inventory_db` - PostgreSQL)](#34-inventory-service-inventory_db---postgresql)
  - [3.5 Cart Service (`cart_db` - Redis & PostgreSQL)](#35-cart-service-cart_db---redis--postgresql)
  - [3.6 Order Service (`order_db` - PostgreSQL)](#36-order-service-order_db---postgresql)
  - [3.7 Payment Service (`payment_db` - PostgreSQL)](#37-payment-service-payment_db---postgresql)
  - [3.8 Shipping Service (`shipping_db` - PostgreSQL)](#38-shipping-service-shipping_db---postgresql)
  - [3.9 Promotion Service (`promotion_db` - PostgreSQL & Redis)](#39-promotion-service-promotion_db---postgresql--redis)
  - [3.10 Review Service (`review_db` - PostgreSQL)](#310-review-service-review_db---postgresql)
  - [3.11 Notification Service (`notification_db` - PostgreSQL & Redis)](#311-notification-service-notification_db---postgresql--redis)
  - [3.12 Media Service (`media_db` - PostgreSQL & Object Storage)](#312-media-service-media_db---postgresql--object-storage)
  - [3.13 Analytics Service (`analytics_db` - TimescaleDB)](#313-analytics-service-analytics_db---timescaledb)
  - [3.14 Search Service Engine (`omni_products_v1` - Elasticsearch 8.x)](#314-search-service-engine-omni_products_v1---elasticsearch-8x)
- [4. High Availability, Scaling & Connection Management](#4-high-availability-scaling--connection-management)
  - [4.1 Connection Pooling (PgBouncer Strategy)](#41-connection-pooling-pgbouncer-strategy)
  - [4.2 Read Replicas & Read/Write Separation](#42-read-replicas--readwrite-separation)
  - [4.3 Redis Caching Topology & Eviction Policies](#43-redis-caching-topology--eviction-policies)
  - [4.4 Database Sharding & Partitioning Strategy](#44-database-sharding--partitioning-strategy)
- [5. Database Security, Compliance & Backup Policy](#5-database-security-compliance--backup-policy)
  - [5.1 Encryption at Rest & In Transit](#51-encryption-at-rest--in-transit)
  - [5.2 PII Protection & Data Scrubbing Standards](#52-pii-protection--data-scrubbing-standards)
  - [5.3 Backup, Point-in-Time Recovery (PITR) & Disaster Recovery](#53-backup-point-in-time-recovery-pitr--disaster-recovery)
  - [5.4 Zero-Downtime Schema Migrations](#54-zero-downtime-schema-migrations)
- [6. Related Documents & References](#6-related-documents--references)

---

# 1. Executive Overview & Database Architecture Philosophy

## 1.1 Purpose & Scope

This document defines the comprehensive **Database Architecture** for the **OmniCommerce** platform. It provides the definitive technical blueprint for storage engine choices, data isolation boundaries, relational database schemas (Prisma ORM models), indexing strategies, caching layers, search engine mappings, time-series data structures, and cross-service data consistency patterns.

This specification covers every backend business microservice in OmniCommerce:
- **Auth Service** (`auth_db`)
- **User Service** (`user_db`)
- **Product Catalog Service** (`product_db`)
- **Inventory Service** (`inventory_db`)
- **Cart Service** (`cart_db`)
- **Order Service** (`order_db`)
- **Payment Service** (`payment_db`)
- **Shipping Service** (`shipping_db`)
- **Promotion Service** (`promotion_db`)
- **Review Service** (`review_db`)
- **Notification Service** (`notification_db`)
- **Media Management Service** (`media_db`)
- **Analytics Service** (`analytics_db`)
- **Search Service Engine** (`omni_products_v1`)

---

## 1.2 Polyglot Persistence Topology

OmniCommerce adopts a **Polyglot Persistence** model, utilizing specialized storage engines optimized for specific workload profiles:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              OmniCommerce Storage Engines                              │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────────┤
│ PostgreSQL 16     │ Redis 7.2         │ Elasticsearch 8.x │ TimescaleDB                │
│ (System of Record)│ (Cache/State/Lock)│ (Search/Discovery)│ (Analytics Time-Series)    │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Relational ACID   │ In-Memory Key-Val │ Inverted Index    │ Hyper-table Partitioning   │
│ Users, Products,  │ Cart, Sessions,   │ Product Catalog,  │ Revenue Rollups, Telemetry,│
│ Orders, Payments  │ Locks, Rate-Limit │ Facets, Auto-comp │ PII-scrubbed Event Log     │
└───────────────────┴───────────────────┴───────────────────┴────────────────────────────┘
```

---

## 1.3 Database-per-Service & Data Isolation

As defined in `ARCHITECTURE_PRINCIPLES.md` (Section 3.8), OmniCommerce enforces strict **Database-per-Service** isolation:
1. Each microservice owns its data store exclusively.
2. Direct cross-database SQL joins, shared tables, or foreign key constraints between microservice databases are **strictly prohibited**.
3. All inter-service data access occurs via explicit HTTP/REST APIs or asynchronous domain events (RabbitMQ).

---

## 1.4 Single Source of Truth & Derived Data Isolation

1. **PostgreSQL** is the sole authoritative System of Record (SoR) for transactional domain state.
2. **Redis** and **Elasticsearch** contain derived or cached representations.
3. Auxiliary search indexes and cache keys must be design-safe to be purged and fully rebuilt from PostgreSQL without data loss.

---

## 1.5 Cross-Service Consistency & Outbox Pattern

Distributed transactions across microservices achieve **Eventual Consistency** using the **Transactional Outbox Pattern** and RabbitMQ domain events:

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                          Transactional Outbox Flow                             │
│                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────┐   │
│   │                      PostgreSQL Service Database                       │   │
│   │  ┌───────────────────────────────┐   ┌──────────────────────────────┐  │   │
│   │  │    Domain Entity Mutation     │   │     `outbox_events` Table    │  │   │
│   │  │   (e.g., INSERT INTO orders)  │   │   (INSERT INTO outbox_events)│  │   │
│   │  └───────────────┬───────────────┘   └──────────────┬───────────────┘  │   │
│   │                  └───────────────┬──────────────────┘                  │   │
│   │                         Atomic Local Transaction                       │   │
│   └──────────────────────────────────┬─────────────────────────────────────┘   │
│                                      │ Polling / CDC Relay                     │
│                                      ▼                                         │
│                             ┌─────────────────┐                                │
│                             │ Message Relay   │                                │
│                             └────────┬────────┘                                │
│                                      │ AMQP Publish                            │
│                                      ▼                                         │
│                             ┌─────────────────┐                                │
│                             │ RabbitMQ Broker │                                │
│                             └─────────────────┘                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Global Database Engineering Standards

## 2.1 Primary Keys & Identifier Strategy

All primary key columns in OmniCommerce PostgreSQL databases must use **UUIDv4** string identifiers or **CUID2** for collision resistance and security against enumeration attacks.

```prisma
id String @id @default(uuid()) @db.Uuid
```

*Exception:* TimescaleDB time-series hyper-tables use composite keys containing `(timestamp, id)`.

---

## 2.2 Standard Audit Columns

Every domain table across all databases must include the following audit fields:

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `created_at` | `DateTime` | `default(now())`, `@db.Timestamptz(6)` | Creation timestamp (UTC) |
| `updated_at` | `DateTime` | `@updatedAt`, `@db.Timestamptz(6)` | Last modification timestamp (UTC) |
| `deleted_at` | `DateTime?` | `@db.Timestamptz(6)`, Nullable | Soft-deletion timestamp (Null = Active) |

---

## 2.3 Financial & Currency Precision Standard

Financial values (prices, sub-totals, discounts, taxes, totals, rates) must **NEVER** use floating-point types (`FLOAT`, `DOUBLE`). All monetary columns must use PostgreSQL `DECIMAL(12,4)` or `NUMERIC(12,4)` to prevent rounding errors.

```prisma
price Decimal @db.Decimal(12, 4)
```

---

## 2.4 Prisma ORM Conventions & Migration Governance

1. Model names must use **PascalCase** (`ProductVariant`).
2. Database table names must use **snake_case** mapped via `@@map` (`@@map("product_variants")`).
3. Database field names must use **snake_case** mapped via `@map` (`basePrice Decimal @map("base_price")`).
4. Schema migrations are created using `prisma migrate dev` and checked into git version control.

---

## 2.5 Indexing Strategy & Naming Conventions

Indexes must follow explicit naming standards:
- **Primary Key:** `pk_<table_name>`
- **Foreign Key Index:** `idx_<table_name>_<column_name>`
- **Composite Index:** `idx_<table_name>_<col1>_<col2>`
- **Unique Constraint:** `uq_<table_name>_<column_name>`

---

## 2.6 Outbox Pattern Database Schema Standard

Every microservice PostgreSQL database includes an `outbox_events` table:

```prisma
model OutboxEvent {
  id            String    @id @default(uuid()) @db.Uuid
  aggregateType String    @map("aggregate_type") @db.VarChar(64)
  aggregateId   String    @map("aggregate_id") @db.VarChar(64)
  eventType     String    @map("event_type") @db.VarChar(128)
  payloadJson   Json      @map("payload_json") @db.JsonB
  status        String    @default("PENDING") @db.VarChar(32) // PENDING, PUBLISHED, FAILED
  retryCount    Int       @default(0) @map("retry_count")
  lastError     String?   @map("last_error") @db.Text
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  publishedAt   DateTime? @map("published_at") @db.Timestamptz(6)

  @@index([status, createdAt], name: "idx_outbox_events_status_created")
  @@map("outbox_events")
}
```

---

# 3. Microservice Database Schemas

## 3.1 Auth Service (`auth_db` - PostgreSQL)

### 3.1.1 Overview & Responsibilities
- **Database Name:** `omni_auth_db`
- **Owner Service:** `auth-service` (Port `3001`)
- **Responsibilities:** User credential authentication, password hashing (Argon2id/Bcrypt), JWT refresh token lifecycle, password reset tokens, failed login lockout counters.

### 3.1.2 ER Conceptual Diagram
```text
  ┌──────────────┐         1:N         ┌──────────────────┐
  │    User      │ ───────────────────>│   RefreshToken   │
  └──────┬───────┘                     └──────────────────┘
         │
         │ 1:N                         ┌──────────────────┐
         └────────────────────────────>│  PasswordReset   │
                                       └──────────────────┘
```

### 3.1.3 Prisma Schema (`apps/backend/auth-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  CUSTOMER
  SELLER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

model AuthUser {
  id           String     @id @default(uuid()) @db.Uuid
  email        String     @unique @db.VarChar(255)
  passwordHash String     @map("password_hash") @db.VarChar(255)
  roles        UserRole[] @default([CUSTOMER])
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt    DateTime?  @map("deleted_at") @db.Timestamptz(6)

  refreshTokens  RefreshToken[]
  passwordResets PasswordReset[]

  @@index([email], name: "idx_auth_users_email")
  @@map("users")
}

model RefreshToken {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  tokenHash   String    @unique @map("token_hash") @db.VarChar(255)
  deviceIp    String?   @map("device_ip") @db.VarChar(45)
  userAgent   String?   @map("user_agent") @db.Text
  isRevoked   Boolean   @default(false) @map("is_revoked")
  expiresAt   DateTime  @map("expires_at") @db.Timestamptz(6)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  revokedAt   DateTime? @map("revoked_at") @db.Timestamptz(6)

  user AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId], name: "idx_refresh_tokens_user_id")
  @@index([tokenHash], name: "idx_refresh_tokens_hash")
  @@map("refresh_tokens")
}

model PasswordReset {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)
  isUsed    Boolean   @default(false) @map("is_used")
  expiresAt DateTime  @map("expires_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash], name: "idx_password_resets_hash")
  @@map("password_resets")
}
```

---

## 3.2 User Service (`user_db` - PostgreSQL)

### 3.2.1 Overview & Responsibilities
- **Database Name:** `omni_user_db`
- **Owner Service:** `user-service` (Port `3002`)
- **Responsibilities:** User profile information, delivery addresses (max 10 per user), default address management, user notification preferences.

### 3.2.2 ER Conceptual Diagram
```text
  ┌──────────────────┐       1:N       ┌──────────────────┐
  │   UserProfile    │────────────────>│ DeliveryAddress  │
  └────────┬─────────┘                 └──────────────────┘
           │
           │ 1:1                       ┌──────────────────┐
           └──────────────────────────>│ UserPreferences  │
                                       └──────────────────┘
```

### 3.2.3 Prisma Schema (`apps/backend/user-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("USER_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

model UserProfile {
  id          String    @id @default(uuid()) @db.Uuid // Matches AuthUser ID
  firstName   String    @map("first_name") @db.VarChar(100)
  lastName    String    @map("last_name") @db.VarChar(100)
  phone       String?   @db.VarChar(20)
  avatarUrl   String?   @map("avatar_url") @db.VarChar(512)
  gender      Gender?   @default(PREFER_NOT_TO_SAY)
  dateOfBirth DateTime? @map("date_of_birth") @db.Date
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  addresses   DeliveryAddress[]
  preferences UserPreferences?

  @@map("user_profiles")
}

model DeliveryAddress {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  recipientName String   @map("recipient_name") @db.VarChar(150)
  phone         String   @db.VarChar(20)
  streetAddress String   @map("street_address") @db.VarChar(255)
  city          String   @db.VarChar(100)
  state         String   @db.VarChar(100)
  postalCode    String   @map("postal_code") @db.VarChar(20)
  countryCode   String   @map("country_code") @db.VarChar(2)
  isDefault     Boolean  @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId], name: "idx_addresses_user_id")
  @@map("delivery_addresses")
}

model UserPreferences {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @unique @map("user_id") @db.Uuid
  emailEnabled     Boolean  @default(true) @map("email_enabled")
  smsEnabled       Boolean  @default(false) @map("sms_enabled")
  pushEnabled      Boolean  @default(true) @map("push_enabled")
  marketingEnabled Boolean  @default(false) @map("marketing_enabled")
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

---

## 3.3 Product Catalog Service (`product_db` - PostgreSQL)

### 3.3.1 Overview & Responsibilities
- **Database Name:** `omni_product_db`
- **Owner Service:** `product-service` (Port `3003`)
- **Responsibilities:** Product listings, product variants, SKU management, hierarchical categories (max depth 3), brands, product images.

### 3.3.2 ER Conceptual Diagram
```text
  ┌──────────────┐ 1:N ┌──────────────┐ 1:N ┌──────────────┐
  │   Category   │────>│   Product    │────>│  ProductSku  │
  └──────────────┘     └──────┬───────┘     └──────────────┘
                              │ 1:N         ┌──────────────┐
                              └────────────>│ ProductImage │
  ┌──────────────┐ 1:N        │             └──────────────┘
  │    Brand     │────────────┘
  └──────────────┘
```

### 3.3.3 Prisma Schema (`apps/backend/product-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("PRODUCT_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ProductStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  REJECTED
  ARCHIVED
}

model Category {
  id        String     @id @default(uuid()) @db.Uuid
  name      String     @db.VarChar(100)
  slug      String     @unique @db.VarChar(120)
  parentId  String?    @map("parent_id") @db.Uuid
  depth     Int        @default(1)
  createdAt DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@index([parentId], name: "idx_categories_parent_id")
  @@map("categories")
}

model Brand {
  id        String    @id @default(uuid()) @db.Uuid
  name      String    @unique @db.VarChar(100)
  slug      String    @unique @db.VarChar(120)
  logoUrl   String?   @map("logo_url") @db.VarChar(512)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  products Product[]

  @@map("brands")
}

model Product {
  id             String        @id @default(uuid()) @db.Uuid
  sellerId       String        @map("seller_id") @db.Uuid
  title          String        @db.VarChar(255)
  slug           String        @unique @db.VarChar(280)
  description    String        @db.Text
  basePrice      Decimal       @map("base_price") @db.Decimal(12, 4)
  salePrice      Decimal?      @map("sale_price") @db.Decimal(12, 4)
  categoryId     String        @map("category_id") @db.Uuid
  brandId        String?       @map("brand_id") @db.Uuid
  status         ProductStatus @default(PENDING_APPROVAL)
  averageRating  Decimal       @default(0.00) @map("average_rating") @db.Decimal(3, 2)
  reviewCount    Int           @default(0) @map("review_count")
  rejectionNotes String?       @map("rejection_notes") @db.Text
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?     @map("deleted_at") @db.Timestamptz(6)

  category Category       @relation(fields: [categoryId], references: [id])
  brand    Brand?         @relation(fields: [brandId], references: [id])
  skus     ProductSku[]
  images   ProductImage[]

  @@index([sellerId], name: "idx_products_seller_id")
  @@index([categoryId], name: "idx_products_category_id")
  @@index([status], name: "idx_products_status")
  @@map("products")
}

model ProductSku {
  id         String   @id @default(uuid()) @db.Uuid
  productId  String   @map("product_id") @db.Uuid
  sku        String   @unique @db.VarChar(64)
  attributes Json     @db.JsonB // e.g., {"color": "Red", "size": "XL"}
  price      Decimal  @db.Decimal(12, 4)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId], name: "idx_skus_product_id")
  @@map("product_skus")
}

model ProductImage {
  id        String   @id @default(uuid()) @db.Uuid
  productId String   @map("product_id") @db.Uuid
  imageUrl  String   @map("image_url") @db.VarChar(512)
  sortOrder Int      @default(0) @map("sort_order")
  isPrimary Boolean  @default(false) @map("is_primary")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}
```

---

## 3.4 Inventory Service (`inventory_db` - PostgreSQL)

### 3.4.1 Overview & Responsibilities
- **Database Name:** `omni_inventory_db`
- **Owner Service:** `inventory-service` (Port `3004`)
- **Responsibilities:** Physical stock levels per SKU, 15-minute temporary reservations for checkout, stock deduction upon payment, safety stock alerts (threshold: 5 units).

### 3.4.2 Prisma Schema (`apps/backend/inventory-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("INVENTORY_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ReservationStatus {
  RESERVED
  CONFIRMED
  RELEASED
  EXPIRED
}

model InventoryItem {
  id                String   @id @default(uuid()) @db.Uuid
  sku               String   @unique @db.VarChar(64)
  physicalQuantity  Int      @default(0) @map("physical_quantity")
  reservedQuantity  Int      @default(0) @map("reserved_quantity")
  safetyStock       Int      @default(5) @map("safety_stock")
  warehouseLocation String?  @map("warehouse_location") @db.VarChar(100)
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  reservations InventoryReservation[]

  @@index([sku], name: "idx_inventory_sku")
  @@map("inventory_items")
}

model InventoryReservation {
  id          String            @id @default(uuid()) @db.Uuid
  orderId     String            @map("order_id") @db.Uuid
  inventoryId String            @map("inventory_id") @db.Uuid
  sku         String            @db.VarChar(64)
  quantity    Int
  status      ReservationStatus @default(RESERVED)
  expiresAt   DateTime          @map("expires_at") @db.Timestamptz(6)
  createdAt   DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)

  item InventoryItem @relation(fields: [inventoryId], references: [id])

  @@index([orderId], name: "idx_reservations_order_id")
  @@index([expiresAt, status], name: "idx_reservations_expiry_status")
  @@map("inventory_reservations")
}
```

---

## 3.5 Cart Service (`cart_db` - Redis & PostgreSQL)

### 3.5.1 Overview & Responsibilities
- **Primary Datastore:** Redis 7.2 (Key-value hashes with TTL)
- **Secondary Datastore:** PostgreSQL (`omni_cart_db`) for cold storage sync.
- **Owner Service:** `cart-service` (Port `3005`)
- **Key Constraints:** Max 50 distinct items per cart, max 99 units per SKU.

### 3.5.2 Redis Data Model
- **Authenticated Cart Key:** `cart:{userId}` (Hash key, 30-day TTL)
- **Guest Cart Key:** `cart:guest:{guestCartId}` (Hash key, 7-day TTL)

```json
{
  "cartId": "c8f2a1b0-4d3e-4b2a-8f9e-1a2b3c4d5e6f",
  "userId": "u1e2d3c4-b5a6-7890-1234-56789abcdef0",
  "items": [
    {
      "sku": "SKU-IPHONE15-BLK",
      "productId": "p1a2b3c4-d5e6-7890-1234-56789abcdef0",
      "title": "iPhone 15 Pro 256GB Black",
      "price": 999.00,
      "quantity": 1,
      "imageUrl": "https://cdn.omnicommerce.com/products/iphone15.webp"
    }
  ],
  "updatedAt": "2026-07-30T10:00:00.000Z"
}
```

---

## 3.6 Order Service (`order_db` - PostgreSQL)

### 3.6.1 Overview & Responsibilities
- **Database Name:** `omni_order_db`
- **Owner Service:** `order-service` (Port `3006`)
- **Responsibilities:** Customer order placement, idempotency check headers, order item breakdown, order status state machine, audit logs.

### 3.6.2 Prisma Schema (`apps/backend/order-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("ORDER_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELLED
  REFUNDED
}

model Order {
  id             String      @id @default(uuid()) @db.Uuid
  orderNumber    String      @unique @map("order_number") @db.VarChar(32) // ORD-YYYYMMDD-XXXXX
  customerId     String      @map("customer_id") @db.Uuid
  status         OrderStatus @default(PENDING_PAYMENT)
  subtotal       Decimal     @db.Decimal(12, 4)
  taxAmount      Decimal     @map("tax_amount") @db.Decimal(12, 4)
  shippingFee    Decimal     @map("shipping_fee") @db.Decimal(12, 4)
  discountAmount Decimal     @default(0.00) @map("discount_amount") @db.Decimal(12, 4)
  totalAmount    Decimal     @map("total_amount") @db.Decimal(12, 4)
  couponCode     String?     @map("coupon_code") @db.VarChar(50)
  shippingAddr   Json        @map("shipping_address_snapshot") @db.JsonB
  idempotencyKey String      @unique @map("idempotency_key") @db.VarChar(64)
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  items    OrderItem[]
  timeline OrderTimeline[]

  @@index([customerId], name: "idx_orders_customer_id")
  @@index([status], name: "idx_orders_status")
  @@map("orders")
}

model OrderItem {
  id        String   @id @default(uuid()) @db.Uuid
  orderId   String   @map("order_id") @db.Uuid
  sellerId  String   @map("seller_id") @db.Uuid
  productId String   @map("product_id") @db.Uuid
  sku       String   @db.VarChar(64)
  title     String   @db.VarChar(255)
  unitPrice Decimal  @map("unit_price") @db.Decimal(12, 4)
  quantity  Int
  subtotal  Decimal  @db.Decimal(12, 4)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId], name: "idx_order_items_order_id")
  @@index([sellerId], name: "idx_order_items_seller_id")
  @@map("order_items")
}

model OrderTimeline {
  id        String   @id @default(uuid()) @db.Uuid
  orderId   String   @map("order_id") @db.Uuid
  status    String   @db.VarChar(50)
  message   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_timeline")
}
```

---

## 3.7 Payment Service (`payment_db` - PostgreSQL)

### 3.7.1 Overview & Responsibilities
- **Database Name:** `omni_payment_db`
- **Owner Service:** `payment-service` (Port `3007`)
- **Responsibilities:** Immutable transaction ledger, Stripe/PayPal payment initiation, webhook payload verification, partial/full refunds.

### 3.7.2 Prisma Schema (`apps/backend/payment-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("PAYMENT_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum PaymentProvider {
  STRIPE
  PAYPAL
}

enum TransactionStatus {
  INITIATED
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

model PaymentTransaction {
  id             String            @id @default(uuid()) @db.Uuid
  orderId        String            @map("order_id") @db.Uuid
  provider       PaymentProvider
  providerTxId   String?           @map("provider_tx_id") @db.VarChar(128)
  amount         Decimal           @db.Decimal(12, 4)
  currency       String            @default("USD") @db.VarChar(3)
  status         TransactionStatus @default(INITIATED)
  failureReason  String?           @map("failure_reason") @db.Text
  idempotencyKey String            @unique @map("idempotency_key") @db.VarChar(64)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  refunds RefundRecord[]

  @@index([orderId], name: "idx_payments_order_id")
  @@map("payment_transactions")
}

model RefundRecord {
  id               String             @id @default(uuid()) @db.Uuid
  transactionId    String             @map("transaction_id") @db.Uuid
  providerRefundId String?            @map("provider_refund_id") @db.VarChar(128)
  amount           Decimal            @db.Decimal(12, 4)
  reason           String             @db.Text
  createdAt        DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)

  transaction PaymentTransaction @relation(fields: [transactionId], references: [id])

  @@map("refund_records")
}
```

---

## 3.8 Shipping Service (`shipping_db` - PostgreSQL)

### 3.8.1 Overview & Responsibilities
- **Database Name:** `omni_shipping_db`
- **Owner Service:** `shipping-service` (Port `3008`)
- **Responsibilities:** Carrier shipping rate calculation, label PDF generation, real-time carrier tracking webhooks, delivery confirmation.

### 3.8.2 Prisma Schema (`apps/backend/shipping-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("SHIPPING_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum CarrierCode {
  FEDEX
  UPS
  DHL
}

enum ShipmentStatus {
  LABEL_CREATED
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  RETURNED
}

model Shipment {
  id               String         @id @default(uuid()) @db.Uuid
  orderId          String         @unique @map("order_id") @db.Uuid
  carrier          CarrierCode
  trackingNumber   String         @unique @map("tracking_number") @db.VarChar(100)
  labelUrl         String?        @map("label_url") @db.VarChar(512)
  weight           Decimal        @db.Decimal(8, 2) // in kg
  status           ShipmentStatus @default(LABEL_CREATED)
  shippedAt        DateTime?      @map("shipped_at") @db.Timestamptz(6)
  deliveredAt      DateTime?      @map("delivered_at") @db.Timestamptz(6)
  createdAt        DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  events TrackingEvent[]

  @@map("shipments")
}

model TrackingEvent {
  id          String   @id @default(uuid()) @db.Uuid
  shipmentId  String   @map("shipment_id") @db.Uuid
  status      String   @db.VarChar(50)
  location    String?  @db.VarChar(150)
  description String   @db.Text
  eventTime   DateTime @map("event_time") @db.Timestamptz(6)

  shipment Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

  @@map("tracking_events")
}
```

---

## 3.9 Promotion Service (`promotion_db` - PostgreSQL & Redis)

### 3.9.1 Overview & Responsibilities
- **Database Name:** `omni_promotion_db`
- **Owner Service:** `promotion-service` (Port `3009`)
- **Responsibilities:** Coupon code creation, usage caps, flash sale campaigns, discount calculations.

### 3.9.2 Prisma Schema (`apps/backend/promotion-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("PROMOTION_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Coupon {
  id                String       @id @default(uuid()) @db.Uuid
  code              String       @unique @db.VarChar(50)
  discountType      DiscountType @map("discount_type")
  discountValue     Decimal      @map("discount_value") @db.Decimal(12, 4)
  maxDiscountAmount Decimal?     @map("max_discount_amount") @db.Decimal(12, 4)
  minSubtotal       Decimal      @default(0.00) @map("min_subtotal") @db.Decimal(12, 4)
  startDate         DateTime     @map("start_date") @db.Timestamptz(6)
  endDate           DateTime     @map("end_date") @db.Timestamptz(6)
  totalUsageLimit   Int          @map("total_usage_limit")
  perUserLimit      Int          @default(1) @map("per_user_limit")
  currentUsageCount Int          @default(0) @map("current_usage_count")
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)

  redemptions CouponRedemption[]

  @@map("coupons")
}

model CouponRedemption {
  id         String   @id @default(uuid()) @db.Uuid
  couponId   String   @map("coupon_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  orderId    String   @map("order_id") @db.Uuid
  redeemedAt DateTime @default(now()) @map("redeemed_at") @db.Timestamptz(6)

  coupon Coupon @relation(fields: [couponId], references: [id])

  @@unique([couponId, userId, orderId], name: "uq_coupon_redemption")
  @@map("coupon_redemptions")
}
```

---

## 3.10 Review Service (`review_db` - PostgreSQL)

### 3.10.1 Overview & Responsibilities
- **Database Name:** `omni_review_db`
- **Owner Service:** `review-service` (Port `3010`)
- **Responsibilities:** Product reviews, rating (1-5 stars), verified purchase check, automated profanity moderation queue.

### 3.10.2 Prisma Schema (`apps/backend/review-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("REVIEW_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ReviewStatus {
  PENDING_MODERATION
  APPROVED
  REJECTED
}

model ProductReview {
  id                String       @id @default(uuid()) @db.Uuid
  productId         String       @map("product_id") @db.Uuid
  customerId        String       @map("customer_id") @db.Uuid
  orderId           String       @map("order_id") @db.Uuid
  rating            Int          // 1 to 5
  comment           String       @db.Text
  verifiedPurchase  Boolean      @default(true) @map("verified_purchase")
  status            ReviewStatus @default(APPROVED)
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@unique([customerId, productId, orderId], name: "uq_customer_product_order_review")
  @@index([productId, status], name: "idx_reviews_product_status")
  @@map("product_reviews")
}
```

---

## 3.11 Notification Service (`notification_db` - PostgreSQL & Redis)

### 3.11.1 Overview & Responsibilities
- **Database Name:** `omni_notification_db`
- **Owner Service:** `notification-service` (Port `3013`)
- **Responsibilities:** Handlebars HTML email dispatch, Twilio SMS, Firebase Cloud Messaging (FCM) mobile push, BullMQ worker queues with exponential retries.

### 3.11.2 Prisma Schema (`apps/backend/notification-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("NOTIFICATION_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  SKIPPED_OPT_OUT
}

model NotificationLog {
  id           String              @id @default(uuid()) @db.Uuid
  recipientId  String              @map("recipient_id") @db.Uuid
  channel      NotificationChannel
  subject      String?             @db.VarChar(255)
  content      String              @db.Text
  status       NotificationStatus  @default(PENDING)
  attempts     Int                 @default(0)
  errorMessage String?             @map("error_message") @db.Text
  createdAt    DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([recipientId], name: "idx_notif_recipient")
  @@map("notification_logs")
}
```

---

## 3.12 Media Service (`media_db` - PostgreSQL & Object Storage)

### 3.12.1 Overview & Responsibilities
- **Database Name:** `omni_media_db`
- **Owner Service:** `media-service` (Port `3011`)
- **Responsibilities:** File binary header magic byte validation, WebP transformation, CDN HTTPS URL formatting, MinIO / Cloudflare R2 object bucket tracking.

### 3.12.2 Prisma Schema (`apps/backend/media-service/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("MEDIA_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AssetType {
  PRODUCT_IMAGE
  USER_AVATAR
  BANNER
  DOCUMENT_PDF
}

model MediaAsset {
  id          String    @id @default(uuid()) @db.Uuid
  ownerId     String    @map("owner_id") @db.Uuid
  fileName    String    @map("file_name") @db.VarChar(255)
  fileKey     String    @unique @map("file_key") @db.VarChar(512)
  mimeType    String    @map("mime_type") @db.VarChar(100)
  fileSize    Int       @map("file_size")
  assetType   AssetType @map("asset_type")
  cdnUrl      String    @map("cdn_url") @db.VarChar(512)
  thumbnails  Json?     @db.JsonB
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  @@map("media_assets")
}
```

---

## 3.13 Analytics Service (`analytics_db` - TimescaleDB)

### 3.13.1 Overview & Responsibilities
- **Database Engine:** PostgreSQL 16 with TimescaleDB extension (`omni_analytics_db`)
- **Owner Service:** `analytics-service` (Port `3014`)
- **Responsibilities:** PII scrubbing, domain event metrics ingestion, sales GMV rollups, 90-day raw telemetry retention policy.

### 3.13.2 SQL Schema Specification (`apps/backend/analytics-service/schema.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE analytics_events (
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_id UUID NOT NULL,
    domain VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload_json JSONB NOT NULL,
    PRIMARY KEY (timestamp, event_id)
);

SELECT create_hypertable('analytics_events', 'timestamp');

-- Automated retention policy: drop raw events older than 90 days
SELECT add_retention_policy('analytics_events', INTERVAL '90 days');

CREATE TABLE daily_sales_rollup (
    date DATE PRIMARY KEY,
    gmv NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    net_revenue NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    order_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3.14 Search Service Engine (`omni_products_v1` - Elasticsearch 8.x)

### 3.14.1 Overview & Responsibilities
- **Engine:** Elasticsearch 8.x
- **Owner Service:** `search-service` (Port `3012`)
- **Index Name:** `omni_products_v1` (Alias: `omni_products_read`)
- **Capabilities:** Sub-50ms product search, edge-ngram auto-complete, multi-field boosting, faceted aggregation filtering.

### 3.14.2 Index Mapping Specification

```json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "autocomplete_tokenizer",
          "filter": ["lowercase", "asciifolding"]
        }
      },
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 15,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "sellerId": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_analyzer"
          }
        }
      },
      "slug": { "type": "keyword" },
      "description": { "type": "text" },
      "categoryId": { "type": "keyword" },
      "categoryName": { "type": "keyword" },
      "brandId": { "type": "keyword" },
      "brandName": { "type": "keyword" },
      "basePrice": { "type": "scaled_float", "scaling_factor": 100 },
      "salePrice": { "type": "scaled_float", "scaling_factor": 100 },
      "status": { "type": "keyword" },
      "skus": { "type": "keyword" },
      "averageRating": { "type": "float" },
      "reviewCount": { "type": "integer" },
      "createdAt": { "type": "date" }
    }
  }
}
```

---

# 4. High Availability, Scaling & Connection Management

## 4.1 Connection Pooling (PgBouncer Strategy)

To prevent PostgreSQL process limit exhaustion, microservices connect to PostgreSQL via **PgBouncer** connection pools operating in Transaction Pooling mode.

```text
┌─────────────────────────────────────────────────────────────┐
│                 PgBouncer Pooling Topology                  │
│                                                             │
│   [ Microservice Replicas ] ──> [ PgBouncer (Port 6432) ]  │
│                                           │                 │
│                                           ▼                 │
│                              [ PostgreSQL Server (5432) ]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4.2 Read Replicas & Read/Write Separation

High-traffic read microservices (Product Service, Review Service) utilize Prisma's read-replica extension to direct `SELECT` queries to read-replicas while keeping write transactions on the primary node.

---

## 4.3 Redis Caching Topology & Eviction Policies

Redis is deployed as an High Availability Cluster using Redis Sentinel:
- **Eviction Policy:** `volatile-lru` (Least Recently Used with TTL).
- **Mandatory TTL:** All cached entity records must specify explicit Time-To-Live expiration values (e.g., product detail: 15 minutes).

---

## 4.4 Database Sharding & Partitioning Strategy

1. **Table Partitioning:** TimescaleDB hyper-tables partition telemetry events by week.
2. **Horizontal Sharding:** Large database targets (e.g. `order_db`) are prepared for customer-id hash-based sharding as volume expands beyond 10M orders.

---

# 5. Database Security, Compliance & Backup Policy

## 5.1 Encryption at Rest & In Transit

1. **In Transit:** All connections between microservices, PgBouncer, and PostgreSQL databases enforce TLS 1.3 encryption (`sslmode=require`).
2. **At Rest:** Database volumes are encrypted using AWS KMS / LUKS AES-256 block storage encryption.

---

## 5.2 PII Protection & Data Scrubbing Standards

Personal Identifiable Information (PII) such as customer passwords, phone numbers, and full names are strictly scrubbed before shipping domain events to Analytics Service or logging stacks. Passwords are strictly hashed with Argon2id.

---

## 5.3 Backup, Point-in-Time Recovery (PITR) & Disaster Recovery

1. **Continuous Archiving:** PostgreSQL Write-Ahead Logs (WAL) are shipped to S3 storage via WAL-G every 5 minutes.
2. **Daily Snapshot:** Automated full database snapshots taken daily at 01:00 UTC.
3. **Recovery SLA:** RPO (Recovery Point Objective) < 5 minutes; RTO (Recovery Time Objective) < 1 hour.

---

## 5.4 Zero-Downtime Schema Migrations

Database schema migrations follow a strict multi-step backward-compatible policy:
1. **Phase 1:** Add new column as optional (`NULLABLE`). Deploy backend code supporting both old and new columns.
2. **Phase 2:** Backfill historical data in background batch processes.
3. **Phase 3:** Update backend code to consume only the new column.
4. **Phase 4:** Remove obsolete columns/tables in follow-up deployment.

---

# 6. Related Documents & References

- [SYSTEM_ARCHITECTURE.md](../01-overview/SYSTEM_ARCHITECTURE.md) - System High-Level Architecture
- [ARCHITECTURE_PRINCIPLES.md](../01-overview/ARCHITECTURE_PRINCIPLES.md) - Core Engineering Principles
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - Backend Topology & Layering
- [SEARCH_ARCHITECTURE.md](./SEARCH_ARCHITECTURE.md) - Search & Indexing Architecture
- [CACHE_ARCHITECTURE.md](./CACHE_ARCHITECTURE.md) - Caching Standards
