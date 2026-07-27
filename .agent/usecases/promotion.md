# Promotion Service Use Cases

> **Service Path:** `apps/backend/promotion-service/`  
> **Default Port:** `3009`  
> **Business Rules Reference:** [promotion.md](../business/promotion.md)  

---

### PROM-UC-01: Validate Coupon Code & Calculate Discount Preview

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
  - *Expired Coupon*: Returns `400 BAD_REQUEST` with `COUPON_EXPIRED`.
  - *Usage Cap Reached*: Returns `400 BAD_REQUEST` with `COUPON_USAGE_LIMIT_REACHED`.
  - *Minimum Subtotal Not Met*: Returns `400 BAD_REQUEST` with `MINIMUM_SUBTOTAL_NOT_MET`.
- **Business Rules Referenced**: `PROM-BR-01`, `PROM-BR-02`, `PROM-BR-05`, `PROM-BR-06`, `PROM-BR-07`, `PROM-BR-08`, `PROM-BR-10`.
- **Postconditions**: Validated discount amount returned for checkout computation.

---

### PROM-UC-02: Redeem Coupon Code Upon Order Placement

- **Primary Actor**: Order Service (Event Consumer)
- **Preconditions**: Order placed successfully containing a valid coupon code.
- **Trigger**: AMQP Event `order.created` received by Promotion Service.
- **Main Success Scenario**:
  1. Promotion Service extracts `couponCode` and `userId` from event payload.
  2. Service atomically increments global redemption counter and user redemption counter in `promotion_db`.
  3. Service logs coupon redemption transaction record.
  4. Service emits `promotion.coupon_redeemed` event.
- **Business Rules Referenced**: `PROM-BR-07`, `PROM-BR-08`, `PROM-BR-11`, `PROM-BR-13`.
- **Postconditions**: Redemption counter incremented in DB, event emitted.

---

### PROM-UC-03: Create Promotional Coupon Code (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Requester possesses `ADMIN` role.
- **Trigger**: Admin sends `POST /api/v1/promotions/coupons` with coupon parameters.
- **Main Success Scenario**:
  1. Promotion Service validates coupon rules (discount type, value, active dates, caps).
  2. Service inserts coupon record into `promotion_db`.
  3. Service caches coupon code in Redis for fast validation lookup.
  4. Service returns `201 CREATED`.
- **Business Rules Referenced**: `PROM-BR-01` through `PROM-BR-10`.
- **Postconditions**: Coupon code created in DB and cached in Redis.

---

### PROM-UC-04: Schedule & Launch Flash Sale Campaign (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Target product SKUs exist.
- **Trigger**: Admin sends `POST /api/v1/promotions/flash-sales` with SKUs, promotional price, stock allocation limit, start/end timestamps.
- **Main Success Scenario**:
  1. Promotion Service creates flash sale campaign record in `promotion_db`.
  2. Service schedules background activation job at `startDate`.
  3. Upon reaching `startDate`, Service emits `promotion.flash_sale_started` event (`PROM-BR-12`).
  4. Search Service and Product Service consume event to update promotional price tags.
  5. Service returns `201 CREATED`.
- **Business Rules Referenced**: `PROM-BR-04`, `PROM-BR-12`.
- **Postconditions**: Flash sale campaign scheduled and live event broadcasted.
