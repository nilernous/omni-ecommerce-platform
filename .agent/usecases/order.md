# Order Service Use Cases

> **Service Path:** `apps/backend/order-service/`  
> **Default Port:** `3006`  
> **Business Rules Reference:** [order.md](../business/order.md)  

---

### ORD-UC-01: Create Order from Checkout Cart

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
  8. Service commits order and order item records to `order_db` with `status: PENDING_PAYMENT`.
  9. Service emits `order.created` event and returns `201 CREATED` with order summary.
- **Alternative / Exception Flows**:
  - *Inventory Reservation Fails*: System aborts order creation, returns `400 BAD_REQUEST` with `INSUFFICIENT_STOCK`.
  - *Invalid Idempotency Key*: Returns cached previous order response.
- **Business Rules Referenced**: `ORD-BR-01`, `ORD-BR-02`, `ORD-BR-03`, `ORD-BR-04`, `ORD-BR-08`, `ORD-BR-15`.
- **Postconditions**: Order created in `PENDING_PAYMENT` status, stock reserved, event `order.created` emitted.

---

### ORD-UC-02: View Customer Order History

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

---

### ORD-UC-03: View Order Details & Tracking Timeline

- **Primary Actor**: Customer (Owner) / Merchant / Admin
- **Preconditions**: Order exists.
- **Trigger**: Client sends `GET /api/v1/orders/{id}` or `GET /api/v1/orders/{id}/timeline`.
- **Main Success Scenario**:
  1. Order Service verifies resource ownership or admin/seller role.
  2. Service queries `order_db` for master order record, item list, payment status, shipping tracking number, and audit timeline logs.
  3. Service returns `200 OK` with detailed order payload.
- **Business Rules Referenced**: `ORD-BR-01`, `ORD-BR-08` through `ORD-BR-14`.
- **Postconditions**: Order detail payload returned.

---

### ORD-UC-04: Cancel Pending / Unshipped Order

- **Primary Actor**: Customer (Owner) / Admin
- **Preconditions**: Order is in `PENDING_PAYMENT` or `PAID` status (`ORD-BR-05`).
- **Trigger**: Client sends `POST /api/v1/orders/{id}/cancel` with cancellation reason.
- **Main Success Scenario**:
  1. Order Service verifies order status is `PENDING_PAYMENT` or `PAID`.
  2. Service updates order status to `CANCELLED` in `order_db`.
  3. Service appends audit entry to order timeline.
  4. Service emits `order.cancelled` event (`ORD-BR-07`, `ORD-BR-19`).
  5. Inventory Service consumes event and releases reserved stock (`INV-UC-04`).
  6. Payment Service consumes event and processes refund if previously paid (`PAY-UC-04`).
  7. Service returns `200 OK`.
- **Alternative / Exception Flows**:
  - *Order Already Shipped (`SHIPPED` / `DELIVERED`)*: Returns `400 BAD_REQUEST` with error `ORDER_CANNOT_BE_CANCELLED`.
- **Business Rules Referenced**: `ORD-BR-05`, `ORD-BR-06`, `ORD-BR-07`, `ORD-BR-14`, `ORD-BR-19`.
- **Postconditions**: Order status marked `CANCELLED`, event `order.cancelled` emitted.

---

### ORD-UC-05: Process Payment Completion (Order Paid)

- **Primary Actor**: Payment Service (Event Consumer)
- **Preconditions**: Payment gateway confirmed transaction capture.
- **Trigger**: AMQP Event `payment.completed` received by Order Service.
- **Main Success Scenario**:
  1. Order Service fetches order by `orderId`.
  2. Service updates order status from `PENDING_PAYMENT` to `PAID` in `order_db`.
  3. Service appends timeline audit entry `Payment confirmed via Stripe/PayPal`.
  4. Service emits `order.paid` event (`ORD-BR-16`).
  5. Service notifies merchant to begin shipping fulfillment (`PROCESSING`).
- **Business Rules Referenced**: `ORD-BR-09`, `ORD-BR-16`, `ORD-BR-20`.
- **Postconditions**: Order status updated to `PAID`, `order.paid` event emitted.

---

### ORD-UC-06: Transition Order to Shipped

- **Primary Actor**: Shipping Service (Event Consumer) / Merchant
- **Preconditions**: Shipping label generated and package picked up by carrier.
- **Trigger**: AMQP Event `shipping.dispatched` received by Order Service.
- **Main Success Scenario**:
  1. Order Service updates order status to `SHIPPED` in `order_db`.
  2. Service attaches carrier name and tracking number to order record.
  3. Service emits `order.shipped` event (`ORD-BR-17`).
  4. Notification Service sends tracking email/SMS to customer.
- **Business Rules Referenced**: `ORD-BR-11`, `ORD-BR-17`, `ORD-BR-22`.
- **Postconditions**: Order status updated to `SHIPPED`.

---

### ORD-UC-07: Transition Order to Delivered & Auto-Completion

- **Primary Actor**: Shipping Service / System Timer Worker
- **Preconditions**: Carrier confirms package delivery.
- **Trigger**: AMQP Event `shipping.delivered` received OR 7-day return window elapses.
- **Main Success Scenario**:
  1. Order Service updates order status to `DELIVERED`.
  2. Service starts 7-day auto-completion timer countdown.
  3. Upon customer confirmation OR timer expiration after 7 days, Service updates status to `COMPLETED` (`ORD-BR-13`).
  4. Service emits `order.completed` event, triggering seller earnings payout calculation.
- **Business Rules Referenced**: `ORD-BR-12`, `ORD-BR-13`, `ORD-BR-18`.
- **Postconditions**: Order status marked `COMPLETED`, seller funds unlocked.
