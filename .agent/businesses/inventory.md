# Inventory Service Business Rules

> **Service Path:** `apps/backend/inventory-service/`  
> **Default Port:** `3004`  
> **Primary Storage:** PostgreSQL (`inventory_db`) + Redis (`stock_locks`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Inventory Service** controls real-time stock balances across warehouses, temporary stock reservations during checkout, safety stock thresholds, and stock releases upon cart expiration or order cancellation.

---

## 2. Core Business Rules & Validations

### Stock Balance Rules
- **INV-BR-01: Available Stock Equation**: `Available Quantity = Physical Quantity - Reserved Quantity`.
- **INV-BR-02: Non-Negative Stock Constraint**: `Available Quantity` must never drop below `0`. Reserving stock when `Available Quantity < requestedQuantity` returns `400 INSUFFICIENT_STOCK`.
- **INV-BR-03: Safety Stock Threshold Alert**: When `Available Quantity` drops below `safetyStockThreshold` (default: **5 units**), an `inventory.low_stock` alert event is emitted to notify merchants and warehouse managers.

### Stock Reservation Rules
- **INV-BR-04: Reservation Time-To-Live (TTL)**: Stock reserved during checkout is locked for **15 Minutes (900 seconds)**.
- **INV-BR-05: Automatic Reservation Expiration**: If the order is not paid within the 15-minute TTL window, the reservation expires automatically, decrementing `Reserved Quantity` and restoring `Available Quantity`.
- **INV-BR-06: Concurrency Locking**: Reserving stock uses **Redis Distributed Locks** (`lock:inventory:{sku}`) to prevent race conditions during high-concurrency flash sales.

### Reservation Confirmation & Deduction Rules
- **INV-BR-07: Permanent Stock Deduction**: When `payment.completed` event is received, reserved stock is permanently deducted from `Physical Quantity`, and the reservation record status transitions to `CONFIRMED`.
- **INV-BR-08: Order Cancellation Release**: When an `order.cancelled` event is received or a reservation expires, reserved units are decremented, returning units back to `Available Quantity`.

---

## 3. Stock Reservation Lifecycle

```text
[RESERVED] ──(15 min TTL)──► [EXPIRED] (Stock Released)
    │
    ├──(Payment Completed)──► [CONFIRMED] (Stock Deducted)
    │
    └──(Order Cancelled)────► [RELEASED] (Stock Released)
```

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/inventory/stock/{sku}` | Public / Internal | Get real-time stock balance for a SKU |
| `POST` | `/api/v1/inventory/reserve` | Internal (BFF / Order) | Reserve stock units for checkout |
| `POST` | `/api/v1/inventory/release` | Internal (Order / System) | Manually release a stock reservation |
| `POST` | `/api/v1/inventory/adjust` | Seller / Admin | Adjust physical warehouse stock balance |
| `GET` | `/api/v1/inventory/warehouses` | Admin | List warehouse locations & stock distribution |

---

## 5. Domain Events Emitted & Consumed

### Emitted Events
- **INV-BR-09: Event `inventory.reserved`**: Emitted when stock units are successfully reserved for an order.
- **INV-BR-10: Event `inventory.released`**: Emitted when stock reservation expires or is cancelled.
- **INV-BR-11: Event `inventory.deducted`**: Emitted when physical stock is permanently decremented upon payment.
- **INV-BR-12: Event `inventory.low_stock`**: Emitted when available quantity drops below safety stock threshold.

### Consumed Events
- **INV-BR-13: Consumer `order.created`**: Triggers stock reservation.
- **INV-BR-14: Consumer `payment.completed`**: Triggers permanent stock deduction.
- **INV-BR-15: Consumer `order.cancelled`**: Triggers immediate stock release.

---

## 6. High-Concurrency Resilience
- **INV-BR-16: Atomic Database Updates**: Stock updates execute via atomic SQL statements (`UPDATE inventory SET reserved = reserved + N WHERE available >= N`).
- **INV-BR-17: Distributed Lock Expiration**: Redis lock key `lock:inventory:{sku}` carries a **5-second TTL** to prevent lock deadlocks if a container crashes.
