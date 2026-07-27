# Payment Service Use Cases

> **Service Path:** `apps/backend/payment-service/`  
> **Default Port:** `3007`  
> **Business Rules Reference:** [payment.md](../business/payment.md)  

---

### PAY-UC-01: Initiate Payment Charge for Order

- **Primary Actor**: Customer / Checkout Flow
- **Preconditions**: Order created in `PENDING_PAYMENT` status.
- **Trigger**: Client sends `POST /api/v1/payments/process` with orderId, paymentMethod, tokenized payment token (`pm_...`).
- **Main Success Scenario**:
  1. Payment Service verifies `Idempotency-Key` header (`PAY-BR-04`).
  2. Service checks order total and currency against Order Service (`PAY-BR-03`).
  3. Service initializes immutable transaction record in `payment_db` with status `INITIATED` (`PAY-BR-02`, `PAY-BR-11`).
  4. Service calls external payment gateway API (Stripe/PayPal) using tokenized payment token (`PAY-BR-06`).
  5. Upon gateway authorization & capture success, Service updates transaction status to `COMPLETED` (`PAY-BR-13`).
  6. Service emits `payment.completed` event and returns `200 OK` with transaction receipt.
- **Alternative / Exception Flows**:
  - *Card Declined / Insufficient Funds*: Gateway returns error; Service sets status `FAILED`, emits `payment.failed`, and returns `400 BAD_REQUEST`.
- **Business Rules Referenced**: `PAY-BR-01`, `PAY-BR-02`, `PAY-BR-03`, `PAY-BR-04`, `PAY-BR-06`, `PAY-BR-11`, `PAY-BR-13`, `PAY-BR-16`.
- **Postconditions**: Transaction saved as `COMPLETED` in DB, event `payment.completed` emitted.

---

### PAY-UC-02: Verify Gateway Webhook Callback

- **Primary Actor**: Third-Party Gateway (Stripe / PayPal)
- **Preconditions**: Asynchronous payment event occurred on gateway infrastructure.
- **Trigger**: Gateway POSTs to `/api/v1/payments/verify` with payload & signature headers (`Stripe-Signature`).
- **Main Success Scenario**:
  1. Payment Service extracts webhook signature header.
  2. Service computes HMAC signature using stored webhook secret key and verifies match (`PAY-BR-05`).
  3. Service checks for duplicate event processing (idempotency check).
  4. Service updates internal transaction record in `payment_db`.
  5. Service emits corresponding domain event (`payment.completed` or `payment.failed`).
  6. Service returns `200 OK` to gateway.
- **Alternative / Exception Flows**:
  - *Signature Verification Fails*: Returns `400 BAD_REQUEST` / `401 UNAUTHORIZED` and rejects payload.
- **Business Rules Referenced**: `PAY-BR-02`, `PAY-BR-05`, `PAY-BR-16`, `PAY-BR-17`.
- **Postconditions**: Webhook validated, transaction status updated, event emitted.

---

### PAY-UC-03: Process Full or Partial Order Refund

- **Primary Actor**: Platform Admin / Order Cancellation Event
- **Preconditions**: Target transaction exists in `COMPLETED` status; order is `PAID` or `CANCELLED`.
- **Trigger**: Admin sends `POST /api/v1/payments/refunds` OR AMQP Event `order.cancelled` received.
- **Main Success Scenario**:
  1. Payment Service verifies target order state (`PAID`, `CANCELLED`, `RETURNED`) (`PAY-BR-07`).
  2. Service calculates requested refund amount:
     - For full refund: `amount == totalPaidAmount` (`PAY-BR-08`).
     - For partial refund: `amount <= totalPaidAmount - previousRefunds` (`PAY-BR-09`).
  3. Service calls gateway refund API with original transaction ID.
  4. Upon gateway confirmation, Service creates immutable refund record in `payment_db`.
  5. Service updates transaction status to `REFUNDED` or `PARTIALLY_REFUNDED`.
  6. Service emits `payment.refunded` event and returns `200 OK`.
- **Alternative / Exception Flows**:
  - *Refund Amount Exceeds Paid Total*: Returns `400 BAD_REQUEST` with error `INVALID_REFUND_AMOUNT`.
- **Business Rules Referenced**: `PAY-BR-07`, `PAY-BR-08`, `PAY-BR-09`, `PAY-BR-10`, `PAY-BR-15`, `PAY-BR-18`, `PAY-BR-20`.
- **Postconditions**: Refund processed via gateway, transaction status updated, event emitted.

---

### PAY-UC-04: Handle Payment Charge Failure

- **Primary Actor**: Payment Gateway / System
- **Preconditions**: Payment charge attempt failed during processing.
- **Trigger**: Gateway returns decline code or timeout occurs.
- **Main Success Scenario**:
  1. Payment Service updates transaction status to `FAILED` in `payment_db` (`PAY-BR-14`).
  2. Service logs failure reason (e.g. `INSUFFICIENT_FUNDS`, `EXPIRED_CARD`).
  3. Service emits `payment.failed` event.
  4. Order Service consumes event and transitions order to `CANCELLED` (`ORD-UC-04`).
  5. Inventory Service consumes event and releases stock reservation (`INV-UC-04`).
- **Business Rules Referenced**: `PAY-BR-14`, `PAY-BR-17`.
- **Postconditions**: Payment marked `FAILED`, downstream cancellation events triggered.
