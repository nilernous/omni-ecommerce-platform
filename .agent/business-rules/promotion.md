# Promotion Service Business Rules

> **Service Path:** `apps/backend/promotion-service/`  
> **Default Port:** `3009`  
> **Primary Storage:** PostgreSQL (`promotion_db`) + Redis (`coupon_cache`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Promotion Service** manages promotional campaigns, discount coupon codes, flash sales, tier discounts, voucher redemption rules, and customer usage limits.

---

## 2. Core Business Rules & Validations

### Coupon & Promotion Types
- **PROM-BR-01: Percentage Discount Rules**: Reduces eligible order subtotal by a percentage (e.g. `20% OFF`). Requires specifying a `maxDiscountAmount` cap to prevent runaway discounts.
- **PROM-BR-02: Fixed Amount Discount Rules**: Reduces order subtotal by a fixed monetary amount (e.g. `$15.00 OFF`). Cannot exceed cart subtotal.
- **PROM-BR-03: Free Shipping Coupon Rules**: Waives standard shipping fee on eligible orders.
- **PROM-BR-04: Flash Sale Campaign Allocation**: Time-bound promotional pricing for selected product SKUs with fixed inventory stock allocation limits.

### Validation Rules
- **PROM-BR-05: Temporal Validity Window**: Coupon codes are valid strictly between `startDate` and `endDate` timestamps.
- **PROM-BR-06: Minimum Order Subtotal Constraint**: If `minimumOrderAmount` is specified, `Order Subtotal >= minimumOrderAmount` must hold for discount application.
- **PROM-BR-07: Global Usage Cap**: `totalUsageLimit` defines maximum total redemptions allowed across all users (e.g. first 1,000 customers).
- **PROM-BR-08: Per-User Usage Cap**: `perUserLimit` defines maximum redemptions per individual user ID (default: **1 redemption per customer**).
- **PROM-BR-09: Category & Product Targeting**: Coupons can be scoped exclusively to specific Category IDs, Brand IDs, or Product SKUs.
- **PROM-BR-10: Non-Stackable Rule**: By default, only **1 coupon code** can be applied per checkout transaction unless explicitly designated `isStackable: true`.

---

## 3. Discount Application Logic

```text
Input: (Cart Subtotal, User ID, Coupon Code)
  │
  ├── 1. Verify Active Dates (startDate <= NOW <= endDate)
  ├── 2. Verify Global & User Usage Limits
  ├── 3. Verify Minimum Order Subtotal
  └── 4. Calculate Discount Amount -> Return Validated Discount
```

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/promotions/coupons/validate` | Customer | Validate coupon code & calculate discount preview |
| `GET` | `/api/v1/promotions/campaigns` | Public | List active marketing campaigns & banners |
| `POST` | `/api/v1/promotions/coupons` | Admin | Create new promotional discount coupon |
| `POST` | `/api/v1/promotions/flash-sales` | Admin | Schedule flash sale campaign & stock allocations |

---

## 5. Domain Events Emitted & Consumed

### Emitted Events
- **PROM-BR-11: Event `promotion.coupon_redeemed`**: Emitted when an order successfully uses a coupon code. Increments redemption counters.
- **PROM-BR-12: Event `promotion.flash_sale_started`**: Emitted when flash sale campaign goes live.

### Consumed Events
- **PROM-BR-13: Consumer `order.created`**: Records coupon redemption transaction against user ID.
- **PROM-BR-14: Consumer `order.cancelled`**: Reverts coupon redemption count for the user.
