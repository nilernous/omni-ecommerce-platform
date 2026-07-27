# Payment Service Business Rules

> **Service Path:** `apps/backend/payment-service/`  
> **Default Port:** `3007`  
> **Primary Storage:** PostgreSQL (`payment_db`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Payment Service** handles payment processing, third-party payment gateway integrations (Stripe, PayPal, Local Gateways), transaction logging, webhook signature verification, and full/partial refund execution.

---

## 2. Core Business Rules & Validations

### Payment Processing Rules
- **PAY-BR-01: Supported Payment Gateways**: Stripe, PayPal, Cash on Delivery (COD), Local Bank Transfer.
- **PAY-BR-02: Ledger Immutability**: Payment transaction records are immutable ledger entries. Transaction statuses update strictly via validated state transitions.
- **PAY-BR-03: Currency Matching**: Charge amount and currency must strictly match the Order total and currency specified by Order Service.
- **PAY-BR-04: Idempotent Payment Charge**: Payment charge requests require an `Idempotency-Key` to prevent duplicate credit card charges on retries.

### Webhook & Security Rules
- **PAY-BR-05: Webhook Signature Verification**: Inbound payment gateway webhooks (e.g. Stripe Webhooks) MUST verify cryptographic payload signatures before processing events.
- **PAY-BR-06: PCI-DSS Compliance**: Credit card PANs, CVVs, and expiry dates are NEVER received, logged, or stored by OmniCommerce backend services. Processing relies on tokenized payment tokens (`tok_...`, `pm_...`).

### Refund Rules
- **PAY-BR-07: Refund State Prerequisite**: Refunds are permitted only for orders in `PAID`, `CANCELLED`, or `RETURNED` states.
- **PAY-BR-08: Full Refund Calculation**: `Full Refund Amount = Total Paid Amount`.
- **PAY-BR-09: Partial Refund Constraint**: `Partial Refund Amount <= Total Paid Amount - Previous Refunds`.
- **PAY-BR-10: Gateway Refund SLA**: Electronic refunds are dispatched to the originating gateway transaction ID within 24 hours of approval.

---

## 3. Transaction State Machine

```text
[INITIATED] ──► [AUTHORIZED] ──► [CAPTURED / COMPLETED] ──► [REFUNDED] / [PARTIALLY_REFUNDED]
     │
     └──(Gateway Failure)──► [FAILED]
```

- **PAY-BR-11: Transaction `INITIATED`**: Payment intent created with gateway provider.
- **PAY-BR-12: Transaction `AUTHORIZED`**: Funds authorized / held on customer payment method.
- **PAY-BR-13: Transaction `COMPLETED`**: Payment successfully captured into merchant account.
- **PAY-BR-14: Transaction `FAILED`**: Gateway declined transaction (insufficient funds, fraud, expired card).
- **PAY-BR-15: Transaction `REFUNDED`**: Funds returned to customer payment source.

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/process` | Customer (via Checkout) | Initiate payment charge for order |
| `POST` | `/api/v1/payments/verify` | Public (Gateway Webhook) | Webhook callback verification endpoint |
| `GET` | `/api/v1/payments/transactions/{id}`| Owner / Admin | Retrieve payment transaction receipt |
| `POST` | `/api/v1/payments/refunds` | Admin | Issue full or partial payment refund |

---

## 5. Domain Events Emitted & Consumed

### Emitted Events
- **PAY-BR-16: Event `payment.completed`**: Emitted when payment capture is confirmed. Triggers Order Service status update and Inventory stock deduction.
- **PAY-BR-17: Event `payment.failed`**: Emitted when payment is declined. Triggers Order Service cancellation.
- **PAY-BR-18: Event `payment.refunded`**: Emitted when refund is successfully processed by gateway.

### Consumed Events
- **PAY-BR-19: Consumer `order.created`**: Initializes payment transaction record.
- **PAY-BR-20: Consumer `order.cancelled`**: Triggers automated refund workflow if order was previously paid.
