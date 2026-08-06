# OmniCommerce Platform - Master Use Case Catalog

> **Document Version:** `1.0.0`  
> **Last Updated:** `2026-08-06`  
> **Status:** `APPROVED`  
> **Scope:** Backend Microservices, Functional Use Cases, Actor Flows, Exception Paths, System Triggers  
> **Target Directory:** `docs/02-backend/`  
> **Related Architecture Docs:** [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](./API_ARCHITECTURE.md), [BUSINESS_RULE_CATALOG.md](./BUSINESS_RULE_CATALOG.md), [PERMISSION_LIST.md](./PERMISSION_LIST.md), [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md)

---

## 1. Executive Summary & Purpose

This document provides the **Master Use Case Catalog** for the OmniCommerce e-commerce microservices platform. It defines all end-to-end actor flows, system triggers, preconditions, main success scenarios, exception branches, postconditions, and cross-references to the business rules cataloged in [BUSINESS_RULE_CATALOG.md](./BUSINESS_RULE_CATALOG.md).

### Primary System Actors:
- **`GUEST` / Unauthenticated Visitor**: Public customer browsing products, category trees, cart items, and shipping estimates.
- **`CUSTOMER`**: Authenticated end consumer managing profiles, delivery addresses, shopping carts, checkout, order tracking, and reviews.
- **`SELLER`**: Verified merchant vendor creating product listings, managing physical stock, generating carrier shipping labels, and viewing store performance.
- **`ADMIN`**: Platform operational administrator approving product listings, moderating customer reviews, managing promotions, and issuing refunds.
- **`SUPER_ADMIN`**: Root system administrator managing user role assignments and platform system configurations.
- **`SYSTEM_WORKER` / Event Consumer**: Asynchronous background worker processing AMQP message queues, scheduled cron jobs, Redis distributed locks, and BullMQ retries.
- **`CARRIER_WEBHOOK`**: Third-party logistics carrier API (FedEx, UPS, DHL) pushing real-time tracking scan updates.
- **`PAYMENT_GATEWAY_WEBHOOK`**: Third-party payment provider API (Stripe, PayPal) pushing asynchronous transaction settlement callbacks.

---

## 2. Microservice Use Case Directory

| Prefix | Microservice Name | Port | Total Use Cases | Primary Actors | Key Functional Responsibilities |
|---|---|---|---|---|---|
| `AUTH-UC` | **Auth Service** | `3001` | 5 | Customer, Seller, Admin, System | Registration, login, token rotation, session revocation, password reset |
| `USER-UC` | **User Service** | `3002` | 6 | Customer, Seller, Admin | Profile management, delivery addresses (max 10), default address switching |
| `PRD-UC` | **Product Service** | `3003` | 6 | Customer, Seller, Admin | Catalog browsing, SKU creation, seller submission, admin approval workflow |
| `INV-UC` | **Inventory Service** | `3004` | 6 | Customer, Seller, Admin, System | Stock balance queries, 15-min reservations, permanent deductions, low stock alerts |
| `CART-UC` | **Cart Service** | `3005` | 6 | Guest, Customer, System | In-memory Redis cart sessions, guest-to-user merging, 50-item ceiling |
| `ORD-UC` | **Order Service** | `3006` | 6 | Customer, Seller, Admin, System | Order placement, price calculations, state machine transitions, cancellation |
| `PAY-UC` | **Payment Service** | `3007` | 4 | Customer, Admin, Gateway Webhook | Stripe/PayPal charges, webhook signature verification, full/partial refunds |
| `SHIP-UC` | **Shipping Service** | `3008` | 4 | Customer, Seller, Carrier Webhook | Shipping rate calculations, label PDF generation, tracking scan ingestion |
| `PROM-UC` | **Promotion Service** | `3009` | 4 | Customer, Admin, System | Coupon validation, percentage/fixed discounts, flash sales, usage caps |
| `REV-UC` | **Review Service** | `3010` | 3 | Customer, Admin | Verified purchase product reviews, 1-5 star ratings, profanity moderation |
| `MED-UC` | **Media Service** | `3011` | 3 | Customer, Seller, Admin | Multipart file uploads, magic-byte checks, WebP conversion, thumbnails |
| `SRCH-UC` | **Search Service** | `3012` | 4 | Customer, Admin, Event Bus | Full-text product search, auto-complete, 2s event sync SLA, bulk reindexing |
| `NOTIF-UC`| **Notification Service**| `3013` | 5 | System, Customer | Email (Handlebars), SMS (Twilio), Mobile Push (FCM), BullMQ retries |
| `ANL-UC` | **Analytics Service** | `3014` | 5 | Admin, Seller, System Bus | Async metric ingestion, TimescaleDB hyper-tables, GMV/AOV reports |

---

## 3. Comprehensive Microservice Use Case Specifications

### 3.1 Auth Service (`AUTH-UC`)
*Source Spec:* [.agent/usecases/auth.md](../../.agent/usecases/auth.md) | *Business Rules:* [AUTH-BR](./BUSINESS_RULE_CATALOG.md#31-auth-service-auth-br)

#### AUTH-UC-01: User Registration
- **Primary Actor**: Anonymous Customer / Seller applicant
- **Preconditions**: User possesses a valid email address and meets password criteria.
- **Trigger**: Client sends `POST /api/v1/auth/register` with email, password, firstName, lastName.
- **Main Success Scenario**:
  1. Auth Service validates email format and password complexity (`AUTH-BR-02`, `AUTH-BR-03`).
  2. Service queries `auth_db` to ensure email is not already registered (`AUTH-BR-01`).
  3. Service hashes plaintext password using Argon2id / Bcrypt (`AUTH-BR-04`).
  4. Service inserts new `user` record into `auth_db` with `role: CUSTOMER` (or `SELLER`) (`AUTH-BR-05`).
  5. Service writes an outbox record for `auth.user.registered` domain event within the same database transaction (`AUTH-BR-06`).
  6. Service generates initial JWT access token (1h) and refresh token (7d) (`AUTH-BR-07`, `AUTH-BR-08`).
  7. Service returns `201 CREATED` with user profile payload and token pair in standard envelope.
- **Alternative / Exception Flows**:
  - *Email already exists*: System returns `409 CONFLICT` with error `EMAIL_ALREADY_REGISTERED`.
  - *Password fails complexity*: System returns `400 BAD_REQUEST` with validation details.
- **Business Rules Referenced**: `AUTH-BR-01`, `AUTH-BR-02`, `AUTH-BR-03`, `AUTH-BR-04`, `AUTH-BR-05`, `AUTH-BR-06`, `AUTH-BR-07`.
- **Postconditions**: User record created in DB, event `auth.user.registered` queued in outbox.

#### AUTH-UC-02: User Credential Login
- **Primary Actor**: Customer / Seller / Admin
- **Preconditions**: User has an existing active account in the system.
- **Trigger**: Client sends `POST /api/v1/auth/login` with email and password.
- **Main Success Scenario**:
  1. Auth Service fetches account record by email from `auth_db`.
  2. Service verifies account status is `ACTIVE` (`AUTH-BR-15`).
  3. Service verifies password hash against provided plaintext password (`AUTH-BR-04`).
  4. Service resets failed login counter to 0 in Redis.
  5. Service generates RS256-signed JWT Access Token (1h) and Refresh Token (7d) (`AUTH-BR-07`, `AUTH-BR-08`).
  6. Service persists hashed Refresh Token string in `auth_db` with device IP and User-Agent metadata.
  7. Service returns `200 OK` with user info, access token, and refresh token cookie/payload.
- **Alternative / Exception Flows**:
  - *Invalid Credentials*: System increments failed login attempt counter in Redis and returns `401 UNAUTHORIZED`.
  - *Consecutive Failures >= 5*: Account authentication is locked out for 15 minutes; returns `429 TOO_MANY_REQUESTS` (`AUTH-BR-11`).
  - *Account Suspended*: Returns `403 FORBIDDEN` with error `ACCOUNT_SUSPENDED` (`AUTH-BR-15`).
- **Business Rules Referenced**: `AUTH-BR-04`, `AUTH-BR-07`, `AUTH-BR-08`, `AUTH-BR-11`, `AUTH-BR-15`.
- **Postconditions**: Active session recorded in DB, JWT tokens delivered to client.

#### AUTH-UC-03: Access & Refresh Token Rotation
- **Primary Actor**: Client Application (Web / Mobile)
- **Preconditions**: Client possesses a valid, non-expired refresh token.
- **Trigger**: Client sends `POST /api/v1/auth/refresh-token` with refresh token payload or cookie.
- **Main Success Scenario**:
  1. Auth Service hashes incoming refresh token string.
  2. Service queries `auth_db` for active refresh token session (`AUTH-BR-08`).
  3. Service checks token expiration date (`exp > NOW`) and ensures token status is not revoked.
  4. Service revokes current refresh token session record in DB (`AUTH-BR-09`).
  5. Service issues a brand new JWT Access Token (1h) and new Refresh Token (7d).
  6. Service persists new Refresh Token record in DB and returns `200 OK` with rotated tokens.
- **Alternative / Exception Flows**:
  - *Revoked Token Submitted (Security Breach)*: Auth Service revokes ALL active sessions for that user ID and returns `401 UNAUTHORIZED` (`AUTH-BR-10`).
  - *Expired Token*: System returns `401 UNAUTHORIZED` with error `REFRESH_TOKEN_EXPIRED`.
- **Business Rules Referenced**: `AUTH-BR-07`, `AUTH-BR-08`, `AUTH-BR-09`, `AUTH-BR-10`.
- **Postconditions**: Old refresh token revoked, new token pair issued.

#### AUTH-UC-04: User Logout & Session Revocation
- **Primary Actor**: Authenticated User
- **Preconditions**: User is logged in with valid bearer token.
- **Trigger**: Client sends `POST /api/v1/auth/logout`.
- **Main Success Scenario**:
  1. Auth Service extracts `jti` (JWT ID) from access token and user session context.
  2. Service invalidates the corresponding refresh token in `auth_db` (`AUTH-BR-08`).
  3. Service pushes access token `jti` to Redis blacklist with TTL matching remaining token lifespan (`AUTH-BR-19`).
  4. Service returns `200 OK` with confirmation message.
- **Business Rules Referenced**: `AUTH-BR-08`, `AUTH-BR-19`.
- **Postconditions**: Active session revoked in DB, access token blacklisted in Redis.

#### AUTH-UC-05: Forgot Password Email Request
- **Primary Actor**: Customer / Seller
- **Preconditions**: User registered an email account.
- **Trigger**: Client sends `POST /api/v1/auth/forgot-password` with email.
- **Main Success Scenario**:
  1. Auth Service checks if email exists in `auth_db`.
  2. If found, Service generates a cryptographically secure 15-minute reset token (`AUTH-BR-12`).
  3. Service writes reset token record to DB and enqueues `auth.password.reset_requested` outbox event.
  4. Notification Service consumes event and emails password reset link to user.
  5. Service returns `200 OK` (returns generic success response even if email is not found to prevent email enumeration).
- **Business Rules Referenced**: `AUTH-BR-12`.
- **Postconditions**: Reset token saved in DB; reset link email queued.

---

### 3.2 User Service (`USER-UC`)
*Source Spec:* [.agent/usecases/user.md](../../.agent/usecases/user.md) | *Business Rules:* [USER-BR](./BUSINESS_RULE_CATALOG.md#32-user-service-user-br)

#### USER-UC-01: View User Profile
- **Primary Actor**: Authenticated User
- **Preconditions**: User is authenticated with a valid JWT.
- **Trigger**: Client sends `GET /api/v1/users/profile`.
- **Main Success Scenario**:
  1. User Service extracts `userId` from request identity context (`USER-BR-03`).
  2. Service queries `user_db` for profile details, preferences, and saved addresses (`USER-BR-01`).
  3. Service returns `200 OK` with unified user profile object.
- **Business Rules Referenced**: `USER-BR-01`, `USER-BR-03`, `USER-BR-17`.
- **Postconditions**: User profile payload returned.

#### USER-UC-02: Update User Profile
- **Primary Actor**: Authenticated User
- **Preconditions**: User is authenticated.
- **Trigger**: Client sends `PATCH /api/v1/users/profile` with `firstName`, `lastName`, `phone`, `avatarUrl`, `gender`, `dateOfBirth`.
- **Main Success Scenario**:
  1. User Service validates input attributes (E.164 phone format, name character lengths, age >= 13) (`USER-BR-02`, `USER-BR-04`, `USER-BR-05`).
  2. Service updates `user` record in `user_db`.
  3. Service emits `user.profile.updated` event (`USER-BR-14`).
  4. Service returns `200 OK` with updated profile.
- **Alternative / Exception Flows**:
  - *Invalid phone format*: Returns `400 BAD_REQUEST` with validation error.
  - *Age under 13*: Returns `400 BAD_REQUEST` with error `AGE_RESTRICTION`.
- **Business Rules Referenced**: `USER-BR-01`, `USER-BR-02`, `USER-BR-04`, `USER-BR-05`, `USER-BR-14`.
- **Postconditions**: User record updated in DB, event emitted.

#### USER-UC-03: Add Delivery Address
- **Primary Actor**: Authenticated Customer
- **Preconditions**: User has fewer than 10 saved addresses (`USER-BR-06`).
- **Trigger**: Client sends `POST /api/v1/users/addresses` with address payload.
- **Main Success Scenario**:
  1. User Service checks current address count for `userId` in `user_db`.
  2. Service validates required fields (`recipientName`, `streetAddress`, `city`, `state`, `postalCode`, `countryCode`) (`USER-BR-10`).
  3. If user has 0 addresses OR `isDefault: true` is passed, Service sets `isDefault: true` on new address and clears `isDefault` on previous addresses (`USER-BR-07`, `USER-BR-08`).
  4. Service persists new address record in `user_db`.
  5. Service emits `user.address.updated` event and returns `201 CREATED` (`USER-BR-15`).
- **Alternative / Exception Flows**:
  - *Address Limit Reached (10 addresses)*: Returns `400 BAD_REQUEST` with error `ADDRESS_LIMIT_EXCEEDED` (`USER-BR-06`).
- **Business Rules Referenced**: `USER-BR-06`, `USER-BR-07`, `USER-BR-08`, `USER-BR-10`, `USER-BR-15`.
- **Postconditions**: Address added to DB, default address flag adjusted.

#### USER-UC-04: Update Delivery Address
- **Primary Actor**: Authenticated Customer (Owner)
- **Preconditions**: Address ID exists and belongs to the user (`USER-BR-17`).
- **Trigger**: Client sends `PUT /api/v1/users/addresses/{id}` with updated address details.
- **Main Success Scenario**:
  1. User Service verifies address ownership (`address.userId == requester.id`).
  2. Service updates address fields in `user_db` (`USER-BR-10`).
  3. If updated to `isDefault: true`, Service clears default flag on all other addresses for user (`USER-BR-08`).
  4. Service emits `user.address.updated` event and returns `200 OK` (`USER-BR-15`).
- **Alternative / Exception Flows**:
  - *Unauthorized Access*: Returns `403 FORBIDDEN` if address belongs to another user (`USER-BR-17`).
- **Business Rules Referenced**: `USER-BR-08`, `USER-BR-10`, `USER-BR-15`, `USER-BR-17`.
- **Postconditions**: Address updated in DB.

#### USER-UC-05: Delete Delivery Address
- **Primary Actor**: Authenticated Customer (Owner)
- **Preconditions**: Address ID exists and belongs to user.
- **Trigger**: Client sends `DELETE /api/v1/users/addresses/{id}`.
- **Main Success Scenario**:
  1. User Service verifies address ownership (`USER-BR-17`).
  2. Service checks if target address is marked `isDefault: true`.
  3. Service deletes address record from `user_db`.
  4. If deleted address was default and remaining addresses exist, Service reassigns `isDefault: true` to the most recently updated remaining address (`USER-BR-09`).
  5. Service returns `200 OK`.
- **Business Rules Referenced**: `USER-BR-07`, `USER-BR-09`, `USER-BR-15`, `USER-BR-17`.
- **Postconditions**: Address removed from DB, default flag reassigned if needed.

#### USER-UC-06: Update Notification Preferences
- **Primary Actor**: Authenticated User
- **Preconditions**: User is logged in.
- **Trigger**: Client sends `PATCH /api/v1/users/preferences` with preference flags.
- **Main Success Scenario**:
  1. User Service updates preference record (`emailEnabled`, `smsEnabled`, `pushEnabled`, `marketingEnabled`) in `user_db` (`USER-BR-11`).
  2. Setting `marketingEnabled: false` revokes promotional communications without affecting transactional emails (`USER-BR-12`).
  3. Service returns `200 OK` with updated preferences.
- **Business Rules Referenced**: `USER-BR-11`, `USER-BR-12`.
- **Postconditions**: Preference settings updated in DB.

---

### 3.3 Product Service (`PRD-UC`)
*Source Spec:* [.agent/usecases/product.md](../../.agent/usecases/product.md) | *Business Rules:* [PRD-BR](./BUSINESS_RULE_CATALOG.md#33-product-service-prd-br)

#### PRD-UC-01: Browse & Filter Product Catalog
- **Primary Actor**: Anonymous / Authenticated Customer
- **Preconditions**: Products exist in `ACTIVE` status (`PRD-BR-10`).
- **Trigger**: Client sends `GET /api/v1/products` with query filters (category, brand, price range, page, limit).
- **Main Success Scenario**:
  1. Product Service queries Redis cache for list parameters.
  2. On cache miss, Service queries `product_db` filtering for `status: ACTIVE`.
  3. Service formats items and paginated metadata envelope (`PRD-BR-05`).
  4. Service returns `200 OK` with product items list.
- **Business Rules Referenced**: `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-05`, `PRD-BR-10`.
- **Postconditions**: Product catalog collection returned.

#### PRD-UC-02: View Product Detail
- **Primary Actor**: Customer / Public
- **Preconditions**: Product exists in DB.
- **Trigger**: Client sends `GET /api/v1/products/{id_or_slug}`.
- **Main Success Scenario**:
  1. Product Service checks Redis cache key `product:detail:{id}` (`PRD-BR-17`).
  2. On cache miss, Service fetches product, variants, SKUs, category, and brand details from `product_db` (`PRD-BR-01`, `PRD-BR-06`).
  3. Service caches detail object in Redis with 15-minute TTL (`PRD-BR-17`).
  4. Service returns `200 OK` with full product detail payload.
- **Alternative / Exception Flows**:
  - *Product Inactive/Draft*: Returns `404 NOT_FOUND` to public users unless requester is owner seller or admin (`PRD-BR-11`).
- **Business Rules Referenced**: `PRD-BR-01`, `PRD-BR-02`, `PRD-BR-06`, `PRD-BR-10`, `PRD-BR-11`, `PRD-BR-17`.
- **Postconditions**: Product detail payload returned and cached in Redis.

#### PRD-UC-03: Create Product Listing (Seller)
- **Primary Actor**: Authenticated Seller
- **Preconditions**: Seller has an active merchant account.
- **Trigger**: Client sends `POST /api/v1/products` with product title, description, basePrice, SKUs, categoryId, brandId, variants.
- **Main Success Scenario**:
  1. Product Service validates SKU uniqueness across variants (`PRD-BR-01`).
  2. Service validates `basePrice > 0.00` and `salePrice < basePrice` if provided (`PRD-BR-03`, `PRD-BR-04`).
  3. Service auto-generates URL slug from product title (`PRD-BR-02`).
  4. Service inserts master product record with `status: PENDING_APPROVAL` (`PRD-BR-09`).
  5. Service inserts variant records linked to master product in `product_db` (`PRD-BR-06`).
  6. Service emits `product.created` event and returns `201 CREATED` (`PRD-BR-13`).
- **Alternative / Exception Flows**:
  - *Duplicate SKU*: Returns `400 BAD_REQUEST` with error `DUPLICATE_SKU`.
  - *Invalid Price*: Returns `400 BAD_REQUEST` with validation details.
- **Business Rules Referenced**: `PRD-BR-01`, `PRD-BR-02`, `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-08`, `PRD-BR-09`, `PRD-BR-13`.
- **Postconditions**: Product created in `PENDING_APPROVAL` status, event emitted.

#### PRD-UC-04: Update Product Specification
- **Primary Actor**: Merchant Owner / Admin
- **Preconditions**: Product exists; requester owns product or is admin.
- **Trigger**: Client sends `PUT /api/v1/products/{id}` with updated fields.
- **Main Success Scenario**:
  1. Product Service verifies product ownership.
  2. Service validates pricing and SKU rules (`PRD-BR-01`, `PRD-BR-03`).
  3. Service updates product and variant records in `product_db`.
  4. Service invalidates Redis cache key `product:detail:{id}` (`PRD-BR-18`).
  5. Service emits `product.updated` event (triggering Search reindex & Cart price check) (`PRD-BR-14`).
  6. Service returns `200 OK`.
- **Business Rules Referenced**: `PRD-BR-01`, `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-14`, `PRD-BR-18`.
- **Postconditions**: Product updated in DB, Redis cache invalidated, `product.updated` event emitted.

#### PRD-UC-05: Approve / Reject Seller Product Listing (Admin)
- **Primary Actor**: Platform Admin
- **Preconditions**: Product is in `PENDING_APPROVAL` status (`PRD-BR-09`).
- **Trigger**: Admin sends `POST /api/v1/products/{id}/approve` with `action: APPROVED` or `action: REJECTED` + `rejectionReason`.
- **Main Success Scenario (Approve)**:
  1. Product Service validates admin role.
  2. Service updates product status to `ACTIVE` (`PRD-BR-10`).
  3. Service emits `product.approved` and `product.created` events (`PRD-BR-13`, `PRD-BR-16`).
  4. Service returns `200 OK`.
- **Main Success Scenario (Reject)**:
  1. Service validates `rejectionReason` is provided (`PRD-BR-12`).
  2. Service updates product status to `REJECTED` and saves review notes.
  3. Service returns `200 OK`.
- **Business Rules Referenced**: `PRD-BR-09`, `PRD-BR-10`, `PRD-BR-12`, `PRD-BR-16`.
- **Postconditions**: Product status updated in DB, events emitted for search indexing.

#### PRD-UC-06: Archive Product Listing
- **Primary Actor**: Merchant Owner / Admin
- **Preconditions**: Product exists in DB.
- **Trigger**: Client sends `DELETE /api/v1/products/{id}`.
- **Main Success Scenario**:
  1. Product Service updates product status to `ARCHIVED`.
  2. Service invalidates Redis cache keys (`PRD-BR-18`).
  3. Service emits `product.deleted` event (`PRD-BR-15`).
  4. Search Service consumes event and removes document from Elasticsearch.
  5. Service returns `200 OK`.
- **Business Rules Referenced**: `PRD-BR-15`, `PRD-BR-18`.
- **Postconditions**: Product archived in DB, search index document removed.

---

### 3.4 Inventory Service (`INV-UC`)
*Source Spec:* [.agent/usecases/inventory.md](../../.agent/usecases/inventory.md) | *Business Rules:* [INV-BR](./BUSINESS_RULE_CATALOG.md#34-inventory-service-inv-br)

#### INV-UC-01: Query SKU Stock Balance
- **Primary Actor**: Public / Internal Microservices
- **Preconditions**: Target SKU exists in Inventory database.
- **Trigger**: Client sends `GET /api/v1/inventory/stock/{sku}`.
- **Main Success Scenario**:
  1. Inventory Service queries `inventory_db` for physical and reserved stock balances.
  2. Service computes `Available Quantity = Physical Quantity - Reserved Quantity` (`INV-BR-01`).
  3. Service returns `200 OK` with available stock count and safety stock status (`INV-BR-02`).
- **Business Rules Referenced**: `INV-BR-01`, `INV-BR-02`.
- **Postconditions**: Stock balance returned.

#### INV-UC-02: Reserve Stock Units for Checkout
- **Primary Actor**: Order Service / Customer BFF (Internal)
- **Preconditions**: Order items specified with SKU and requested quantities.
- **Trigger**: System sends `POST /api/v1/inventory/reserve` with orderId, items array `[{sku, quantity}]`.
- **Main Success Scenario**:
  1. Inventory Service acquires Redis distributed locks `lock:inventory:{sku}` for requested SKUs (`INV-BR-06`, `INV-BR-17`).
  2. Service verifies `Available Quantity >= requestedQuantity` for all items (`INV-BR-02`).
  3. Service increments `Reserved Quantity` for each SKU in `inventory_db` (`INV-BR-16`).
  4. Service inserts stock reservation records with a **15-minute TTL** (`INV-BR-04`).
  5. Service releases Redis distributed locks.
  6. Service emits `inventory.reserved` event and returns `200 OK` (`INV-BR-09`).
- **Alternative / Exception Flows**:
  - *Insufficient Stock*: Service releases locks, reverts partial reservations, and returns `400 BAD_REQUEST` with `INSUFFICIENT_STOCK` (`INV-BR-02`).
- **Business Rules Referenced**: `INV-BR-01`, `INV-BR-02`, `INV-BR-04`, `INV-BR-06`, `INV-BR-09`, `INV-BR-13`, `INV-BR-16`, `INV-BR-17`.
- **Postconditions**: Stock reserved in DB for 15 minutes, event `inventory.reserved` emitted.

#### INV-UC-03: Confirm Permanent Stock Deduction (Payment Success)
- **Primary Actor**: Payment Service / Order Service (Event Consumer)
- **Preconditions**: Payment succeeded for order; stock is in `RESERVED` state.
- **Trigger**: AMQP Event `payment.completed` received by Inventory Service.
- **Main Success Scenario**:
  1. Inventory Service extracts `orderId` from event payload.
  2. Service fetches active reservation records for `orderId`.
  3. Service atomically decrements `Physical Quantity` and `Reserved Quantity` in `inventory_db` (`INV-BR-07`).
  4. Service updates reservation record status to `CONFIRMED`.
  5. Service checks if updated `Available Quantity < safetyStockThreshold` (5 units) and emits `inventory.low_stock` if triggered (`INV-BR-03`, `INV-BR-12`).
  6. Service emits `inventory.deducted` event (`INV-BR-11`).
- **Business Rules Referenced**: `INV-BR-03`, `INV-BR-07`, `INV-BR-11`, `INV-BR-12`, `INV-BR-14`.
- **Postconditions**: Physical stock decremented, reservation confirmed.

#### INV-UC-04: Release Expired / Cancelled Stock Reservation
- **Primary Actor**: System Timer Worker / Order Service
- **Preconditions**: Stock reservation 15-minute TTL elapses OR order is cancelled.
- **Trigger**: Reservation TTL timer worker fires OR AMQP event `order.cancelled` received.
- **Main Success Scenario**:
  1. Inventory Service fetches active reservation for `orderId` or expired reservation ID.
  2. Service decrements `Reserved Quantity` in `inventory_db`, restoring units to `Available Quantity` (`INV-BR-05`, `INV-BR-08`).
  3. Service updates reservation record status to `RELEASED` or `EXPIRED`.
  4. Service emits `inventory.released` event (`INV-BR-10`).
- **Business Rules Referenced**: `INV-BR-05`, `INV-BR-08`, `INV-BR-10`, `INV-BR-15`.
- **Postconditions**: Reserved stock released back to available inventory pool.

#### INV-UC-05: Warehouse Stock Adjustment (Merchant / Admin)
- **Primary Actor**: Seller / Warehouse Admin
- **Preconditions**: Requester authorized for target SKU.
- **Trigger**: Client sends `POST /api/v1/inventory/adjust` with `sku`, `warehouseId`, `adjustmentQuantity`, `reason`.
- **Main Success Scenario**:
  1. Inventory Service validates SKU and warehouse existence.
  2. Service updates physical stock balance in `inventory_db` (`INV-BR-01`).
  3. Service logs stock adjustment audit record.
  4. Service returns `200 OK` with updated stock balance.
- **Business Rules Referenced**: `INV-BR-01`, `INV-BR-02`.
- **Postconditions**: Physical stock updated in DB, audit entry created.

#### INV-UC-06: Low Stock Safety Threshold Alert
- **Primary Actor**: System Event Handler
- **Preconditions**: Available stock drops below `safetyStockThreshold` (5 units) after deduction or manual adjustment (`INV-BR-03`).
- **Trigger**: Internal stock deduction logic evaluates `Available Quantity < 5`.
- **Main Success Scenario**:
  1. Inventory Service constructs `inventory.low_stock` event payload (`sku`, `availableQuantity`, `warehouseId`).
  2. Service publishes event to RabbitMQ topic exchange (`omni.events.topic`) (`INV-BR-12`).
  3. Notification Service consumes event and sends low-stock alert email to merchant/admin.
- **Business Rules Referenced**: `INV-BR-03`, `INV-BR-12`.
- **Postconditions**: Event `inventory.low_stock` published to message broker.

---

### 3.5 Cart Service (`CART-UC`)
*Source Spec:* [.agent/usecases/cart.md](../../.agent/usecases/cart.md) | *Business Rules:* [CART-BR](./BUSINESS_RULE_CATALOG.md#35-cart-service-cart-br)

#### CART-UC-01: View Active Shopping Cart
- **Primary Actor**: Customer / Guest User
- **Preconditions**: User possesses a valid session JWT OR a `guestCartId` cookie.
- **Trigger**: Client sends `GET /api/v1/cart`.
- **Main Success Scenario**:
  1. Cart Service identifies target key `cart:{userId}` or `cart:guest:{guestCartId}` in Redis (`CART-BR-01`).
  2. Service fetches cart hash payload from Redis.
  3. If cart exists, Service returns `200 OK` with items array, quantities, transient prices, and total item count (`CART-BR-08`).
  4. If cart does not exist, Service returns `200 OK` with an empty cart object.
- **Business Rules Referenced**: `CART-BR-01`, `CART-BR-02`, `CART-BR-03`, `CART-BR-08`.
- **Postconditions**: Cart object returned.

#### CART-UC-02: Add Product Variant to Cart
- **Primary Actor**: Customer / Guest User
- **Preconditions**: Product variant SKU exists.
- **Trigger**: Client sends `POST /api/v1/cart/items` with `sku`, `quantity` (default: 1).
- **Main Success Scenario**:
  1. Cart Service fetches target cart key from Redis (`CART-BR-01`).
  2. Service checks current distinct items count (`<= 50 distinct items`, `CART-BR-05`).
  3. If SKU already exists in cart, Service adds new quantity to existing quantity, ensuring total `quantity <= 99` (`CART-BR-06`).
  4. If SKU is new, Service adds item to items array.
  5. Service updates Redis cart payload and resets TTL (30d for Auth / 7d for Guest) (`CART-BR-02`, `CART-BR-03`).
  6. Service emits `cart.item_added` event and returns `200 OK` with updated cart (`CART-BR-10`).
- **Alternative / Exception Flows**:
  - *Cart Limit Exceeded (> 50 items)*: Returns `400 BAD_REQUEST` with `CART_LIMIT_EXCEEDED` (`CART-BR-05`).
  - *Item Quantity > 99*: Caps quantity at 99 or returns `400 BAD_REQUEST` (`CART-BR-06`).
- **Business Rules Referenced**: `CART-BR-01`, `CART-BR-02`, `CART-BR-03`, `CART-BR-05`, `CART-BR-06`, `CART-BR-10`.
- **Postconditions**: Item added to Redis cart, cart TTL refreshed.

#### CART-UC-03: Update Cart Item Quantity
- **Primary Actor**: Customer / Guest User
- **Preconditions**: Cart exists in Redis and contains target SKU item.
- **Trigger**: Client sends `PATCH /api/v1/cart/items/{sku}` with new `quantity`.
- **Main Success Scenario**:
  1. Cart Service fetches cart from Redis.
  2. If new `quantity == 0`, Service removes item from cart (`CART-BR-07`).
  3. If `0 < quantity <= 99`, Service updates item quantity (`CART-BR-06`).
  4. Service persists updated cart in Redis and resets TTL.
  5. Service returns `200 OK` with updated cart.
- **Business Rules Referenced**: `CART-BR-06`, `CART-BR-07`.
- **Postconditions**: Item quantity updated or removed from cart in Redis.

#### CART-UC-04: Remove Item from Cart
- **Primary Actor**: Customer / Guest User
- **Preconditions**: Cart contains target SKU item.
- **Trigger**: Client sends `DELETE /api/v1/cart/items/{sku}`.
- **Main Success Scenario**:
  1. Cart Service fetches cart from Redis.
  2. Service removes matching SKU item from cart array (`CART-BR-07`).
  3. Service saves updated cart to Redis and returns `200 OK`.
- **Business Rules Referenced**: `CART-BR-07`.
- **Postconditions**: Item removed from Redis cart.

#### CART-UC-05: Merge Guest Cart Upon User Login
- **Primary Actor**: Newly Authenticated Customer
- **Preconditions**: User logged in; guest cart cookie `guestCartId` exists.
- **Trigger**: Client sends `POST /api/v1/cart/merge` with `guestCartId`.
- **Main Success Scenario**:
  1. Cart Service fetches guest cart `cart:guest:{guestCartId}` from Redis (`CART-BR-03`).
  2. Service fetches user cart `cart:{userId}` from Redis (`CART-BR-02`).
  3. Service merges guest items into user cart array, combining quantities for duplicate SKUs up to 99 units (`CART-BR-04`, `CART-BR-06`).
  4. Service ensures combined distinct item count does not exceed 50 items (`CART-BR-05`).
  5. Service saves merged cart to `cart:{userId}` with 30-day TTL (`CART-BR-02`).
  6. Service deletes `cart:guest:{guestCartId}` key from Redis.
  7. Service returns `200 OK` with merged cart payload.
- **Business Rules Referenced**: `CART-BR-02`, `CART-BR-04`, `CART-BR-05`, `CART-BR-06`.
- **Postconditions**: Guest cart merged into authenticated user cart, guest key deleted.

#### CART-UC-06: Clear Cart Upon Order Placement
- **Primary Actor**: System Event Handler / Order Service
- **Preconditions**: Order placed successfully by customer.
- **Trigger**: AMQP Event `order.placed` or `cart.cleared` emitted (`CART-BR-09`, `CART-BR-13`).
- **Main Success Scenario**:
  1. Cart Service extracts `userId` from event payload.
  2. Service deletes Redis key `cart:{userId}` (`CART-BR-09`).
  3. Service emits `cart.cleared` event (`CART-BR-11`).
- **Business Rules Referenced**: `CART-BR-09`, `CART-BR-11`, `CART-BR-13`.
- **Postconditions**: User Redis cart cleared.

---

### 3.6 Order Service (`ORD-UC`)
*Source Spec:* [.agent/usecases/order.md](../../.agent/usecases/order.md) | *Business Rules:* [ORD-BR](./BUSINESS_RULE_CATALOG.md#36-order-service-ord-br)

#### ORD-UC-01: Create Order from Checkout Cart
- **Primary Actor**: Authenticated Customer
- **Preconditions**: Customer has items in cart and selected shipping address.
- **Trigger**: Client sends `POST /api/v1/orders` with `Idempotency-Key` header, shippingAddressId, paymentMethod, couponCode.
- **Main Success Scenario**:
  1. Order Service checks `Idempotency-Key` to prevent duplicate submissions (`ORD-BR-04`).
  2. Service fetches cart items and validates live item prices from Product Service.
  3. Service queries Promotion Service to validate coupon code and compute `DiscountAmount`.
  4. Service queries Shipping Service to compute `ShippingFee`.
  5. Service calculates `Subtotal`, `TaxAmount`, and `TotalAmount` using decimal math (`ORD-BR-02`, `ORD-BR-03`).
  6. Service requests Inventory Service to reserve stock (`INV-UC-02`).
  7. Service auto-generates Order Number `ORD-YYYYMMDD-XXXXX` (`ORD-BR-01`).
  8. Service commits order and order item records to `order_db` with `status: PENDING_PAYMENT` (`ORD-BR-08`).
  9. Service emits `order.created` event and returns `201 CREATED` with order summary (`ORD-BR-15`).
- **Alternative / Exception Flows**:
  - *Inventory Reservation Fails*: System aborts order creation, returns `400 BAD_REQUEST` with `INSUFFICIENT_STOCK`.
  - *Invalid Idempotency Key*: Returns cached previous order response (`ORD-BR-04`).
- **Business Rules Referenced**: `ORD-BR-01`, `ORD-BR-02`, `ORD-BR-03`, `ORD-BR-04`, `ORD-BR-08`, `ORD-BR-15`.
- **Postconditions**: Order created in `PENDING_PAYMENT` status, stock reserved, event `order.created` emitted.

#### ORD-UC-02: View Customer Order History
- **Primary Actor**: Authenticated Customer / Seller / Admin
- **Preconditions**: User authenticated.
- **Trigger**: Client sends `GET /api/v1/orders` with status, page, limit.
- **Main Success Scenario**:
  1. Order Service inspects requester role scope.
  2. If `CUSTOMER`, Service filters `order_db` by `customerId == requester.id`.
  3. If `SELLER`, Service filters orders containing items sold by merchant.
  4. If `ADMIN`, Service returns platform-wide orders.
  5. Service returns `200 OK` with paginated order list.
- **Business Rules Referenced**: `ORD-BR-01`, `ORD-BR-03`.
- **Postconditions**: Order collection returned.

#### ORD-UC-03: View Order Details & Tracking Timeline
- **Primary Actor**: Customer (Owner) / Merchant / Admin
- **Preconditions**: Order exists.
- **Trigger**: Client sends `GET /api/v1/orders/{id}` or `GET /api/v1/orders/{id}/timeline`.
- **Main Success Scenario**:
  1. Order Service verifies resource ownership or admin/seller role.
  2. Service queries `order_db` for master order record, item list, payment status, shipping tracking number, and audit timeline logs.
  3. Service returns `200 OK` with detailed order payload.
- **Business Rules Referenced**: `ORD-BR-01`, `ORD-BR-08` through `ORD-BR-14`.
- **Postconditions**: Order detail payload returned.

#### ORD-UC-04: Cancel Pending / Unshipped Order
- **Primary Actor**: Customer (Owner) / Admin
- **Preconditions**: Order is in `PENDING_PAYMENT` or `PAID` status (`ORD-BR-05`).
- **Trigger**: Client sends `POST /api/v1/orders/{id}/cancel` with cancellation reason.
- **Main Success Scenario**:
  1. Order Service verifies order status is `PENDING_PAYMENT` or `PAID` (`ORD-BR-05`).
  2. Service updates order status to `CANCELLED` in `order_db` (`ORD-BR-14`).
  3. Service appends audit entry to order timeline.
  4. Service emits `order.cancelled` event (`ORD-BR-07`, `ORD-BR-19`).
  5. Inventory Service consumes event and releases reserved stock (`INV-UC-04`).
  6. Payment Service consumes event and processes refund if previously paid (`PAY-UC-03`).
  7. Service returns `200 OK`.
- **Alternative / Exception Flows**:
  - *Order Already Shipped (`SHIPPED` / `DELIVERED`)*: Returns `400 BAD_REQUEST` with error `ORDER_CANNOT_BE_CANCELLED` (`ORD-BR-06`).
- **Business Rules Referenced**: `ORD-BR-05`, `ORD-BR-06`, `ORD-BR-07`, `ORD-BR-14`, `ORD-BR-19`.
- **Postconditions**: Order status marked `CANCELLED`, event `order.cancelled` emitted.

#### ORD-UC-05: Process Payment Completion (Order Paid)
- **Primary Actor**: Payment Service (Event Consumer)
- **Preconditions**: Payment gateway confirmed transaction capture.
- **Trigger**: AMQP Event `payment.completed` received by Order Service (`ORD-BR-20`).
- **Main Success Scenario**:
  1. Order Service fetches order by `orderId`.
  2. Service updates order status from `PENDING_PAYMENT` to `PAID` in `order_db` (`ORD-BR-09`).
  3. Service appends timeline audit entry `Payment confirmed via Stripe/PayPal`.
  4. Service emits `order.paid` event (`ORD-BR-16`).
  5. Service notifies merchant to begin shipping fulfillment (`PROCESSING`).
- **Business Rules Referenced**: `ORD-BR-09`, `ORD-BR-16`, `ORD-BR-20`.
- **Postconditions**: Order status updated to `PAID`, `order.paid` event emitted.

#### ORD-UC-06: Transition Order to Shipped & Delivered
- **Primary Actor**: Shipping Service (Event Consumer) / Merchant
- **Preconditions**: Shipment label generated and package scanned by carrier.
- **Trigger**: AMQP Event `shipping.dispatched` or `shipping.delivered` received by Order Service (`ORD-BR-22`).
- **Main Success Scenario**:
  1. On `shipping.dispatched`: Order Service updates order status from `PROCESSING` to `SHIPPED` (`ORD-BR-11`). Emits `order.shipped` (`ORD-BR-17`).
  2. On `shipping.delivered`: Order Service updates status to `DELIVERED` (`ORD-BR-12`). Emits `order.delivered` (`ORD-BR-18`).
  3. Service initiates 7-day customer return countdown window elapsing into `COMPLETED` (`ORD-BR-13`).
- **Business Rules Referenced**: `ORD-BR-11`, `ORD-BR-12`, `ORD-BR-13`, `ORD-BR-17`, `ORD-BR-18`, `ORD-BR-22`.
- **Postconditions**: Order status transitioned to `SHIPPED` / `DELIVERED`.

---

### 3.7 Payment Service (`PAY-UC`)
*Source Spec:* [.agent/usecases/payment.md](../../.agent/usecases/payment.md) | *Business Rules:* [PAY-BR](./BUSINESS_RULE_CATALOG.md#37-payment-service-pay-br)

#### PAY-UC-01: Initiate Payment Charge for Order
- **Primary Actor**: Customer / Checkout Flow
- **Preconditions**: Order created in `PENDING_PAYMENT` status.
- **Trigger**: Client sends `POST /api/v1/payments/process` with orderId, paymentMethod, tokenized payment token (`pm_...`).
- **Main Success Scenario**:
  1. Payment Service verifies `Idempotency-Key` header (`PAY-BR-04`).
  2. Service checks order total and currency against Order Service (`PAY-BR-03`).
  3. Service initializes immutable transaction record in `payment_db` with status `INITIATED` (`PAY-BR-02`, `PAY-BR-11`).
  4. Service calls external payment gateway API (Stripe/PayPal) using tokenized payment token (`PAY-BR-01`, `PAY-BR-06`).
  5. Upon gateway authorization & capture success, Service updates transaction status to `COMPLETED` (`PAY-BR-13`).
  6. Service emits `payment.completed` event and returns `200 OK` with transaction receipt (`PAY-BR-16`).
- **Alternative / Exception Flows**:
  - *Card Declined / Insufficient Funds*: Gateway returns error; Service sets status `FAILED`, emits `payment.failed`, and returns `400 BAD_REQUEST` (`PAY-BR-14`, `PAY-BR-17`).
- **Business Rules Referenced**: `PAY-BR-01`, `PAY-BR-02`, `PAY-BR-03`, `PAY-BR-04`, `PAY-BR-06`, `PAY-BR-11`, `PAY-BR-13`, `PAY-BR-16`.
- **Postconditions**: Transaction saved as `COMPLETED` in DB, event `payment.completed` emitted.

#### PAY-UC-02: Verify Gateway Webhook Callback
- **Primary Actor**: Third-Party Gateway (Stripe / PayPal)
- **Preconditions**: Asynchronous payment event occurred on gateway infrastructure.
- **Trigger**: Gateway POSTs to `/api/v1/payments/verify` with payload & signature headers (`Stripe-Signature`).
- **Main Success Scenario**:
  1. Payment Service extracts webhook signature header.
  2. Service computes HMAC signature using stored webhook secret key and verifies match (`PAY-BR-05`).
  3. Service checks for duplicate event processing (idempotency check).
  4. Service updates internal transaction record in `payment_db` (`PAY-BR-02`).
  5. Service emits corresponding domain event (`payment.completed` or `payment.failed`) (`PAY-BR-16`, `PAY-BR-17`).
  6. Service returns `200 OK` to gateway.
- **Alternative / Exception Flows**:
  - *Signature Verification Fails*: Returns `400 BAD_REQUEST` / `401 UNAUTHORIZED` and rejects payload (`PAY-BR-05`).
- **Business Rules Referenced**: `PAY-BR-02`, `PAY-BR-05`, `PAY-BR-16`, `PAY-BR-17`.
- **Postconditions**: Webhook validated, transaction status updated, event emitted.

#### PAY-UC-03: Process Full or Partial Order Refund
- **Primary Actor**: Platform Admin / Order Cancellation Event
- **Preconditions**: Target transaction exists in `COMPLETED` status; order is `PAID` or `CANCELLED` (`PAY-BR-07`).
- **Trigger**: Admin sends `POST /api/v1/payments/refunds` OR AMQP Event `order.cancelled` received (`PAY-BR-20`).
- **Main Success Scenario**:
  1. Payment Service verifies target order state (`PAID`, `CANCELLED`, `RETURNED`) (`PAY-BR-07`).
  2. Service calculates requested refund amount:
     - For full refund: `amount == totalPaidAmount` (`PAY-BR-08`).
     - For partial refund: `amount <= totalPaidAmount - previousRefunds` (`PAY-BR-09`).
  3. Service calls gateway refund API with original transaction ID (`PAY-BR-10`).
  4. Upon gateway confirmation, Service creates immutable refund record in `payment_db`.
  5. Service updates transaction status to `REFUNDED` or `PARTIALLY_REFUNDED` (`PAY-BR-15`).
  6. Service emits `payment.refunded` event and returns `200 OK` (`PAY-BR-18`).
- **Alternative / Exception Flows**:
  - *Refund Amount Exceeds Paid Total*: Returns `400 BAD_REQUEST` with error `INVALID_REFUND_AMOUNT` (`PAY-BR-09`).
- **Business Rules Referenced**: `PAY-BR-07`, `PAY-BR-08`, `PAY-BR-09`, `PAY-BR-10`, `PAY-BR-15`, `PAY-BR-18`, `PAY-BR-20`.
- **Postconditions**: Refund processed via gateway, transaction status updated, event emitted.

#### PAY-UC-04: Handle Payment Charge Failure
- **Primary Actor**: Payment Gateway / System
- **Preconditions**: Payment charge attempt failed during processing.
- **Trigger**: Gateway returns decline code or timeout occurs.
- **Main Success Scenario**:
  1. Payment Service updates transaction status to `FAILED` in `payment_db` (`PAY-BR-14`).
  2. Service logs failure reason (e.g. `INSUFFICIENT_FUNDS`, `EXPIRED_CARD`).
  3. Service emits `payment.failed` event (`PAY-BR-17`).
  4. Order Service consumes event and transitions order to `CANCELLED` (`ORD-UC-04`).
  5. Inventory Service consumes event and releases stock reservation (`INV-UC-04`).
- **Business Rules Referenced**: `PAY-BR-14`, `PAY-BR-17`.
- **Postconditions**: Payment marked `FAILED`, downstream cancellation events triggered.

---

### 3.8 Shipping Service (`SHIP-UC`)
*Source Spec:* [.agent/usecases/shipping.md](../../.agent/usecases/shipping.md) | *Business Rules:* [SHIP-BR](./BUSINESS_RULE_CATALOG.md#38-shipping-service-ship-br)

#### SHIP-UC-01: Calculate Shipping Rate Options
- **Primary Actor**: Customer / Checkout Flow
- **Preconditions**: Items in cart have weight and dimensions.
- **Trigger**: Client sends `POST /api/v1/shipping/calculate-rate` with `originPostalCode`, `destinationPostalCode`, item dimensions, cart subtotal.
- **Main Success Scenario**:
  1. Shipping Service computes billable weight using `MAX(Actual Weight, Volumetric Weight)` formula (`SHIP-BR-02`).
  2. Service checks if `Subtotal >= $100.00` (`SHIP-BR-03`).
  3. If eligible for free shipping, Service sets `Standard Shipping Rate = $0.00`.
  4. Service queries carrier APIs (FedEx, UPS, DHL) for active rates across service tiers (Standard, Express, Overnight) (`SHIP-BR-01`).
  5. Service returns `200 OK` with available shipping options, prices, and estimated delivery dates.
- **Business Rules Referenced**: `SHIP-BR-01`, `SHIP-BR-02`, `SHIP-BR-03`.
- **Postconditions**: Shipping rate options list returned.

#### SHIP-UC-02: Generate Carrier Shipping Label
- **Primary Actor**: Merchant (`SELLER`) / Admin
- **Preconditions**: Order status is `PAID` (`SHIP-BR-04`).
- **Trigger**: Merchant sends `POST /api/v1/shipping/shipments` with `orderId`, `carrierCode`.
- **Main Success Scenario**:
  1. Shipping Service verifies order status is `PAID` (`SHIP-BR-04`).
  2. Service calls selected logistics carrier API to book package dispatch.
  3. Carrier returns unique tracking number (`trackingNumber`) and label payload (`SHIP-BR-05`).
  4. Service generates PDF / ZPL label file and uploads it to object storage via Media Service (`SHIP-BR-06`).
  5. Service creates shipment record in `shipping_db` with status `LABEL_CREATED` (`SHIP-BR-09`).
  6. Service emits `shipping.label_created` event and returns `201 CREATED` with tracking info and label PDF URL (`SHIP-BR-15`).
- **Alternative / Exception Flows**:
  - *Order Not Paid*: Returns `400 BAD_REQUEST` with error `ORDER_NOT_PAID` (`SHIP-BR-04`).
- **Business Rules Referenced**: `SHIP-BR-04`, `SHIP-BR-05`, `SHIP-BR-06`, `SHIP-BR-09`, `SHIP-BR-15`.
- **Postconditions**: Shipment record created, tracking number assigned, shipping label generated.

#### SHIP-UC-03: Ingest Carrier Real-Time Tracking Update
- **Primary Actor**: Carrier Webhook / System Poller
- **Preconditions**: Active shipment exists with tracking number.
- **Trigger**: Carrier webhook POSTs to `/api/v1/shipping/webhook/{carrier}` with tracking event (`SHIP-BR-07`).
- **Main Success Scenario**:
  1. Shipping Service validates webhook signature.
  2. Service matches tracking number to active shipment in `shipping_db`.
  3. Service updates shipment status (`PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`) (`SHIP-BR-10` through `SHIP-BR-13`).
  4. If status transitions to `PICKED_UP` / `IN_TRANSIT`, Service emits `shipping.dispatched` event (`SHIP-BR-16`).
  5. Order Service consumes event and transitions order to `SHIPPED` (`ORD-UC-06`).
  6. Service returns `200 OK`.
- **Business Rules Referenced**: `SHIP-BR-07`, `SHIP-BR-10`, `SHIP-BR-11`, `SHIP-BR-12`, `SHIP-BR-16`.
- **Postconditions**: Shipment status updated, `shipping.dispatched` event emitted.

#### SHIP-UC-04: Confirm Delivery & Start Return Window
- **Primary Actor**: Carrier Tracking Webhook
- **Preconditions**: Shipment status is `OUT_FOR_DELIVERY` or `IN_TRANSIT`.
- **Trigger**: Carrier webhook confirms package delivered.
- **Main Success Scenario**:
  1. Shipping Service updates shipment status to `DELIVERED` in `shipping_db` (`SHIP-BR-13`).
  2. Service records exact delivery timestamp.
  3. Service emits `shipping.delivered` event (`SHIP-BR-17`).
  4. Order Service consumes event, updates order to `DELIVERED`, and initiates 7-day return window countdown (`SHIP-BR-08`, `ORD-UC-06`).
  5. Notification Service sends delivery confirmation email/SMS to customer.
  6. Service returns `200 OK`.
- **Business Rules Referenced**: `SHIP-BR-08`, `SHIP-BR-13`, `SHIP-BR-17`.
- **Postconditions**: Shipment marked `DELIVERED`, return window started.

---

### 3.9 Promotion Service (`PROM-UC`)
*Source Spec:* [.agent/usecases/promotion.md](../../.agent/usecases/promotion.md) | *Business Rules:* [PROM-BR](./BUSINESS_RULE_CATALOG.md#39-promotion-service-prom-br)

#### PROM-UC-01: Validate Coupon Code & Calculate Discount Preview
- **Primary Actor**: Customer / Checkout Flow
- **Preconditions**: Coupon code entered at checkout preview.
- **Trigger**: Client sends `POST /api/v1/promotions/coupons/validate` with `couponCode`, `cartSubtotal`, `userId`, `itemCategoryIds`.
- **Main Success Scenario**:
  1. Promotion Service queries `promotion_db` / Redis for coupon code record.
  2. Service checks validity window (`startDate <= NOW <= endDate`, `PROM-BR-05`).
  3. Service checks global usage count against `totalUsageLimit` (`PROM-BR-07`).
  4. Service checks user redemption count against `perUserLimit` (`PROM-BR-08`).
  5. Service verifies `cartSubtotal >= minimumOrderAmount` (`PROM-BR-06`).
  6. Service calculates discount value (Percentage with `maxDiscountAmount` cap OR Fixed Amount) (`PROM-BR-01`, `PROM-BR-02`).
  7. Service returns `200 OK` with validated discount amount and final preview subtotal.
- **Alternative / Exception Flows**:
  - *Expired Coupon*: Returns `400 BAD_REQUEST` with `COUPON_EXPIRED` (`PROM-BR-05`).
  - *Usage Cap Reached*: Returns `400 BAD_REQUEST` with `COUPON_USAGE_LIMIT_REACHED` (`PROM-BR-07`).
  - *Minimum Subtotal Not Met*: Returns `400 BAD_REQUEST` with `MINIMUM_SUBTOTAL_NOT_MET` (`PROM-BR-06`).
- **Business Rules Referenced**: `PROM-BR-01`, `PROM-BR-02`, `PROM-BR-05`, `PROM-BR-06`, `PROM-BR-07`, `PROM-BR-08`, `PROM-BR-10`.
- **Postconditions**: Validated discount amount returned for checkout computation.

#### PROM-UC-02: Redeem Coupon Code Upon Order Placement
- **Primary Actor**: Order Service (Event Consumer)
- **Preconditions**: Order placed successfully containing a valid coupon code.
- **Trigger**: AMQP Event `order.created` received by Promotion Service (`PROM-BR-13`).
- **Main Success Scenario**:
  1. Promotion Service extracts `couponCode` and `userId` from event payload.
  2. Service atomically increments global redemption counter and user redemption counter in `promotion_db` (`PROM-BR-07`, `PROM-BR-08`).
  3. Service logs coupon redemption transaction record.
  4. Service emits `promotion.coupon_redeemed` event (`PROM-BR-11`).
- **Business Rules Referenced**: `PROM-BR-07`, `PROM-BR-08`, `PROM-BR-11`, `PROM-BR-13`.
- **Postconditions**: Redemption counter incremented in DB, event emitted.

#### PROM-UC-03: Create Promotional Coupon Code (Admin)
- **Primary Actor**: Platform Admin
- **Preconditions**: Requester possesses `ADMIN` role.
- **Trigger**: Admin sends `POST /api/v1/promotions/coupons` with coupon parameters.
- **Main Success Scenario**:
  1. Promotion Service validates coupon rules (discount type, value, active dates, caps) (`PROM-BR-01` to `PROM-BR-08`).
  2. Service inserts coupon record into `promotion_db`.
  3. Service caches coupon code in Redis for fast validation lookup.
  4. Service returns `201 CREATED`.
- **Business Rules Referenced**: `PROM-BR-01` through `PROM-BR-10`.
- **Postconditions**: Coupon code created in DB and cached in Redis.

#### PROM-UC-04: Schedule & Launch Flash Sale Campaign (Admin)
- **Primary Actor**: Platform Admin
- **Preconditions**: Target product SKUs exist.
- **Trigger**: Admin sends `POST /api/v1/promotions/flash-sales` with SKUs, promotional price, stock allocation limit, start/end timestamps.
- **Main Success Scenario**:
  1. Promotion Service creates flash sale campaign record in `promotion_db` (`PROM-BR-04`).
  2. Service schedules background activation job at `startDate`.
  3. Upon reaching `startDate`, Service emits `promotion.flash_sale_started` event (`PROM-BR-12`).
  4. Search Service and Product Service consume event to update promotional price tags.
  5. Service returns `201 CREATED`.
- **Business Rules Referenced**: `PROM-BR-04`, `PROM-BR-12`.
- **Postconditions**: Flash sale campaign scheduled and live event broadcasted.

---

### 3.10 Review Service (`REV-UC`)
*Source Spec:* [.agent/usecases/review.md](../../.agent/usecases/review.md) | *Business Rules:* [REV-BR](./BUSINESS_RULE_CATALOG.md#310-review-service-rev-br)

#### REV-UC-01: Submit Customer Product Review
- **Primary Actor**: Authenticated Customer
- **Preconditions**: Customer purchased product and order status is `DELIVERED` or `COMPLETED` (`REV-BR-01`).
- **Trigger**: Client sends `POST /api/v1/reviews/products/{productId}` with `rating` (1-5), `comment` text (10-2000 chars).
- **Main Success Scenario**:
  1. Review Service queries Order Service / DB to verify user has a delivered order containing `productId` (`REV-BR-01`).
  2. Service checks that user has not previously reviewed this product for this order (`REV-BR-02`).
  3. Service validates `rating` is an integer between 1 and 5 (`REV-BR-03`).
  4. Service validates comment text length (10 to 2000 characters) (`REV-BR-04`).
  5. Service passes comment text through automated profanity filter (`REV-BR-05`).
  6. If clean, status is set to `APPROVED` and `verifiedPurchase: true` badge is attached (`REV-BR-06`, `REV-BR-07`).
  7. If profanity flagged, status is set to `PENDING_MODERATION`.
  8. Service persists review in `review_db`, emits `review.submitted` event, and returns `201 CREATED` (`REV-BR-10`).
- **Alternative / Exception Flows**:
  - *No Verified Purchase*: Returns `403 FORBIDDEN` with error `VERIFIED_PURCHASE_REQUIRED` (`REV-BR-01`).
  - *Duplicate Review*: Returns `400 BAD_REQUEST` with error `DUPLICATE_REVIEW` (`REV-BR-02`).
- **Business Rules Referenced**: `REV-BR-01`, `REV-BR-02`, `REV-BR-03`, `REV-BR-04`, `REV-BR-05`, `REV-BR-06`, `REV-BR-07`, `REV-BR-10`.
- **Postconditions**: Review created in DB, status assigned, event emitted.

#### REV-UC-02: Moderate Submitted Review (Admin)
- **Primary Actor**: Platform Admin
- **Preconditions**: Review exists in `PENDING_MODERATION` status (`REV-BR-06`).
- **Trigger**: Admin sends `POST /api/v1/reviews/{id}/moderate` with `action: APPROVED` or `action: REJECTED`.
- **Main Success Scenario**:
  1. Review Service validates admin role.
  2. Service updates review status in `review_db` (`APPROVED` or `REJECTED`) (`REV-BR-06`).
  3. If approved, Service emits `review.approved` event (`REV-BR-11`).
  4. Product Service consumes `review.approved` and re-computes `averageRating` (`REV-BR-08`, `REV-BR-09`).
  5. Service returns `200 OK`.
- **Business Rules Referenced**: `REV-BR-06`, `REV-BR-08`, `REV-BR-09`, `REV-BR-11`.
- **Postconditions**: Review status updated, product average rating re-calculated if approved.

#### REV-UC-03: View Product Reviews & Aggregate Rating
- **Primary Actor**: Public / Customer
- **Preconditions**: Product exists.
- **Trigger**: Client sends `GET /api/v1/reviews/products/{productId}` with page, limit, ratingFilter.
- **Main Success Scenario**:
  1. Review Service queries `review_db` for approved reviews (`status == APPROVED`) linked to `productId` (`REV-BR-06`).
  2. Service computes rating distribution breakdown (counts for 5, 4, 3, 2, 1 stars) and overall `averageRating` (`REV-BR-08`).
  3. Service returns `200 OK` with aggregate rating summary and paginated review items.
- **Business Rules Referenced**: `REV-BR-06`, `REV-BR-07`, `REV-BR-08`.
- **Postconditions**: Reviews and rating breakdown returned.

---

### 3.11 Media Service (`MED-UC`)
*Source Spec:* [.agent/usecases/media.md](../../.agent/usecases/media.md) | *Business Rules:* [MED-BR](./BUSINESS_RULE_CATALOG.md#311-media-service-med-br)

#### MED-UC-01: Upload Media File Asset
- **Primary Actor**: Authenticated Seller / Admin / User
- **Preconditions**: File is uploaded as `multipart/form-data`.
- **Trigger**: Client sends `POST /api/v1/media/upload` with file attachment and folder scope (`products`, `avatars`, `banners`).
- **Main Success Scenario**:
  1. Media Service validates file MIME type against whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) (`MED-BR-01`).
  2. Service checks file size limit (max 5MB for images, max 10MB for documents) (`MED-BR-02`, `MED-BR-03`).
  3. Service inspects file binary header magic bytes to verify genuine file format (`MED-BR-04`).
  4. Service converts image files to **WebP** format (`MED-BR-05`).
  5. Service generates image thumbnail variants: `thumbnail` (150x150), `medium` (500x500), `large` (1200x1200) (`MED-BR-06`).
  6. Service uploads converted assets to object storage bucket (MinIO / Cloudflare R2 / S3).
  7. Service saves media record in `media_db` and formats public CDN HTTPS URLs (`MED-BR-07`).
  8. Service emits `media.uploaded` event and returns `201 CREATED` with asset details and CDN URLs (`MED-BR-08`).
- **Alternative / Exception Flows**:
  - *MIME or Magic Byte Validation Fails*: Returns `400 BAD_REQUEST` with error `UNSUPPORTED_FILE_TYPE` (`MED-BR-01`, `MED-BR-04`).
  - *File Size Exceeded*: Returns `400 BAD_REQUEST` with error `FILE_SIZE_EXCEEDED` (`MED-BR-02`, `MED-BR-03`).
- **Business Rules Referenced**: `MED-BR-01`, `MED-BR-02`, `MED-BR-03`, `MED-BR-04`, `MED-BR-05`, `MED-BR-06`, `MED-BR-07`, `MED-BR-08`.
- **Postconditions**: Assets stored in bucket, media metadata saved in DB, CDN URLs returned.

#### MED-UC-02: Retrieve Media Asset Metadata
- **Primary Actor**: Authenticated User / Internal Microservice
- **Preconditions**: Media asset ID exists in DB.
- **Trigger**: Client sends `GET /api/v1/media/{id}/metadata`.
- **Main Success Scenario**:
  1. Media Service queries `media_db` for asset record by ID.
  2. Service returns `200 OK` with asset file dimensions, MIME type, size, upload date, and CDN URLs array (`MED-BR-07`).
- **Business Rules Referenced**: `MED-BR-07`.
- **Postconditions**: Asset metadata returned.

#### MED-UC-03: Delete Media Asset
- **Primary Actor**: Asset Owner / Admin
- **Preconditions**: Media asset exists in DB.
- **Trigger**: Client sends `DELETE /api/v1/media/{id}`.
- **Main Success Scenario**:
  1. Media Service verifies asset ownership or admin permission.
  2. Service deletes original file and thumbnail variants from object storage bucket.
  3. Service deletes media record from `media_db`.
  4. Service emits `media.deleted` event and returns `200 OK` (`MED-BR-09`).
- **Business Rules Referenced**: `MED-BR-09`.
- **Postconditions**: File objects removed from storage bucket, DB record deleted.

---

### 3.12 Search Service (`SRCH-UC`)
*Source Spec:* [.agent/usecases/search.md](../../.agent/usecases/search.md) | *Business Rules:* [SRCH-BR](./BUSINESS_RULE_CATALOG.md#312-search-service-srch-br)

#### SRCH-UC-01: Full-Text Product Search & Faceted Filter
- **Primary Actor**: Customer / Public User
- **Preconditions**: Product documents indexed in Elasticsearch `products_index` (`SRCH-BR-01`).
- **Trigger**: Client sends `GET /api/v1/search/products` with query `q`, `categoryId`, `brandId`, `minPrice`, `maxPrice`, `rating`, `page`, `limit`.
- **Main Success Scenario**:
  1. Search Service constructs Elasticsearch multi-match search query targeting `products_index` (`SRCH-BR-01`).
  2. Service applies field weight boosting: Title (3x), Category (2x), Brand (2x) (`SRCH-BR-02`).
  3. Service applies exact filters (`categoryId`, `brandId`, `minPrice`, `maxPrice`, `rating`, `inStock: true`) (`SRCH-BR-03`).
  4. Service retrieves matching product documents and aggregation facets breakdown from Elasticsearch.
  5. Service returns `200 OK` with paginated search results and facet options (categories, brands, price ranges).
- **Business Rules Referenced**: `SRCH-BR-01`, `SRCH-BR-02`, `SRCH-BR-03`.
- **Postconditions**: Search results and category/brand/price facets returned.

#### SRCH-UC-02: Auto-Complete Search Suggestions
- **Primary Actor**: Customer / Web & Mobile Search Bar
- **Preconditions**: User typing query string in search bar.
- **Trigger**: Client sends `GET /api/v1/search/suggestions` with `q` (query prefix).
- **Main Success Scenario**:
  1. Search Service verifies query prefix string length `q.length >= 2` (`SRCH-BR-04`).
  2. Service executes edge n-gram suggestion query against Elasticsearch `products_index`.
  3. Service fetches top 5 matching product title keywords and category names (`SRCH-BR-04`).
  4. Service returns `200 OK` with auto-complete suggestions array.
- **Alternative / Exception Flows**:
  - *Query Length < 2*: Returns `200 OK` with an empty array (`SRCH-BR-04`).
- **Business Rules Referenced**: `SRCH-BR-04`.
- **Postconditions**: Up to 5 auto-complete keyword suggestions returned.

#### SRCH-UC-03: Event-Driven Elasticsearch Index Sync
- **Primary Actor**: Product Service / Inventory Service (AMQP Event Producers)
- **Preconditions**: State change occurred in catalog or inventory.
- **Trigger**: AMQP Event received (`product.created`, `product.updated`, `product.deleted`, `inventory.updated`) (`SRCH-BR-05`).
- **Main Success Scenario**:
  1. Search Service parses domain event payload.
  2. If `product.created` or `product.updated`: Service transforms product details into Elasticsearch document format and upserts document in `products_index` (`SRCH-BR-08`, `SRCH-BR-09`).
  3. If `product.deleted`: Service deletes corresponding document ID from `products_index` (`SRCH-BR-10`).
  4. If `inventory.updated`: Service updates `inStock` boolean flag in Elasticsearch document (`SRCH-BR-11`).
  5. Index sync completes within the 2-second eventual consistency SLA (`SRCH-BR-06`).
- **Business Rules Referenced**: `SRCH-BR-05`, `SRCH-BR-06`, `SRCH-BR-08`, `SRCH-BR-09`, `SRCH-BR-10`, `SRCH-BR-11`.
- **Postconditions**: Elasticsearch index document synchronized with PostgreSQL database.

#### SRCH-UC-04: Full Catalog Bulk Reindex (Admin)
- **Primary Actor**: Platform Admin
- **Preconditions**: Requester possesses `ADMIN` role.
- **Trigger**: Admin sends `POST /api/v1/search/reindex`.
- **Main Success Scenario**:
  1. Search Service verifies admin role.
  2. Service creates temporary new index `products_index_v2` in Elasticsearch.
  3. Service streams all active products from Product Service `product_db` in bulk batches of 500 records (`SRCH-BR-07`).
  4. Service populates `products_index_v2`.
  5. Service atomically updates index alias `products_index` to point to `products_index_v2`.
  6. Service drops old index and returns `200 OK` with total reindexed document count.
- **Business Rules Referenced**: `SRCH-BR-01`, `SRCH-BR-07`.
- **Postconditions**: Complete Elasticsearch catalog index rebuilt without downtime.

---

### 3.13 Notification Service (`NOTIF-UC`)
*Source Spec:* [.agent/usecases/notification.md](../../.agent/usecases/notification.md) | *Business Rules:* [NOTIF-BR](./BUSINESS_RULE_CATALOG.md#313-notification-service-notif-br)

#### NOTIF-UC-01: Dispatch Transactional Email Notification
- **Primary Actor**: Domain Event Consumer (System)
- **Preconditions**: Domain event emitted requiring email notification (`auth.user.registered`, `order.created`, `payment.completed`).
- **Trigger**: AMQP Event received by Notification Service.
- **Main Success Scenario**:
  1. Notification Service parses event payload (recipient email, recipient name, order details).
  2. Service checks notification type:
     - Transactional notifications (Welcome, Order Placed, Password Reset) bypass marketing opt-out check (`NOTIF-BR-04`).
     - Promotional notifications check User Service preferences (`marketingEnabled == true`, `NOTIF-BR-05`).
  3. Service loads HTML Handlebars template for event type (`NOTIF-BR-01`).
  4. Service renders Handlebars template with event data.
  5. Service enqueues email job in BullMQ Redis queue (`NOTIF-BR-06`).
  6. BullMQ worker calls SMTP gateway (Nodemailer / SendGrid) and dispatches email.
  7. Service logs notification delivery status in `notification_db`.
- **Alternative / Exception Flows**:
  - *User Opted Out of Marketing*: Promotional notification skipped, log recorded as `SKIPPED_OPT_OUT` (`NOTIF-BR-05`).
- **Business Rules Referenced**: `NOTIF-BR-01`, `NOTIF-BR-04`, `NOTIF-BR-05`, `NOTIF-BR-06`, `NOTIF-BR-08`, `NOTIF-BR-10`, `NOTIF-BR-11`.
- **Postconditions**: Email rendered, queued, and dispatched via SMTP provider.

#### NOTIF-UC-02: Send Transactional SMS Notification
- **Primary Actor**: System Event Handler
- **Preconditions**: Recipient phone number provided in E.164 format.
- **Trigger**: Domain event received (`shipping.dispatched` or OTP request).
- **Main Success Scenario**:
  1. Notification Service extracts phone number and message template variables.
  2. Service formats text message (`NOTIF-BR-02`).
  3. Service enqueues SMS job in BullMQ queue (`NOTIF-BR-06`).
  4. Worker dispatches SMS via Twilio API.
  5. Service logs delivery record in `notification_db`.
- **Business Rules Referenced**: `NOTIF-BR-02`, `NOTIF-BR-06`, `NOTIF-BR-12`.
- **Postconditions**: SMS text message sent to recipient mobile device.

#### NOTIF-UC-03: Send Mobile Push Notification (FCM)
- **Primary Actor**: System Event Handler
- **Preconditions**: User has registered active FCM device token in Flutter mobile app.
- **Trigger**: Domain event received (`order.created`, `order.shipped`, `order.delivered`).
- **Main Success Scenario**:
  1. Notification Service queries User Service for recipient's FCM device push tokens.
  2. Service constructs FCM push payload (title, body, orderId deep link) (`NOTIF-BR-03`).
  3. Service calls Firebase Cloud Messaging (FCM) API.
  4. FCM delivers push notification to customer's iOS / Android device.
  5. Service logs push delivery in `notification_db`.
- **Business Rules Referenced**: `NOTIF-BR-03`, `NOTIF-BR-10`, `NOTIF-BR-12`.
- **Postconditions**: Mobile push notification delivered to user device.

#### NOTIF-UC-04: View & Mark In-App Customer Notifications
- **Primary Actor**: Authenticated Customer
- **Preconditions**: User has in-app notification records.
- **Trigger**: Client sends `GET /api/v1/notifications` or `PATCH /api/v1/notifications/{id}/read`.
- **Main Success Scenario**:
  1. Notification Service fetches customer's in-app notification history from `notification_db`.
  2. For mark read request: Service updates `isRead: true` for target notification ID.
  3. Service returns `200 OK`.
- **Postconditions**: Notification history returned or marked read.

#### NOTIF-UC-05: Handle Notification Dispatch Failure & Retries
- **Primary Actor**: BullMQ Worker / System Queue
- **Preconditions**: Email, SMS, or Push dispatch failed due to network or gateway error.
- **Trigger**: SMTP / Twilio / FCM API returns error or timeout.
- **Main Success Scenario**:
  1. BullMQ worker intercepts failure.
  2. Worker schedules job retry with exponential backoff delay (Attempt 1: 10s, Attempt 2: 30s, Attempt 3: 90s) (`NOTIF-BR-07`).
  3. If all 3 retry attempts fail, worker moves job to Dead Letter Queue (DLQ) and flags status `FAILED` in `notification_db`.
- **Business Rules Referenced**: `NOTIF-BR-06`, `NOTIF-BR-07`.
- **Postconditions**: Notification retried up to 3 times before DLQ movement.

---

### 3.14 Analytics Service (`ANL-UC`)
*Source Spec:* [.agent/usecases/analytics.md](../../.agent/usecases/analytics.md) | *Business Rules:* [ANL-BR](./BUSINESS_RULE_CATALOG.md#314-analytics-service-anl-br)

#### ANL-UC-01: Asynchronous Metric Event Ingestion
- **Primary Actor**: AMQP Domain Event Bus
- **Preconditions**: Domain event emitted across backend (`order.created`, `order.paid`, `order.cancelled`, `user.registered`, `product.created`).
- **Trigger**: AMQP Event received by Analytics Service (`ANL-BR-01`).
- **Main Success Scenario**:
  1. Analytics Service parses domain event payload (`ANL-BR-01`).
  2. Service scrubs user PII (names, emails, street addresses) from event payload (`ANL-BR-07`).
  3. Service inserts sanitized metric record into TimescaleDB hyper-table `analytics_events` (`ANL-BR-02`).
  4. Service updates hourly and daily roll-up aggregate metrics (GMV, Net Revenue, Order Count, Customer Registration Count) (`ANL-BR-03`, `ANL-BR-04`).
- **Business Rules Referenced**: `ANL-BR-01`, `ANL-BR-02`, `ANL-BR-03`, `ANL-BR-04`, `ANL-BR-07`, `ANL-BR-09`, `ANL-BR-10`, `ANL-BR-11`, `ANL-BR-12`, `ANL-BR-13`.
- **Postconditions**: PII scrubbed, metric data inserted into TimescaleDB hyper-tables.

#### ANL-UC-02: View Platform Sales Revenue Summary (Admin)
- **Primary Actor**: Platform Admin
- **Preconditions**: Requester possesses `ADMIN` role.
- **Trigger**: Admin sends `GET /api/v1/analytics/sales-summary` with time range (`startDate`, `endDate`, `interval: DAY/MONTH`).
- **Main Success Scenario**:
  1. Analytics Service verifies admin role.
  2. Service queries TimescaleDB hyper-tables for aggregated sales metrics over target date range.
  3. Service computes `GMV`, `Net Revenue`, `Average Order Value (AOV)`, and `Conversion Rate` (`ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`, `ANL-BR-06`).
  4. Service returns `200 OK` with revenue time-series array and summary KPIs.
- **Business Rules Referenced**: `ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`, `ANL-BR-06`.
- **Postconditions**: Executive sales summary and KPIs returned.

#### ANL-UC-03: View Top Product Sales Rankings (Admin / Seller)
- **Primary Actor**: Admin / Seller
- **Preconditions**: User authenticated.
- **Trigger**: Client sends `GET /api/v1/analytics/top-products` with `limit` (default: 10).
- **Main Success Scenario**:
  1. Analytics Service queries TimescaleDB for top selling SKUs ordered by unit volume and gross revenue (`ANL-BR-02`).
  2. If requester is `SELLER`, Service filters results to include only SKUs owned by seller's store.
  3. Service returns `200 OK` with ranked products list.
- **Business Rules Referenced**: `ANL-BR-02`.
- **Postconditions**: Top product sales ranking returned.

#### ANL-UC-04: View Seller Store Performance Analytics
- **Primary Actor**: Authenticated Seller
- **Preconditions**: Merchant owns an active seller store.
- **Trigger**: Seller sends `GET /api/v1/analytics/seller/performance` with time window.
- **Main Success Scenario**:
  1. Analytics Service extracts `sellerId` from identity context.
  2. Service queries TimescaleDB hyper-tables for merchant's total revenue, order count, average order value, and return rate (`ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`).
  3. Service returns `200 OK` with seller store analytics.
- **Business Rules Referenced**: `ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`.
- **Postconditions**: Merchant performance analytics returned.

#### ANL-UC-05: Purge Expired Raw Telemetry Data
- **Primary Actor**: System Maintenance Cron Worker
- **Preconditions**: Raw event telemetry older than 90 days exists in TimescaleDB.
- **Trigger**: Daily cron worker executes telemetry cleanup job.
- **Main Success Scenario**:
  1. Analytics Service retains aggregated daily/monthly hyper-table summaries indefinitely (`ANL-BR-08`).
  2. Service drops raw event telemetry partitions older than 90 days from TimescaleDB (`ANL-BR-08`).
  3. Service logs cleanup execution audit entry.
- **Business Rules Referenced**: `ANL-BR-08`.
- **Postconditions**: Raw telemetry partitions older than 90 days purged from DB.

---

## 4. End-to-End Cross-Service Workflow Sequences

### Sequence 1: Customer Checkout to Order Delivery
```text
Customer            Cart Svc      Order Svc     Inventory Svc   Payment Svc    Shipping Svc   Notif Svc
   │                   │              │              │               │              │             │
   ├── GET /cart ─────►│              │              │               │              │             │
   │   (CART-UC-01)    │              │              │               │              │             │
   │                   │              │              │               │              │             │
   ├── POST /orders ─────────────────►│              │               │              │             │
   │   (ORD-UC-01)                    ├── Reserve ──►│               │              │             │
   │                                  │   (INV-UC-02)│               │              │             │
   │                                  │              │               │              │             │
   ├── POST /payments/process ──────────────────────────────────────►│              │             │
   │   (PAY-UC-01)                                                   ├── Event ────►│             │
   │                                                                 │  payment.    │             │
   │                                  ┌── Consumer ──────────────────┤  completed   │             │
   │                                  │   payment.completed          │  (INV-UC-03) │             │
   │                                  ▼                              │              │             │
   │                           Status: PAID                          │              │             │
   │                           (ORD-UC-05)                           │              │             │
   │                                  │                              │              │             │
   │                                  │                              │  POST /ship ─►             │
   │                                  │                              │  (SHIP-UC-02)              │
   │                                  │                              │              │             │
   │                                  │◄── Event shipping.dispatched ───────────────┤             │
   │                                  │    Status: SHIPPED (ORD-UC-06)              │             │
   │                                  │                                             │             │
   │                                  │◄── Event shipping.delivered ────────────────┤             │
   │                                  │    Status: DELIVERED (ORD-UC-06)            ├── SMS / Push│
   │                                  │    Return Window 7d                         │   (NOTIF-UC)│
```

---

## 5. Implementation & Testing Acceptance Checklist

QA Engineers and Backend Developers must verify the following end-to-end criteria before release approval:

- [ ] **Happy Path Verification**: Every `Main Success Scenario` has an automated integration test in NestJS e2e test suite.
- [ ] **Exception Handling**: Every `Alternative / Exception Flow` returns correct HTTP status codes and error code strings.
- [ ] **Idempotency Guarding**: Duplicate POST requests with the same `Idempotency-Key` return identical responses without re-executing state mutations.
- [ ] **Event Reaction Verification**: Consumed AMQP events correctly trigger state transitions (e.g. `payment.completed` -> `PAID` & stock deduction).
- [ ] **Security Authorization**: API endpoints reject unauthorized role execution with `403 FORBIDDEN` or `401 UNAUTHORIZED`.
