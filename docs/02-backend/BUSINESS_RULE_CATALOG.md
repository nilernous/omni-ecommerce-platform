# OmniCommerce Platform - Master Business Rule Catalog

> **Document Version:** `1.0.0`  
> **Last Updated:** `2026-08-06`  
> **Status:** `APPROVED`  
> **Scope:** Backend Microservices, Business Logic Guards, Domain State Machines, Validation Policies  
> **Target Directory:** `docs/02-backend/`  
> **Related Architecture Docs:** [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](./API_ARCHITECTURE.md), [USE_CASE_CATALOG.md](./USE_CASE_CATALOG.md), [PERMISSION_LIST.md](./PERMISSION_LIST.md), [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md), [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md)

---

## 1. Overview & Architectural Principles

This document serves as the **Master Business Rule Catalog** for the OmniCommerce e-commerce backend platform. It consolidates all domain business rules, entity constraints, validation logic, state machine transitions, caching policies, and event-driven workflows across all 14 core backend microservices.

### Universal Business Governance Rules:
1. **Database per Service**: Every microservice owns a dedicated datastore (`auth_db`, `user_db`, `product_db`, etc.). Direct cross-database queries between microservices are strictly prohibited.
2. **Transactional Outbox Pattern**: State changes emitting domain events must write to a local `outbox` table within the same database transaction.
3. **Idempotent Mutations & Consumers**: All state-modifying REST endpoints require an `Idempotency-Key` header, and event consumers must enforce message deduplication.
4. **Strict Input Validation**: DTO payloads are validated at the API Gateway and BFF layers. Extra or unexpected fields are automatically rejected.
5. **PII Protection & Security**: Sensitive user credentials must be hashed via **Argon2id** / **Bcrypt**, and PCI-DSS data (credit card PANs/CVVs) is never stored or processed directly. Personal Identifiable Information (PII) is scrubbed before analytics telemetry storage.

---

## 2. Service Business Rule Index

| Prefix | Microservice Name | Port | Datastore | Rule Range | Main Domain Responsibility |
|---|---|---|---|---|---|
| `AUTH-BR` | **Auth Service** | `3001` | PostgreSQL (`auth_db`) + Redis | 01 - 20 | Identity, JWT issuance, password security, session revocation |
| `USER-BR` | **User Service** | `3002` | PostgreSQL (`user_db`) | 01 - 17 | User profiles, delivery addresses, preference governance |
| `PRD-BR` | **Product Service** | `3003` | PostgreSQL (`product_db`) + Redis | 01 - 18 | Product catalog, SKUs, categories, seller approval workflow |
| `INV-BR` | **Inventory Service** | `3004` | PostgreSQL (`inventory_db`) + Redis | 01 - 17 | Stock balance tracking, reservations, safety stock alerts |
| `CART-BR` | **Cart Service** | `3005` | Redis (`cart_store`) | 01 - 13 | Active shopping cart sessions, guest cart merging, TTLs |
| `ORD-BR` | **Order Service** | `3006` | PostgreSQL (`order_db`) | 01 - 22 | Order placement, price calculations, lifecycle state machine |
| `PAY-BR` | **Payment Service** | `3007` | PostgreSQL (`payment_db`) | 01 - 20 | Payment gateway processing, webhooks, refund execution |
| `SHIP-BR` | **Shipping Service** | `3008` | PostgreSQL (`shipping_db`) | 01 - 18 | Carrier integrations, rate formulas, tracking, label printing |
| `PROM-BR` | **Promotion Service** | `3009` | PostgreSQL (`promotion_db`) + Redis | 01 - 14 | Coupon discounts, flash sales, usage limits, campaign rules |
| `REV-BR` | **Review Service** | `3010` | PostgreSQL (`review_db`) | 01 - 12 | Verified purchase product reviews, star ratings, moderation |
| `MED-BR` | **Media Service** | `3011` | MinIO / S3 (`media_bucket`) + Postgres | 01 - 09 | File upload handling, MIME verification, image resizing |
| `SRCH-BR` | **Search Service** | `3012` | Elasticsearch (`products_index`) | 01 - 11 | Full-text product search, auto-complete, faceted filters |
| `NOTIF-BR`| **Notification Service**| `3013` | Redis + PostgreSQL (`notification_db`)| 01 - 12 | Multi-channel dispatch (Email, SMS, Push), templates |
| `ANL-BR` | **Analytics Service** | `3014` | TimescaleDB (`analytics_db`) | 01 - 13 | Business metrics, GMV, Net Revenue, conversion funnels |

---

## 3. Comprehensive Business Rules by Service Domain

### 3.1 Auth Service (`AUTH-BR`)
*Source Spec:* [.agent/business-rules/auth.md](../../.agent/business-rules/auth.md) | *Port:* `3001` | *Database:* PostgreSQL (`auth_db`) + Redis

#### Core Business Rules:
- **`AUTH-BR-01: Email Uniqueness`**: Email addresses must be unique across the platform (case-insensitive check before user creation).
- **`AUTH-BR-02: Email Format Validation`**: Must conform to RFC 5322 email formatting standards.
- **`AUTH-BR-03: Password Complexity`**:
  - Minimum length: 8 characters, maximum length: 64 characters.
  - Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`!@#$%^&*`).
- **`AUTH-BR-04: Credential Hashing`**: Passwords must be hashed using Argon2id (or Bcrypt with work factor 12) before database persistence. Plaintext passwords are never logged, stored, or returned.
- **`AUTH-BR-05: Default Role Assignment`**: Newly registered users are assigned `CUSTOMER` by default (or `SELLER` if registering via merchant portal). Admin roles (`ADMIN`, `SUPER_ADMIN`) cannot be self-assigned.
- **`AUTH-BR-06: Identity Outbox Emission`**: Successful registration must commit the user record and enqueue `auth.user.registered` in `auth_outbox` in a single database transaction.
- **`AUTH-BR-07: Access Token Lifecycle`**:
  - JWT Access Token TTL: **1 Hour (3600 seconds)**.
  - Signed using RS256 private key. Required claims: `sub`, `email`, `roles`, `permissions`, `iss`, `iat`, `exp`, `jti`.
- **`AUTH-BR-08: Refresh Token Storage`**: Refresh Token TTL: **7 Days**. Stored in `auth_db` as SHA-256 hashed strings with IP, user-agent, and expiration date.
- **`AUTH-BR-09: Single-Use Token Rotation`**: Executing token refresh invalidates the used refresh token and issues a new access/refresh token pair.
- **`AUTH-BR-10: Token Reuse Detection`**: Submitting a previously revoked or replaced refresh token flags a breach, revokes ALL active refresh tokens for that user ID, and forces re-authentication.
- **`AUTH-BR-11: Brute Force Account Lockout`**: 5 consecutive failed login attempts within a 15-minute sliding window per IP/email locks authentication for **15 minutes**.
- **`AUTH-BR-12: Password Reset Token Expiration`**: Password reset tokens expire **15 minutes** after issuance.
- **`AUTH-BR-13: Reset Token Single-Use`**: Reset tokens are single-use and deleted immediately upon password modification.
- **`AUTH-BR-14: Universal Session Revocation`**: Changing or resetting a password automatically revokes all active refresh tokens and blacklists active JWTs for that user ID.
- **`AUTH-BR-15: Account State Enforcement`**:
  - `ACTIVE`: Standard operational account state.
  - `SUSPENDED`: Account locked due to security policy or admin action (`403 Account Suspended`).
  - `DELETED`: Soft-deleted record retained for 30-day legal compliance before hard purge.
- **`AUTH-BR-16: Event auth.user.registered`**: Emitted on registration; triggers welcome email dispatch via Notification Service.
- **`AUTH-BR-17: Event auth.password.changed`**: Emitted on password update; triggers security alert email.
- **`AUTH-BR-18: Event auth.session.revoked`**: Emitted when a session is revoked by user or admin.
- **`AUTH-BR-19: Redis Session Blacklist`**: Revoked access token IDs (`jti`) are cached in Redis `blacklist:jti:{id}` with TTL matching remaining token lifespan.
- **`AUTH-BR-20: Outbox Pattern`**: Outbox table `auth_outbox` persists event payloads in the same transaction as user creation.

---

### 3.2 User Service (`USER-BR`)
*Source Spec:* [.agent/business-rules/user.md](../../.agent/business-rules/user.md) | *Port:* `3002` | *Database:* PostgreSQL (`user_db`)

#### Core Business Rules:
- **`USER-BR-01: Profile Data Scope`**: Manages `firstName`, `lastName`, `phone`, `avatarUrl`, `gender`, `dateOfBirth`.
- **`USER-BR-02: Phone Number Format`**: Formatted according to E.164 international standard (e.g. `+1234567890`).
- **`USER-BR-03: User System Identification`**: Unique user ID (`usr_...`) generated at account registration.
- **`USER-BR-04: Name Field Constraints`**: `firstName` and `lastName` between 1 and 50 characters each; special symbols sanitized.
- **`USER-BR-05: Date of Birth Validation`**: `dateOfBirth` must establish a minimum age of **13 years**.
- **`USER-BR-06: Address Storage Limit`**: Maximum of **10 delivery addresses** per user. Attempting an 11th returns `400 BAD_REQUEST`.
- **`USER-BR-07: Default Address Assignment`**: Exactly **1 address** must be designated `isDefault: true` per user whenever 1 or more addresses exist.
- **`USER-BR-08: Default Address Switching`**: Setting an address `isDefault: true` sets `isDefault: false` on all existing addresses for that user.
- **`USER-BR-09: Default Address Deletion`**: Deleting default address automatically reassigns default status to the most recently updated remaining address.
- **`USER-BR-10: Required Address Fields`**: Requires `recipientName`, `phoneNumber`, `streetAddress`, `city`, `state`, `postalCode`, and ISO 3166-1 alpha-2 `countryCode`.
- **`USER-BR-11: Notification Preferences Defaults`**: New accounts default to `emailEnabled: true`, `smsEnabled: true`, `pushEnabled: true`, `marketingEnabled: true`.
- **`USER-BR-12: Marketing Opt-Out Isolation`**: Setting `marketingEnabled: false` revokes promotional emails without affecting transactional order notifications.
- **`USER-BR-13: Role Privilege Governance`**: Roles (`CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN`) can only be modified by accounts possessing `ADMIN` or `SUPER_ADMIN` authorization.
- **`USER-BR-14: Event user.profile.updated`**: Emitted when profile details are modified.
- **`USER-BR-15: Event user.address.updated`**: Emitted when addresses are added, modified, or set as default.
- **`USER-BR-16: Consumer auth.user.registered`**: Triggers initial user profile and preference record creation in `user_db`.
- **`USER-BR-17: Resource Ownership Enforcement`**: Users can only read, edit, or delete their own profile/address entities unless requester is `ADMIN` or `SUPER_ADMIN`.

---

### 3.3 Product Service (`PRD-BR`)
*Source Spec:* [.agent/business-rules/product.md](../../.agent/business-rules/product.md) | *Port:* `3003` | *Database:* PostgreSQL (`product_db`) + Redis

#### Core Business Rules:
- **`PRD-BR-01: Global SKU Uniqueness`**: Every product variant must have a unique SKU string across the system.
- **`PRD-BR-02: Product Slug Generation`**: Slugs must be unique, lowercase, hyphenated strings generated from product title (e.g. `wireless-noise-canceling-headphones`).
- **`PRD-BR-03: Base Price Constraint`**: `basePrice` must be a positive numeric decimal (`> 0.00`).
- **`PRD-BR-04: Sale Price Constraint`**: If specified, `salePrice` must be strictly less than `basePrice` (`salePrice < basePrice`).
- **`PRD-BR-05: Currency Standardization`**: Product prices default to `USD` currency (ISO 4217 standard).
- **`PRD-BR-06: Product Variant Inheritance`**: Variants inherit parent metadata (category, brand, title) but override SKU, price, dimensions, and images.
- **`PRD-BR-07: Category Hierarchy Depth`**: Category tree supports parent-child relationships up to **3 levels deep** (Root → Category → Subcategory).
- **`PRD-BR-08: Mandatory Brand Association`**: Published products must link to a valid, active Brand entity ID.
- **`PRD-BR-09: Seller Submission State`**: Products created by `SELLER` accounts default to `PENDING_APPROVAL` status.
- **`PRD-BR-10: Public Search Visibility`**: Only products in `ACTIVE` status appear in public catalog search results, storefronts, and recommendations.
- **`PRD-BR-11: Draft & Pending Visibility`**: Products in `DRAFT` or `PENDING_APPROVAL` status are accessible only by owner or platform administrators.
- **`PRD-BR-12: Rejection Reason Documentation`**: When rejecting a listing (`REJECTED`), admin must provide a mandatory textual rejection reason.
- **`PRD-BR-13: Event product.created`**: Emitted on publication; triggers Search Service indexing.
- **`PRD-BR-14: Event product.updated`**: Emitted on detail update; triggers Search Service reindex and Cart Service price validation.
- **`PRD-BR-15: Event product.deleted`**: Emitted on archiving; triggers cache purge and search index deletion.
- **`PRD-BR-16: Event product.approved`**: Emitted when admin approves seller listing.
- **`PRD-BR-17: Detail Cache TTL`**: Product details (`product:detail:{id}`) are cached in Redis with a **15-minute TTL**.
- **`PRD-BR-18: Cache Invalidation`**: Modifying or deleting a product immediately invalidates `product:detail:{id}` and flushes catalog search cache keys.

#### Product State Machine:
```text
[DRAFT] ──► [PENDING_APPROVAL] ──► [ACTIVE] ──► [ARCHIVED] / [REJECTED]
```

---

### 3.4 Inventory Service (`INV-BR`)
*Source Spec:* [.agent/business-rules/inventory.md](../../.agent/business-rules/inventory.md) | *Port:* `3004` | *Database:* PostgreSQL (`inventory_db`) + Redis

#### Core Business Rules:
- **`INV-BR-01: Available Stock Equation`**: `Available Quantity = Physical Quantity - Reserved Quantity`.
- **`INV-BR-02: Non-Negative Stock Constraint`**: `Available Quantity` must never drop below `0`. Reserving stock when `Available Quantity < requestedQuantity` returns `400 INSUFFICIENT_STOCK`.
- **`INV-BR-03: Safety Stock Threshold Alert`**: When `Available Quantity` drops below `safetyStockThreshold` (default: **5 units**), an `inventory.low_stock` alert event is emitted.
- **`INV-BR-04: Reservation Time-To-Live (TTL)`**: Stock reserved during checkout is locked for **15 Minutes (900 seconds)**.
- **`INV-BR-05: Automatic Reservation Expiration`**: Unpaid orders after 15 minutes expire, decrementing `Reserved Quantity` and restoring `Available Quantity`.
- **`INV-BR-06: Concurrency Locking`**: Uses **Redis Distributed Locks** (`lock:inventory:{sku}`) to prevent race conditions during high-concurrency sales.
- **`INV-BR-07: Permanent Stock Deduction`**: Upon `payment.completed`, reserved stock is permanently deducted from `Physical Quantity`, and reservation transitions to `CONFIRMED`.
- **`INV-BR-08: Order Cancellation Release`**: Upon `order.cancelled` or reservation expiration, reserved units are decremented back to `Available Quantity`.
- **`INV-BR-09: Event inventory.reserved`**: Emitted when stock is successfully reserved for an order.
- **`INV-BR-10: Event inventory.released`**: Emitted when stock reservation elapses or is cancelled.
- **`INV-BR-11: Event inventory.deducted`**: Emitted when physical stock is permanently decremented.
- **`INV-BR-12: Event inventory.low_stock`**: Emitted when available stock drops below threshold.
- **`INV-BR-13: Consumer order.created`**: Triggers stock reservation.
- **`INV-BR-14: Consumer payment.completed`**: Triggers permanent stock deduction.
- **`INV-BR-15: Consumer order.cancelled`**: Triggers immediate stock release.
- **`INV-BR-16: Atomic Database Updates`**: Updates execute via atomic SQL statements (`UPDATE inventory SET reserved = reserved + N WHERE available >= N`).
- **`INV-BR-17: Distributed Lock Expiration`**: Redis lock key `lock:inventory:{sku}` carries a **5-second TTL** to prevent deadlocks on container crashes.

#### Reservation Lifecycle:
```text
[RESERVED] ──(15 min TTL)──► [EXPIRED] (Stock Released)
    │
    ├──(Payment Completed)──► [CONFIRMED] (Stock Deducted)
    │
    └──(Order Cancelled)────► [RELEASED] (Stock Released)
```

---

### 3.5 Cart Service (`CART-BR`)
*Source Spec:* [.agent/business-rules/cart.md](../../.agent/business-rules/cart.md) | *Port:* `3005` | *Database:* Redis (`cart_store`)

#### Core Business Rules:
- **`CART-BR-01: In-Memory Storage Engine`**: Cart data is stored exclusively in **Redis** for sub-millisecond access.
- **`CART-BR-02: Authenticated Cart TTL`**: Customer carts persist for **30 Days (2,592,000 seconds)** from last update.
- **`CART-BR-03: Guest Cart TTL`**: Guest carts persist for **7 Days (604,800 seconds)** based on `guestCartId` cookie.
- **`CART-BR-04: Guest-to-User Cart Merging`**: Upon login, guest cart items merge into the authenticated user cart. Duplicate SKUs combine quantities up to limits.
- **`CART-BR-05: Distinct Item Limit`**: Maximum of **50 distinct SKU items** per cart. Attempting a 51st returns `400 CART_LIMIT_EXCEEDED`.
- **`CART-BR-06: Per-Item Quantity Ceiling`**: Maximum of **99 units** per SKU per cart item.
- **`CART-BR-07: Zero Quantity Removal`**: Updating item quantity to `0` removes the item.
- **`CART-BR-08: Transient Price Snapshots`**: Redis prices are transient snapshots; dynamic price check elapses during checkout preview.
- **`CART-BR-09: Automatic Cart Clearance`**: Placing an order emits `cart.cleared`, immediately emptying the user's cart in Redis.
- **`CART-BR-10: Event cart.item_added`**: Emitted when item is added to cart (used by Analytics).
- **`CART-BR-11: Event cart.cleared`**: Emitted when cart is emptied after order placement.
- **`CART-BR-12: Consumer product.updated`**: Triggers cart item price re-validation.
- **`CART-BR-13: Consumer order.placed`**: Triggers cart wipe for ordering user.

---

### 3.6 Order Service (`ORD-BR`)
*Source Spec:* [.agent/business-rules/order.md](../../.agent/business-rules/order.md) | *Port:* `3006` | *Database:* PostgreSQL (`order_db`)

#### Core Business Rules:
- **`ORD-BR-01: Order Identifier Format`**: Human-readable unique Order Number (`ORD-YYYYMMDD-XXXXX`).
- **`ORD-BR-02: Order Calculation Formulas`**:
  - `Subtotal = SUM(item.unitPrice * item.quantity)`
  - `DiscountAmount = Validated Discount from Promotion Service`
  - `TaxAmount = (Subtotal - DiscountAmount) * Applicable Tax Rate`
  - `ShippingFee = Calculated Rate from Shipping Service`
  - `TotalAmount = (Subtotal - DiscountAmount) + TaxAmount + ShippingFee`
- **`ORD-BR-03: Monetary Precision`**: Stored as numeric decimals with 2 decimal places (`DECIMAL(12, 2)`). Negative totals return `400 INVALID_ORDER_TOTAL`.
- **`ORD-BR-04: Idempotent Submission`**: Requires `Idempotency-Key` header to prevent duplicate order generation.
- **`ORD-BR-05: Allowed Cancellation Window`**: Customers can cancel orders only in `PENDING_PAYMENT` or `PAID` state (prior to seller fulfillment).
- **`ORD-BR-06: Disallowed Cancellation States`**: Orders in `SHIPPED`, `DELIVERED`, or `COMPLETED` cannot be directly cancelled (requires Return/Refund workflow).
- **`ORD-BR-07: Cancellation Side-Effects`**: Cancellation emits `order.cancelled`, releasing stock in Inventory Service and triggering payment refund if previously paid.
- **`ORD-BR-08: State PENDING_PAYMENT`**: Initial state upon order placement; awaits payment gateway confirmation within 15 minutes.
- **`ORD-BR-09: State PAID`**: Payment verified by Payment Service; ready for seller fulfillment.
- **`ORD-BR-10: State PROCESSING`**: Seller is packing and preparing items for carrier pickup.
- **`ORD-BR-11: State SHIPPED`**: Package handed to carrier and assigned tracking number.
- **`ORD-BR-12: State DELIVERED`**: Package confirmed delivered by carrier tracking.
- **`ORD-BR-13: State COMPLETED`**: Customer confirms receipt or 7-day auto-completion elapses.
- **`ORD-BR-14: State CANCELLED`**: Order cancelled prior to shipment; stock released.
- **`ORD-BR-15: Event order.created`**: Emitted on creation; triggers Inventory reservation and Notification dispatch.
- **`ORD-BR-16: Event order.paid`**: Emitted when payment succeeds; triggers merchant notification.
- **`ORD-BR-17: Event order.shipped`**: Emitted when carrier picks up package.
- **`ORD-BR-18: Event order.delivered`**: Emitted when package is delivered.
- **`ORD-BR-19: Event order.cancelled`**: Emitted on cancellation; triggers Inventory release & Payment refund.
- **`ORD-BR-20: Consumer payment.completed`**: Transitions order from `PENDING_PAYMENT` to `PAID`.
- **`ORD-BR-21: Consumer payment.failed`**: Transitions order from `PENDING_PAYMENT` to `CANCELLED`.
- **`ORD-BR-22: Consumer shipping.dispatched`**: Transitions order from `PROCESSING` to `SHIPPED`.

#### Order Lifecycle State Machine:
```text
               ┌───────────────────────────────┐
               ▼                               │
[PENDING_PAYMENT] ──(Payment Completed)──► [PAID] ──(Fulfillment)──► [PROCESSING]
       │                                     │                           │
 (Payment Failed /                           │                           │
  15 Min Timeout)                     (Customer Cancel)           (Carrier Dispatched)
       │                                     │                           │
       ▼                                     ▼                           ▼
  [CANCELLED] ◄──────────────────────────────┴───────────────────── [SHIPPED]
                                                                          │
                                                                  (Carrier Delivered)
                                                                          │
                                                                          ▼
                                                                    [DELIVERED]
                                                                          │
                                                                   (Return Window 7d)
                                                                          │
                                                                          ▼
                                                                    [COMPLETED]
```

---

### 3.7 Payment Service (`PAY-BR`)
*Source Spec:* [.agent/business-rules/payment.md](../../.agent/business-rules/payment.md) | *Port:* `3007` | *Database:* PostgreSQL (`payment_db`)

#### Core Business Rules:
- **`PAY-BR-01: Supported Payment Gateways`**: Stripe, PayPal, Cash on Delivery (COD), Local Bank Transfer.
- **`PAY-BR-02: Ledger Immutability`**: Transaction records are immutable ledger entries.
- **`PAY-BR-03: Currency Matching`**: Charge amount and currency must strictly match the Order total and currency.
- **`PAY-BR-04: Idempotent Payment Charge`**: Payment charge requests require an `Idempotency-Key` header.
- **`PAY-BR-05: Webhook Signature Verification`**: Inbound payment webhooks (Stripe/PayPal) MUST verify cryptographic payload signatures.
- **`PAY-BR-06: PCI-DSS Compliance`**: Card PANs, CVVs, and expiry dates are NEVER stored or logged; relies on tokenized payment tokens (`tok_...`, `pm_...`).
- **`PAY-BR-07: Refund State Prerequisite`**: Refunds permitted only for orders in `PAID`, `CANCELLED`, or `RETURNED` state.
- **`PAY-BR-08: Full Refund Calculation`**: `Full Refund Amount = Total Paid Amount`.
- **`PAY-BR-09: Partial Refund Constraint`**: `Partial Refund Amount <= Total Paid Amount - Previous Refunds`.
- **`PAY-BR-10: Gateway Refund SLA`**: Electronic refunds dispatched to originating gateway transaction ID within 24 hours of approval.
- **`PAY-BR-11: Transaction INITIATED`**: Payment intent created with gateway provider.
- **`PAY-BR-12: Transaction AUTHORIZED`**: Funds authorized / held on customer payment method.
- **`PAY-BR-13: Transaction COMPLETED`**: Payment successfully captured into merchant account.
- **`PAY-BR-14: Transaction FAILED`**: Gateway declined transaction (insufficient funds, fraud, expired card).
- **`PAY-BR-15: Transaction REFUNDED`**: Funds returned to customer payment source.
- **`PAY-BR-16: Event payment.completed`**: Emitted when capture is confirmed; triggers Order `PAID` status and Inventory stock deduction.
- **`PAY-BR-17: Event payment.failed`**: Emitted when payment is declined; triggers Order cancellation.
- **`PAY-BR-18: Event payment.refunded`**: Emitted when refund is successfully processed.
- **`PAY-BR-19: Consumer order.created`**: Initializes payment transaction record.
- **`PAY-BR-20: Consumer order.cancelled`**: Triggers automated refund workflow if order was previously paid.

#### Transaction State Machine:
```text
[INITIATED] ──► [AUTHORIZED] ──► [CAPTURED / COMPLETED] ──► [REFUNDED] / [PARTIALLY_REFUNDED]
     │
     └──(Gateway Failure)──► [FAILED]
```

---

### 3.8 Shipping Service (`SHIP-BR`)
*Source Spec:* [.agent/business-rules/shipping.md](../../.agent/business-rules/shipping.md) | *Port:* `3008` | *Database:* PostgreSQL (`shipping_db`)

#### Core Business Rules:
- **`SHIP-BR-01: Rate Input Parameters`**: Computed based on `originPostalCode`, `destinationPostalCode`, `totalDimensionalWeight` (kg), and `serviceTier` (Standard, Express, Overnight).
- **`SHIP-BR-02: Volumetric Weight Formula`**: `Volumetric Weight (kg) = (Length x Width x Height in cm) / 5000`. Billable weight is `MAX(Actual Weight, Volumetric Weight)`.
- **`SHIP-BR-03: Free Shipping Threshold`**: Orders with `Subtotal >= $100.00` qualify for standard free shipping (unless overridden by promotions).
- **`SHIP-BR-04: Fulfillment Prerequisite`**: Merchants can generate shipping labels only after order status is `PAID`.
- **`SHIP-BR-05: Mandatory Carrier Information`**: Requires assigning a valid carrier tracking number (`trackingNumber`) and carrier code (`carrierCode`).
- **`SHIP-BR-06: Label File Format`**: Generates printable PDF / ZPL shipping label files stored via Media Service.
- **`SHIP-BR-07: Real-Time Tracking Ingestion`**: Polls carrier APIs or receives webhook tracking updates.
- **`SHIP-BR-08: Auto-Completion Return Window Trigger`**: Marking status `DELIVERED` initiates the 7-day customer return countdown window.
- **`SHIP-BR-09: Status LABEL_CREATED`**: Label generated by merchant; awaiting carrier pickup.
- **`SHIP-BR-10: Status PICKED_UP`**: Package scanned into carrier origin hub.
- **`SHIP-BR-11: Status IN_TRANSIT`**: Package moving between carrier transit hubs.
- **`SHIP-BR-12: Status OUT_FOR_DELIVERY`**: Package loaded on local delivery truck.
- **`SHIP-BR-13: Status DELIVERED`**: Package handed to recipient or dropped at delivery address.
- **`SHIP-BR-14: Status FAILED_DELIVERY`**: Delivery attempt failed (recipient unavailable, wrong address).
- **`SHIP-BR-15: Event shipping.label_created`**: Emitted when merchant generates shipping label.
- **`SHIP-BR-16: Event shipping.dispatched`**: Emitted when picked up by carrier; triggers order status `SHIPPED`.
- **`SHIP-BR-17: Event shipping.delivered`**: Emitted on confirmed delivery; triggers order status `DELIVERED`.
- **`SHIP-BR-18: Consumer order.paid`**: Prepares order for merchant shipping fulfillment.

#### Carrier Shipment Lifecycle:
```text
[LABEL_CREATED] ──► [PICKED_UP] ──► [IN_TRANSIT] ──► [OUT_FOR_DELIVERY] ──► [DELIVERED]
       │                                                                  │
       └──(Carrier Exception)──► [EXCEPTION]                              └──► [FAILED_DELIVERY]
```

---

### 3.9 Promotion Service (`PROM-BR`)
*Source Spec:* [.agent/business-rules/promotion.md](../../.agent/business-rules/promotion.md) | *Port:* `3009` | *Database:* PostgreSQL (`promotion_db`) + Redis

#### Core Business Rules:
- **`PROM-BR-01: Percentage Discount Rules`**: Reduces subtotal by percentage (e.g. `20% OFF`). Requires `maxDiscountAmount` cap to prevent runaway discounts.
- **`PROM-BR-02: Fixed Amount Discount Rules`**: Reduces subtotal by fixed amount (e.g. `$15.00 OFF`). Cannot exceed cart subtotal.
- **`PROM-BR-03: Free Shipping Coupon Rules`**: Waives standard shipping fee on eligible orders.
- **`PROM-BR-04: Flash Sale Campaign Allocation`**: Time-bound pricing for selected SKUs with fixed stock allocation limits.
- **`PROM-BR-05: Temporal Validity Window`**: Coupon codes are valid strictly between `startDate` and `endDate`.
- **`PROM-BR-06: Minimum Order Subtotal Constraint`**: If specified, `Order Subtotal >= minimumOrderAmount` must hold for application.
- **`PROM-BR-07: Global Usage Cap`**: `totalUsageLimit` defines maximum total redemptions across all users.
- **`PROM-BR-08: Per-User Usage Cap`**: `perUserLimit` defines maximum redemptions per user ID (default: **1 redemption**).
- **`PROM-BR-09: Category & Product Targeting`**: Coupons can be scoped exclusively to specific Category IDs, Brand IDs, or Product SKUs.
- **`PROM-BR-10: Non-Stackable Rule`**: By default, only **1 coupon code** can be applied per checkout unless designated `isStackable: true`.
- **`PROM-BR-11: Event promotion.coupon_redeemed`**: Emitted when order successfully uses coupon code.
- **`PROM-BR-12: Event promotion.flash_sale_started`**: Emitted when flash sale campaign goes live.
- **`PROM-BR-13: Consumer order.created`**: Records coupon redemption against user ID.
- **`PROM-BR-14: Consumer order.cancelled`**: Reverts coupon redemption count for the user.

---

### 3.10 Review Service (`REV-BR`)
*Source Spec:* [.agent/business-rules/review.md](../../.agent/business-rules/review.md) | *Port:* `3010` | *Database:* PostgreSQL (`review_db`)

#### Core Business Rules:
- **`REV-BR-01: Verified Purchase Prerequisite`**: Customer can submit a review ONLY for products previously purchased and delivered (`DELIVERED` or `COMPLETED`).
- **`REV-BR-02: One Review Per Product Limit`**: Maximum of **1 review per product ID** per completed order.
- **`REV-BR-03: Rating Scale Bound`**: `rating` must be an integer between **1** and **5** stars inclusive.
- **`REV-BR-04: Review Content Bounds`**: Review text length must be between **10** and **2,000 characters**.
- **`REV-BR-05: Automated Profanity Screening`**: Reviews with profanity or blacklisted keywords are flagged for manual review (`PENDING_MODERATION`).
- **`REV-BR-06: Visibility States`**:
  - `APPROVED`: Publicly displayed on product pages.
  - `PENDING_MODERATION`: Under admin review; hidden from storefront.
  - `REJECTED`: Permanently hidden due to policy violations.
- **`REV-BR-07: Verified Purchase Badge`**: Reviews linked to confirmed delivered orders display a `Verified Purchase` badge.
- **`REV-BR-08: Average Rating Formula`**: `averageRating = SUM(ratings) / count(reviews)` rounded to 1 decimal place.
- **`REV-BR-09: Asynchronous Metric Sync`**: Product average rating and review counts re-compute asynchronously upon review approval.
- **`REV-BR-10: Event review.submitted`**: Emitted when customer posts a review.
- **`REV-BR-11: Event review.approved`**: Emitted when review is approved; updates Product Service rating metrics.
- **`REV-BR-12: Consumer order.delivered`**: Updates customer eligibility record to allow product review submission.

---

### 3.11 Media Service (`MED-BR`)
*Source Spec:* [.agent/business-rules/media.md](../../.agent/business-rules/media.md) | *Port:* `3011` | *Storage:* MinIO / Cloudflare R2 / AWS S3 + PostgreSQL (`media_db`)

#### Core Business Rules:
- **`MED-BR-01: Whitelisted MIME Types`**:
  - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
  - Documents: `application/pdf` (invoices and labels only).
- **`MED-BR-02: Maximum Image File Size`**: Images must not exceed **5 MB** per file.
- **`MED-BR-03: Maximum Document File Size`**: Banners and PDF shipping documents must not exceed **10 MB** per file.
- **`MED-BR-04: Magic Byte Header Verification`**: Initial magic bytes MUST be verified to prevent malicious file uploads (e.g. PHP scripts masked as `.png`).
- **`MED-BR-05: Automated WebP Conversion`**: Uploaded image assets are automatically converted to **WebP** format.
- **`MED-BR-06: Preset Thumbnail Sizes`**:
  - `thumbnail`: 150 x 150 px
  - `medium`: 500 x 500 px
  - `large`: 1200 x 1200 px (original quality retained)
- **`MED-BR-07: Public CDN URL Formatting`**: Endpoints return absolute HTTPS CDN URLs (e.g. `https://cdn.omnicommerce.com/uploads/2026/07/img_123.webp`).
- **`MED-BR-08: Event media.uploaded`**: Emitted when media upload finishes; contains CDN URL metadata.
- **`MED-BR-09: Event media.deleted`**: Emitted when asset is deleted from object storage.

---

### 3.12 Search Service (`SRCH-BR`)
*Source Spec:* [.agent/business-rules/search.md](../../.agent/business-rules/search.md) | *Port:* `3012` | *Database:* Elasticsearch (`products_index`)

#### Core Business Rules:
- **`SRCH-BR-01: Index Document Target`**: Indexes active product documents into the `products_index` Elasticsearch cluster.
- **`SRCH-BR-02: Relevance Weight Boosting`**:
  - Product Title: Boosted **3x**.
  - Category Name: Boosted **2x**.
  - Brand Name: Boosted **2x**.
  - Description, Tags, SKU: Weight **1x**.
- **`SRCH-BR-03: Multi-Facet Aggregation`**: Enables simultaneous filtering by `categoryId`, `brandId`, `minPrice`, `maxPrice`, `rating`, and `inStock`.
- **`SRCH-BR-04: Auto-Complete Threshold`**: Returns top 5 suggested keywords when query string length is `>= 2 characters`.
- **`SRCH-BR-05: Event-Driven Sync Ingestion`**: Listens to AMQP events from Product Service (`product.created`, `product.updated`, `product.deleted`).
- **`SRCH-BR-06: Sync Latency SLA`**: Catalog changes sync to Elasticsearch within an eventual consistency SLA of **2 Seconds**.
- **`SRCH-BR-07: Admin Reindex Execution`**: Admin reindex endpoint triggers an asynchronous background job processing `product_db` into Elasticsearch using bulk batches of 500 documents.
- **`SRCH-BR-08: Consumer product.created`**: Inserts new product document into Elasticsearch index.
- **`SRCH-BR-09: Consumer product.updated`**: Updates existing product index document attributes.
- **`SRCH-BR-10: Consumer product.deleted`**: Removes product document from Elasticsearch index.
- **`SRCH-BR-11: Consumer inventory.updated`**: Updates `inStock` boolean status in search index.

---

### 3.13 Notification Service (`NOTIF-BR`)
*Source Spec:* [.agent/business-rules/notification.md](../../.agent/business-rules/notification.md) | *Port:* `3013` | *Database:* Redis + PostgreSQL (`notification_db`)

#### Core Business Rules:
- **`NOTIF-BR-01: Email Template Rendering`**: Formats HTML emails using Handlebars templates for transactional notifications (Order Confirmation, Welcome, Password Reset).
- **`NOTIF-BR-02: SMS Dispatching`**: Dispatches short transactional SMS messages for order status updates and OTP verification codes via Twilio.
- **`NOTIF-BR-03: Mobile Push Dispatching`**: Sends push notifications to iOS and Android devices via Firebase Cloud Messaging (FCM).
- **`NOTIF-BR-04: Mandatory Transactional Messages`**: Transactional notifications (Password Reset, Order Placed, Payment Receipts) CANNOT be unsubscribed by users.
- **`NOTIF-BR-05: Marketing Preference Check`**: Promotional notifications MUST check User Service preferences (`marketingEnabled = true`). Skips message if opted out.
- **`NOTIF-BR-06: Asynchronous Queueing`**: Outbound notifications are queued in Redis via BullMQ to decouple dispatching from event emission.
- **`NOTIF-BR-07: Dispatch Retry Strategy`**: Failed delivery attempts retry **3 times** with exponential backoff (10s, 30s, 90s) before moving to Dead Letter Queue (DLQ).
- **`NOTIF-BR-08: Consumer auth.user.registered`**: Dispatches welcome email.
- **`NOTIF-BR-09: Consumer auth.password.changed`**: Dispatches security alert email.
- **`NOTIF-BR-10: Consumer order.created`**: Dispatches order placement confirmation email & push alert.
- **`NOTIF-BR-11: Consumer payment.completed`**: Dispatches payment receipt email.
- **`NOTIF-BR-12: Consumer shipping.dispatched`**: Dispatches shipment tracking email & SMS alert.

---

### 3.14 Analytics Service (`ANL-BR`)
*Source Spec:* [.agent/business-rules/analytics.md](../../.agent/business-rules/analytics.md) | *Port:* `3014` | *Database:* TimescaleDB (`analytics_db`)

#### Core Business Rules:
- **`ANL-BR-01: Non-Blocking Event Ingestion`**: Collects metrics exclusively via AMQP domain events without blocking REST transactions.
- **`ANL-BR-02: Time-Series Hyper-Table Storage`**: Stores sales and order metrics bucketed by hour, day, month, and year using TimescaleDB hyper-tables.
- **`ANL-BR-03: Gross Merchandise Value (GMV)`**: `GMV = SUM(Total Amount of All Placed Orders)`.
- **`ANL-BR-04: Net Revenue Calculation`**: `Net Revenue = SUM(Paid Orders) - SUM(Cancelled/Refunded Amounts)`.
- **`ANL-BR-05: Average Order Value (AOV)`**: `AOV = Net Revenue / Total Paid Orders Count`.
- **`ANL-BR-06: Conversion Rate Formula`**: `Conversion Rate = (Total Placed Orders / Unique Visitor Sessions) * 100`.
- **`ANL-BR-07: PII Scrubbing`**: Sensitive user data (email, name, address) is scrubbed from analytics event payloads before hyper-table insertion.
- **`ANL-BR-08: Telemetry Data Retention`**: Aggregated daily summaries retained indefinitely; raw event telemetry logs purged after **90 Days**.
- **`ANL-BR-09: Consumer order.created`**: Increments GMV and order volume counts.
- **`ANL-BR-10: Consumer order.paid`**: Updates net revenue and seller earnings metrics.
- **`ANL-BR-11: Consumer order.cancelled`**: Reverts revenue and order metrics.
- **`ANL-BR-12: Consumer user.registered`**: Increments customer growth metric.
- **`ANL-BR-13: Consumer product.created`**: Updates catalog size metric.

---

## 4. Cross-Domain Event-Driven Business Trace Matrix

The following matrix traces domain events emitted by source services and their side-effects in target consumer microservices:

| Emitted Event | Source Service | Consumer Service | Business Rule Executed | Action & Side Effect |
|---|---|---|---|---|
| `auth.user.registered` | Auth Service | User Service | `USER-BR-16` | Creates default profile & preference records in `user_db` |
| `auth.user.registered` | Auth Service | Notification Service | `NOTIF-BR-08` | Queues and dispatches customer welcome email |
| `auth.user.registered` | Auth Service | Analytics Service | `ANL-BR-12` | Increments new customer registration telemetry counter |
| `auth.password.changed` | Auth Service | Notification Service | `NOTIF-BR-09` | Sends immediate password security alert email |
| `product.created` | Product Service | Search Service | `SRCH-BR-08` | Indexes new active product in Elasticsearch (`products_index`) |
| `product.created` | Product Service | Analytics Service | `ANL-BR-13` | Increments active catalog product total counter |
| `product.updated` | Product Service | Search Service | `SRCH-BR-09` | Updates Elasticsearch index document within 2-second SLA |
| `product.updated` | Product Service | Cart Service | `CART-BR-12` | Re-validates cached item prices in Redis active carts |
| `product.deleted` | Product Service | Search Service | `SRCH-BR-10` | Purges product document from Elasticsearch index |
| `order.created` | Order Service | Inventory Service | `INV-BR-13` | Reserves SKU stock units for 15-minute checkout TTL window |
| `order.created` | Order Service | Payment Service | `PAY-BR-19` | Initializes payment transaction record in `payment_db` |
| `order.created` | Order Service | Promotion Service | `PROM-BR-13` | Increments coupon global & per-user redemption counters |
| `order.created` | Order Service | Notification Service | `NOTIF-BR-10` | Dispatches order placement confirmation email & push alert |
| `order.created` | Order Service | Analytics Service | `ANL-BR-09` | Increments GMV and order volume hyper-table metrics |
| `payment.completed` | Payment Service | Order Service | `ORD-BR-20` | Transitions order status from `PENDING_PAYMENT` to `PAID` |
| `payment.completed` | Payment Service | Inventory Service | `INV-BR-14` | Permanently deducts stock from `Physical Quantity` |
| `payment.completed` | Payment Service | Notification Service | `NOTIF-BR-11` | Dispatches official payment receipt PDF email |
| `payment.failed` | Payment Service | Order Service | `ORD-BR-21` | Transitions order status to `CANCELLED` |
| `payment.failed` | Payment Service | Inventory Service | `INV-BR-15` | Releases reserved stock units back to `Available Quantity` |
| `order.cancelled` | Order Service | Inventory Service | `INV-BR-15` | Decrements reserved stock and restores `Available Quantity` |
| `order.cancelled` | Order Service | Payment Service | `PAY-BR-20` | Triggers automated gateway refund if previously paid |
| `order.cancelled` | Order Service | Promotion Service | `PROM-BR-14` | Reverts coupon redemption count for the customer |
| `shipping.dispatched` | Shipping Service | Order Service | `ORD-BR-22` | Transitions order status from `PROCESSING` to `SHIPPED` |
| `shipping.dispatched` | Shipping Service | Notification Service | `NOTIF-BR-12` | Sends tracking number SMS & email notification |
| `shipping.delivered` | Shipping Service | Order Service | `ORD-BR-18` | Transitions order status to `DELIVERED` |
| `shipping.delivered` | Shipping Service | Review Service | `REV-BR-12` | Grants verified purchase review eligibility to customer |

---

## 5. Compliance & Implementation Verification Checklist

Backend engineers implementing or modifying microservices MUST verify compliance against this checklist before opening Pull Requests:

- [ ] **DB Boundary Check**: Does the code query only the service's dedicated database without joining external databases?
- [ ] **Outbox Pattern Check**: Are domain events enqueued to the local service `outbox` table within the primary DB transaction?
- [ ] **Idempotency Check**: Are mutation REST handlers protected by `Idempotency-Key` guards and Redis locks?
- [ ] **DTO Validation**: Are request payloads strictly typed with Class Validator annotations rejecting unknown properties?
- [ ] **Error Envelope Standardization**: Do HTTP errors strictly conform to `API_ARCHITECTURE.md` standard error payload formats?
- [ ] **RBAC / Ownership Check**: Are permission string checks (`<domain>:<action>`) and owner checks (`userId === token.sub`) enforced?
- [ ] **State Machine Integrity**: Do entity state updates strictly validate allowed previous states before transitioning?
