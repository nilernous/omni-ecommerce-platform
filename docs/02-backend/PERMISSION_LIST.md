# OmniCommerce Platform - Comprehensive Permission Directory

> **Document Version:** `1.0.0`  
> **Last Updated:** `2026-07-28`  
> **Status:** `APPROVED`  
> **Scope:** Backend Microservices, API Gateway, BFF, RBAC Authorization Guards  
> **Related Architecture Docs:** [API_ARCHITECTURE.md](./API_ARCHITECTURE.md), [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md), [NESTJS_SERVICE_ARCHITECTURE.md](./NESTJS_SERVICE_ARCHITECTURE.md)

---

## 1. Overview & Architectural Principles

This document defines the central **Permission Directory** for the OmniCommerce microservices architecture. Authorization across all REST endpoints, GraphQL queries/mutations, and gRPC internal calls follows a fine-grained **Role-Based Access Control (RBAC)** model combined with **Resource Ownership Validation (ABAC)**.

### Key Authorization Principles:
1. **Explicit Permission Strings**: Permissions are uniquely identified formatted string literals using the canonical standard `<domain>:<action>` or `<domain>:<action>_<scope>` (e.g., `product:create`, `order:read_self`).
2. **Decoupled Roles**: User roles (`CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN`) are administrative bundles of permissions. Application code checks fine-grained permissions or ownership rather than hardcoding role names.
3. **Stateless JWT Claims**: Active permissions are encoded directly within the JWT Access Token `permissions` array for stateless validation at the API Gateway and NestJS Guard layers.
4. **Ownership-Aware Checks**: Resource-level access (e.g., modifying an order or address) checks both permission string grants and resource ownership (`userId === token.sub`).

---

## 2. Permission Naming Specification

All system permissions follow a standard colon-delimited format:

$$\text{\`<domain>:<action>\`} \quad \text{or} \quad \text{\`<domain>:<action>\_<scope>\`}$$

- **`<domain>`**: The target business microservice or entity (`product`, `order`, `cart`, `user`, `inventory`, `payment`, `shipping`, `promotion`, `review`, `search`, `media`, `notification`, `analytics`, `system`).
- **`<action>`**: The operation being executed (`create`, `read`, `update`, `delete`, `approve`, `reject`, `reserve`, `release`, `adjust`, `process`, `refund`, `validate`, `fulfill`, `moderate`, `reindex`, `upload`).
- **`<scope>`** *(Optional)*: Access boundary qualifier when explicit separation is required (`self` for user-owned resources, `store` for seller merchant resources, `all` for platform-wide administrative resources).

---

## 3. System Roles & Permission Mapping Matrix

The platform recognizes five primary identity roles. The table below outlines default permission scope assignments:

| Role | Scope & Level | Default Assigned Permissions |
|---|---|---|
| `GUEST` | Unauthenticated public visitor | `product:read`, `category:read`, `brand:read`, `search:query`, `search:suggest`, `cart:read`, `cart:add_item`, `cart:update_item`, `cart:delete_item`, `cart:clear`, `shipping:calculate`, `review:read`, `promotion:read` |
| `CUSTOMER` | Authenticated end consumer | All `GUEST` permissions + `auth:logout`, `auth:read_self`, `user:profile_read_self`, `user:profile_update_self`, `user:address_*`, `user:preference_update_self`, `cart:merge`, `order:create`, `order:read_self`, `order:cancel_self`, `order:timeline_read`, `payment:process`, `promotion:validate`, `shipping:track`, `review:create`, `notification:read_self`, `notification:update_self` |
| `SELLER` | Verified merchant vendor | `auth:*`, `user:profile_*`, `product:create`, `product:read_draft`, `product:update` *(owned)*, `product:delete` *(owned)*, `inventory:read`, `inventory:adjust` *(owned)*, `order:read_store`, `order:update_status` *(owned)*, `shipping:create` *(fulfill owned)*, `shipping:track`, `analytics:top_products_read`, `analytics:seller_read`, `media:upload`, `media:delete` *(owned)* |
| `ADMIN` | Platform operational admin | All `SELLER` permissions + `user:read_all`, `user:read`, `user:block`, `user:role_assign`, `product:approve`, `product:reject`, `category:*`, `brand:*`, `inventory:warehouse_*`, `order:read_all`, `order:cancel_admin`, `payment:read`, `payment:refund_full`, `payment:refund_partial`, `promotion:*`, `review:moderate`, `review:delete`, `search:reindex`, `notification:send_test`, `analytics:sales_read` |
| `SUPER_ADMIN` | Root system administrator | Wildcard `*` (Full unrestricted platform control, system configuration, audit logs, and role management) |

---

## 4. Full Permission Directory by Domain

### 4.1 Auth Service (`auth`)
*Service Path:* `apps/backend/auth-service/` | *Port:* `3001`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `auth:register` | Register Account | Create new customer or seller user identity | Public (`GUEST`) | `AUTH-BR-01` to `AUTH-BR-05` (`POST /api/v1/auth/register`) |
| `auth:login` | Authenticate Credentials | Validate credentials and receive JWT access/refresh tokens | Public (`GUEST`) | `AUTH-BR-07`, `AUTH-BR-11` (`POST /api/v1/auth/login`) |
| `auth:logout` | Revoke Current Session | Revoke active refresh token and invalidate JWT | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `AUTH-BR-08`, `AUTH-BR-18` (`POST /api/v1/auth/logout`) |
| `auth:refresh` | Rotate Access Token | Exchange valid refresh token for new token pair | Public (Refresh Token) | `AUTH-BR-09`, `AUTH-BR-10` (`POST /api/v1/auth/refresh-token`) |
| `auth:forgot_password` | Password Reset Request | Generate & send password reset token email | Public (`GUEST`) | `AUTH-BR-12` (`POST /api/v1/auth/forgot-password`) |
| `auth:reset_password` | Complete Password Reset | Reset account password using reset token | Public (Reset Token) | `AUTH-BR-13`, `AUTH-BR-14` (`POST /api/v1/auth/reset-password`) |
| `auth:read_self` | Read Current Identity | Retrieve authenticated identity metadata from JWT | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `AUTH-BR-07` (`GET /api/v1/auth/me`) |
| `auth:revoke_session` | Invalidate User Sessions | Force revoke all active sessions for a target user ID | `ADMIN`, `SUPER_ADMIN` | `AUTH-BR-14`, `AUTH-BR-18` |

---

### 4.2 User Service (`user`)
*Service Path:* `apps/backend/user-service/` | *Port:* `3002`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `user:profile_read_self` | Read Own Profile | Retrieve personal user profile details | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `USER-BR-01` (`GET /api/v1/users/profile`) |
| `user:profile_update_self` | Update Own Profile | Modify personal profile fields (name, phone, avatar) | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `USER-BR-02`, `USER-BR-04`, `USER-BR-05` (`PATCH /api/v1/users/profile`) |
| `user:read_all` | List All Users | List platform users with pagination & search | `ADMIN`, `SUPER_ADMIN` | `USER-BR-17` |
| `user:read` | View User Details | View detailed profile of any platform user | `ADMIN`, `SUPER_ADMIN` | `USER-BR-17` |
| `user:block` | Suspend User Account | Suspend user account from platform activities | `ADMIN`, `SUPER_ADMIN` | `AUTH-BR-15`, `USER-BR-13` |
| `user:delete` | Soft-Delete Account | Mark user account as soft-deleted for purge window | `CUSTOMER` (self), `ADMIN`, `SUPER_ADMIN` | `AUTH-BR-15` |
| `user:role_assign` | Modify User Roles | Grant or revoke user roles and permission sets | `ADMIN`, `SUPER_ADMIN` | `USER-BR-13` |
| `user:address_read_self` | List Own Addresses | List saved delivery addresses for user | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `USER-BR-06` (`GET /api/v1/users/addresses`) |
| `user:address_create_self` | Create Delivery Address | Add new delivery address (max 10 limit) | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `USER-BR-06`, `USER-BR-07`, `USER-BR-10` (`POST /api/v1/users/addresses`) |
| `user:address_update_self` | Update Delivery Address | Modify address details or update default address status | `CUSTOMER` (owner), `ADMIN`, `SUPER_ADMIN` | `USER-BR-08`, `USER-BR-10` (`PUT /api/v1/users/addresses/{id}`) |
| `user:address_delete_self` | Delete Delivery Address | Remove delivery address and trigger default re-assignment | `CUSTOMER` (owner), `ADMIN`, `SUPER_ADMIN` | `USER-BR-09` (`DELETE /api/v1/users/addresses/{id}`) |
| `user:preference_update_self` | Update Preferences | Update notification channels & marketing opt-in settings | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `USER-BR-11`, `USER-BR-12` (`PATCH /api/v1/users/preferences`) |

---

### 4.3 Product Service (`product`)
*Service Path:* `apps/backend/product-service/` | *Port:* `3003`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `product:read` | Read Public Products | Browse active products in public catalog | Public (`GUEST`) | `PRD-BR-10` (`GET /api/v1/products`, `GET /api/v1/products/{id}`) |
| `product:read_draft` | Read Draft Products | View seller owned or pending approval product listings | `SELLER` (owner), `ADMIN`, `SUPER_ADMIN` | `PRD-BR-11` |
| `product:create` | Create Product | Create new product listing (defaults to `PENDING_APPROVAL`) | `SELLER`, `ADMIN`, `SUPER_ADMIN` | `PRD-BR-01` to `PRD-BR-09` (`POST /api/v1/products`) |
| `product:update` | Update Product | Update product details, prices, variants, and media | `SELLER` (owner), `ADMIN`, `SUPER_ADMIN` | `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-14` (`PUT /api/v1/products/{id}`) |
| `product:delete` | Archive Product | Soft-delete or archive product listing | `SELLER` (owner), `ADMIN`, `SUPER_ADMIN` | `PRD-BR-15` (`DELETE /api/v1/products/{id}`) |
| `product:approve` | Approve Seller Listing | Approve pending seller listing into `ACTIVE` state | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-10`, `PRD-BR-16` (`POST /api/v1/products/{id}/approve`) |
| `product:reject` | Reject Seller Listing | Reject pending product listing with mandatory note | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-12` (`POST /api/v1/products/{id}/approve`) |
| `category:read` | Read Category Tree | View category hierarchy tree structure | Public (`GUEST`) | `PRD-BR-07` (`GET /api/v1/products/categories`) |
| `category:create` | Create Category | Add new product category (max 3 levels deep) | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-07` (`POST /api/v1/products/categories`) |
| `category:update` | Update Category | Modify category title, slug, or parent link | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-07` |
| `category:delete` | Delete Category | Remove product category | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-07` |
| `brand:read` | Read Brands | List active brands | Public (`GUEST`) | `PRD-BR-08` |
| `brand:create` | Create Brand | Register new product brand entity | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-08` |
| `brand:update` | Update Brand | Edit brand details or logo | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-08` |
| `brand:delete` | Delete Brand | Remove brand entity | `ADMIN`, `SUPER_ADMIN` | `PRD-BR-08` |

---

### 4.4 Inventory Service (`inventory`)
*Service Path:* `apps/backend/inventory-service/` | *Port:* `3004`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `inventory:read` | Read Stock Balance | View real-time available & reserved stock by SKU | Public, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `INV-BR-01` (`GET /api/v1/inventory/stock/{sku}`) |
| `inventory:reserve` | Reserve Stock | Temporarily reserve stock units during checkout (15m TTL) | Internal (`order-service`, `BFF`) | `INV-BR-04`, `INV-BR-06` (`POST /api/v1/inventory/reserve`) |
| `inventory:release` | Release Stock Reservation | Release locked stock reservation back to available pool | Internal (`order-service`, System) | `INV-BR-05`, `INV-BR-08` (`POST /api/v1/inventory/release`) |
| `inventory:adjust` | Adjust Physical Stock | Update physical warehouse stock balance for SKU | `SELLER` (owner), `ADMIN`, `SUPER_ADMIN` | `INV-BR-01`, `INV-BR-02` (`POST /api/v1/inventory/adjust`) |
| `inventory:warehouse_read` | List Warehouses | View warehouse locations & stock distributions | `ADMIN`, `SUPER_ADMIN` | `INV-BR-03` (`GET /api/v1/inventory/warehouses`) |
| `inventory:warehouse_manage` | Manage Warehouses | Create or modify warehouse facilities | `ADMIN`, `SUPER_ADMIN` | `INV-BR-03` |

---

### 4.5 Cart Service (`cart`)
*Service Path:* `apps/backend/cart-service/` | *Port:* `3005`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `cart:read` | View Active Cart | Retrieve active shopping cart contents | Public (`GUEST`, `CUSTOMER`) | `CART-BR-01` to `CART-BR-03` (`GET /api/v1/cart`) |
| `cart:add_item` | Add Cart Item | Add product variant to active cart session | Public (`GUEST`, `CUSTOMER`) | `CART-BR-05`, `CART-BR-06` (`POST /api/v1/cart/items`) |
| `cart:update_item` | Update Cart Item Quantity | Modify item quantity in cart (max 99 units) | Public (`GUEST`, `CUSTOMER`) | `CART-BR-06`, `CART-BR-07` (`PATCH /api/v1/cart/items/{id}`) |
| `cart:delete_item` | Remove Cart Item | Remove specific item SKU from active cart | Public (`GUEST`, `CUSTOMER`) | `CART-BR-07` (`DELETE /api/v1/cart/items/{id}`) |
| `cart:clear` | Clear Cart | Wipe all items from shopping cart | Public (`GUEST`, `CUSTOMER`) | `CART-BR-09` (`DELETE /api/v1/cart`) |
| `cart:merge` | Merge Guest Cart | Merge guest cart contents into customer cart on login | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `CART-BR-04` (`POST /api/v1/cart/merge`) |

---

### 4.6 Order Service (`order`)
*Service Path:* `apps/backend/order-service/` | *Port:* `3006`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `order:create` | Submit Order | Place order and trigger inventory reservation | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` | `ORD-BR-01` to `ORD-BR-04` (`POST /api/v1/orders`) |
| `order:read_self` | Read Own Orders | List and view customer's own order history | `CUSTOMER` | `ORD-BR-01` (`GET /api/v1/orders`) |
| `order:read_store` | Read Store Orders | List order line items belonging to seller's merchant store | `SELLER` | `ORD-BR-01` (`GET /api/v1/orders`) |
| `order:read_all` | Read All Orders | List all orders across platform | `ADMIN`, `SUPER_ADMIN` | `ORD-BR-01` (`GET /api/v1/orders`) |
| `order:read_detail` | View Order Details | Retrieve full order details, addresses, and status history | `CUSTOMER` (owner), `SELLER` (store), `ADMIN`, `SUPER_ADMIN` | `ORD-BR-01`, `ORD-BR-02` (`GET /api/v1/orders/{id}`) |
| `order:cancel_self` | Cancel Own Order | Cancel order during `PENDING_PAYMENT` or `PAID` state | `CUSTOMER` (owner) | `ORD-BR-05`, `ORD-BR-06` (`POST /api/v1/orders/{id}/cancel`) |
| `order:cancel_admin` | Admin Cancel Order | Force cancel order and trigger inventory release / refund | `ADMIN`, `SUPER_ADMIN` | `ORD-BR-07` (`POST /api/v1/orders/{id}/cancel`) |
| `order:update_status` | Update Order Status | Advance order status machine (`PROCESSING`, `SHIPPED`, etc.) | `SELLER` (owned items), `ADMIN`, `SUPER_ADMIN` | `ORD-BR-08` to `ORD-BR-14` |
| `order:timeline_read` | View Order Timeline | View complete state transition audit trail for order | `CUSTOMER` (owner), `ADMIN`, `SUPER_ADMIN` | `ORD-BR-07` (`GET /api/v1/orders/{id}/timeline`) |

---

### 4.7 Payment Service (`payment`)
*Service Path:* `apps/backend/payment-service/` | *Port:* `3007`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `payment:process` | Charge Payment | Initiate payment transaction with third-party gateway | `CUSTOMER` (checkout), `ADMIN`, `SUPER_ADMIN` | `PAY-BR-01` to `PAY-BR-04` (`POST /api/v1/payments/process`) |
| `payment:verify` | Verify Webhook | Receive & verify inbound payment gateway webhook signature | Public (Gateway Webhook) | `PAY-BR-05` (`POST /api/v1/payments/verify`) |
| `payment:read` | View Payment Receipt | Retrieve transaction ledger entry and payment status | `CUSTOMER` (owner), `ADMIN`, `SUPER_ADMIN` | `PAY-BR-02` (`GET /api/v1/payments/transactions/{id}`) |
| `payment:refund_full` | Issue Full Refund | Process 100% monetary refund to original payment source | `ADMIN`, `SUPER_ADMIN` | `PAY-BR-07`, `PAY-BR-08` (`POST /api/v1/payments/refunds`) |
| `payment:refund_partial` | Issue Partial Refund | Process partial refund up to net paid balance | `ADMIN`, `SUPER_ADMIN` | `PAY-BR-07`, `PAY-BR-09` (`POST /api/v1/payments/refunds`) |

---

### 4.8 Promotion Service (`promotion`)
*Service Path:* `apps/backend/promotion-service/` | *Port:* `3009`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `promotion:validate` | Validate Coupon | Validate coupon eligibility & calculate discount amount | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `PROM-BR-05` to `PROM-BR-10` (`POST /api/v1/promotions/coupons/validate`) |
| `promotion:read` | Read Campaigns | Browse active promotional campaigns and marketing banners | Public (`GUEST`) | `PROM-BR-04` (`GET /api/v1/promotions/campaigns`) |
| `promotion:create` | Create Coupon | Create new promotional discount coupon code | `ADMIN`, `SUPER_ADMIN` | `PROM-BR-01` to `PROM-BR-03` (`POST /api/v1/promotions/coupons`) |
| `promotion:update` | Update Promotion | Modify active coupon dates, usage limits, or discount values | `ADMIN`, `SUPER_ADMIN` | `PROM-BR-05` to `PROM-BR-08` |
| `promotion:delete` | Delete Promotion | Deactivate or delete promotional coupon code | `ADMIN`, `SUPER_ADMIN` | `PROM-BR-05` |
| `promotion:flash_sale_create` | Schedule Flash Sale | Schedule flash sale campaign and allocate stock quotas | `ADMIN`, `SUPER_ADMIN` | `PROM-BR-04` (`POST /api/v1/promotions/flash-sales`) |

---

### 4.9 Shipping Service (`shipping`)
*Service Path:* `apps/backend/shipping-service/` | *Port:* `3008`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `shipping:calculate` | Calculate Shipping Fee | Compute shipping options, fees, and delivery windows | Public (`GUEST`, `CUSTOMER`) | `SHIP-BR-01` to `SHIP-BR-03` (`POST /api/v1/shipping/calculate-rate`) |
| `shipping:create` | Generate Carrier Label | Create shipment & generate printable carrier shipping label | `SELLER` (owner), `ADMIN`, `SUPER_ADMIN` | `SHIP-BR-04` to `SHIP-BR-06` (`POST /api/v1/shipping/shipments`) |
| `shipping:track` | Track Shipment | View real-time carrier tracking events and status timeline | `CUSTOMER` (owner), `SELLER`, `ADMIN`, `SUPER_ADMIN` | `SHIP-BR-07` (`GET /api/v1/shipping/shipments/{id}/track`) |
| `shipping:webhook` | Carrier Webhook Ingestion | Process real-time tracking update webhooks from carriers | Public (Carrier Webhook) | `SHIP-BR-07`, `SHIP-BR-08` (`POST /api/v1/shipping/webhook/{carrier}`) |

---

### 4.10 Review Service (`review`)
*Service Path:* `apps/backend/review-service/` | *Port:* `3010`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `review:read` | Read Reviews | List approved product reviews and star rating breakdown | Public (`GUEST`) | `REV-BR-06` (`GET /api/v1/reviews/products/{productId}`) |
| `review:create` | Submit Review | Post product rating & text review for verified purchase | `CUSTOMER` (verified buyer) | `REV-BR-01` to `REV-BR-04` (`POST /api/v1/reviews/products/{productId}`) |
| `review:moderate` | Moderate Review | Approve or reject pending customer reviews | `ADMIN`, `SUPER_ADMIN` | `REV-BR-05`, `REV-BR-06` (`POST /api/v1/reviews/{id}/moderate`) |
| `review:delete` | Delete Review | Delete offensive or spam customer review | `ADMIN`, `SUPER_ADMIN` | `REV-BR-06` |

---

### 4.11 Search Service (`search`)
*Service Path:* `apps/backend/search-service/` | *Port:* `3012`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `search:query` | Full-Text Search | Perform catalog search with full-text queries & facets | Public (`GUEST`) | `SRCH-BR-01` to `SRCH-BR-03` (`GET /api/v1/search/products`) |
| `search:suggest` | Auto-Complete Suggestions | Fetch auto-complete query keyword suggestions | Public (`GUEST`) | `SRCH-BR-04` (`GET /api/v1/search/suggestions`) |
| `search:reindex` | Trigger Catalog Reindex | Execute full asynchronous catalog reindex into Elasticsearch | `ADMIN`, `SUPER_ADMIN` | `SRCH-BR-07` (`POST /api/v1/search/reindex`) |

---

### 4.12 Media Service (`media`)
*Service Path:* `apps/backend/media-service/` | *Port:* `3011`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `media:upload` | Upload File Asset | Upload image or document asset with magic-byte check | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `MED-BR-01` to `MED-BR-04` (`POST /api/v1/media/upload`) |
| `media:read` | Read Media Metadata | Fetch file dimensions, size, format, and CDN URLs | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `MED-BR-07` (`GET /api/v1/media/{id}/metadata`) |
| `media:delete` | Delete Media Asset | Remove file asset from object storage bucket | `SELLER` (owner), `ADMIN`, `SUPER_ADMIN` | `MED-BR-09` (`DELETE /api/v1/media/{id}`) |

---

### 4.13 Notification Service (`notification`)
*Service Path:* `apps/backend/notification-service/` | *Port:* `3013`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `notification:read_self` | Read Notifications History | Retrieve customer in-app notification history | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `NOTIF-BR-01` (`GET /api/v1/notifications`) |
| `notification:update_self` | Mark Notification Read | Update in-app notification status to read | `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN` | `NOTIF-BR-01` (`PATCH /api/v1/notifications/{id}/read`) |
| `notification:send_test` | Send Test Notification | Trigger test email/SMS template dispatch | `ADMIN`, `SUPER_ADMIN` | `NOTIF-BR-01` (`POST /api/v1/notifications/send-test`) |

---

### 4.14 Analytics Service (`analytics`)
*Service Path:* `apps/backend/analytics-service/` | *Port:* `3014`

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `analytics:sales_read` | Read Platform Sales Summary | View platform GMV, net revenue, and AOV metrics | `ADMIN`, `SUPER_ADMIN` | `ANL-BR-03` to `ANL-BR-06` (`GET /api/v1/analytics/sales-summary`) |
| `analytics:top_products_read` | Read Top Products Report | View top-selling products by quantity and revenue | `SELLER`, `ADMIN`, `SUPER_ADMIN` | `ANL-BR-05` (`GET /api/v1/analytics/top-products`) |
| `analytics:seller_read` | Read Seller Performance | Access merchant-specific sales performance metrics | `SELLER` (store owner), `ADMIN`, `SUPER_ADMIN` | `ANL-BR-06` (`GET /api/v1/analytics/seller/performance`) |

---

### 4.15 System & Role Governance (`system`, `role`)
*Domain:* Global Platform Governance & Auditing

| Permission String | Name | Description | Allowed Roles | Ref Business Rule / Endpoint |
|---|---|---|---|---|
| `role:read` | Read Roles & Permissions | View predefined platform roles and permission mappings | `ADMIN`, `SUPER_ADMIN` | `USER-BR-13` |
| `role:manage` | Manage Roles & Permissions | Create custom roles or update permission assignments | `SUPER_ADMIN` | `USER-BR-13` |
| `system:health_read` | View System Health | Access service health status, metrics, and telemetry | `ADMIN`, `SUPER_ADMIN` | Platform Operational Standard |
| `system:audit_read` | Read System Audit Logs | Inspect administrative audit logs and security events | `SUPER_ADMIN` | Security Governance |
| `system:config_manage` | Manage Platform Configuration | Modify global system feature flags, limits, and settings | `SUPER_ADMIN` | Configuration Governance |

---

## 5. NestJS Implementation Specification

Authorization in OmniCommerce NestJS microservices is enforced using standard custom decorators combined with NestJS Guards.

### 5.1 Permission Decorator Definition

```typescript
// common/decorators/require-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (...permissions: string[]) => 
  SetMetadata(PERMISSION_KEY, permissions);
```

### 5.2 Permissions Guard Implementation

```typescript
// common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No explicit permission required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.permissions) {
      throw new ForbiddenException('Access denied: No permissions context found');
    }

    // Super Admin wildcard check
    if (user.permissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: Missing required permission [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
```

### 5.3 Controller Usage Example

```typescript
// apps/backend/product-service/src/product.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, RequirePermission } from '@omnicommerce/common';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductController {

  @Post()
  @RequirePermission('product:create')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}
```

### 5.4 Handling Unauthenticated Guest Permissions (`GUEST` Role)

For unauthenticated visitors (who lack a valid JWT Access Token), permission resolution works through one of three architectural patterns:

#### Pattern A: `@Public()` Decorator + Default Guest Context (Recommended)
Routes intended for public access are decorated with `@Public()`. When `JwtAuthGuard` encounters `@Public()`, it skips token validation and assigns a synthetic `GUEST` user context:

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      // Inject synthetic GUEST identity context if no token present
      if (!request.user) {
        request.user = {
          sub: 'anonymous',
          roles: ['GUEST'],
          permissions: GUEST_DEFAULT_PERMISSIONS, // ['product:read', 'cart:add_item', 'search:query', ...]
        };
      }
      return true;
    }

    return super.canActivate(context);
  }
}
```

---

## 6. Audit & Security Guidelines

1. **Token Invalidation on Permission Change**: When an administrator updates a user's roles (`user:role_assign`), the Auth Service immediately revokes all active refresh tokens for that user ID and adds the current access token `jti` to the Redis blacklist (`blacklist:jti:{id}`).
2. **Least Privilege Principle**: API Gateway and BFF routes must reject requests before hitting microservices if required permission headers are absent.
3. **Audit Logging**: Any execution of actions requiring `ADMIN` or `SUPER_ADMIN` permissions MUST log an immutable audit trail entry containing `userId`, `permission`, `ipAddress`, `timestamp`, and `resourceId`.

