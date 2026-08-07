# Order Service Business Rules

> **Service Path:** `apps/backend/order-service/`  
> **Default Port:** `3006`  
> **Primary Storage:** PostgreSQL (`order_db`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Order Service** governs the entire order lifecycle, order placement orchestration, price calculations (subtotal, tax, shipping, discount), order status state machine, cancellation rules, and fulfillment status auditing.

---

## 2. Core Business Rules & Validations

### Order Creation & Calculation Rules
- **ORD-BR-01: Order Identifier Format**: Orders are assigned a human-readable, unique Order Number (`ORD-YYYYMMDD-XXXXX`).
- **ORD-BR-02: Order Calculation Formulas**:
  - `Subtotal = SUM(item.unitPrice * item.quantity)`
  - `DiscountAmount = Validated Discount from Promotion Service`
  - `TaxAmount = (Subtotal - DiscountAmount) * Applicable Tax Rate`
  - `ShippingFee = Calculated Rate from Shipping Service`
  - `TotalAmount = (Subtotal - DiscountAmount) + TaxAmount + ShippingFee`
- **ORD-BR-03: Monetary Precision**: All monetary values are calculated and stored as numeric decimals with 2 decimal places (`DECIMAL(12, 2)`). Negative totals return `400 INVALID_ORDER_TOTAL`.
- **ORD-BR-04: Idempotent Submission**: Order creation requests require an `Idempotency-Key` header to prevent duplicate order generation on network retries.

### Order Cancellation Rules
- **ORD-BR-05: Allowed Cancellation Window**: Customers can cancel an order only while its status is `PENDING_PAYMENT` or `PAID` (before merchant fulfillment begins).
- **ORD-BR-06: Disallowed Cancellation States**: Orders in `SHIPPED`, `DELIVERED`, or `COMPLETED` status cannot be directly cancelled by customers (requires Return/Refund workflow).
- **ORD-BR-07: Cancellation Side-Effects**: Cancelling an order automatically emits `order.cancelled`, releasing reserved stock in Inventory Service and initiating refund in Payment Service if previously paid.

---

## 3. Order Lifecycle State Machine

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

### State Machine Rules
- **ORD-BR-08: State `PENDING_PAYMENT`**: Initial state upon order placement; awaits payment gateway confirmation within 15 minutes.
- **ORD-BR-09: State `PAID`**: Payment verified by Payment Service; ready for seller fulfillment.
- **ORD-BR-10: State `PROCESSING`**: Seller is packing and preparing order items for carrier pickup.
- **ORD-BR-11: State `SHIPPED`**: Package handed to carrier and assigned tracking number.
- **ORD-BR-12: State `DELIVERED`**: Package confirmed delivered by carrier tracking.
- **ORD-BR-13: State `COMPLETED`**: Customer confirms order receipt or 7-day auto-completion window elapses.
- **ORD-BR-14: State `CANCELLED`**: Order cancelled prior to shipment; stock released.

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Customer | Create order from checkout payload |
| `GET` | `/api/v1/orders` | Customer / Seller / Admin | List orders (filtered by role scope) |
| `GET` | `/api/v1/orders/{id}` | Owner / Seller / Admin | Get detailed order details & item list |
| `POST` | `/api/v1/orders/{id}/cancel` | Owner / Admin | Cancel order and trigger refund/release |
| `GET` | `/api/v1/orders/{id}/timeline` | Owner / Admin | Fetch order state audit timeline |

---

## 5. Domain Events Emitted & Consumed

### Emitted Events
- **ORD-BR-15: Event `order.created`**: Emitted on creation. Triggers Inventory reservation and Notification dispatch.
- **ORD-BR-16: Event `order.paid`**: Emitted when payment succeeds. Triggers merchant notification.
- **ORD-BR-17: Event `order.shipped`**: Emitted when carrier picks up package.
- **ORD-BR-18: Event `order.delivered`**: Emitted when package is delivered.
- **ORD-BR-19: Event `order.cancelled`**: Emitted on cancellation. Triggers Inventory release & Payment refund.

### Consumed Events
- **ORD-BR-20: Consumer `payment.completed`**: Transitions order status from `PENDING_PAYMENT` to `PAID`.
- **ORD-BR-21: Consumer `payment.failed`**: Transitions order status from `PENDING_PAYMENT` to `CANCELLED`.
- **ORD-BR-22: Consumer `shipping.dispatched`**: Transitions order status from `PROCESSING` to `SHIPPED`.
