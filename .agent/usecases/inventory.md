# Inventory Service Business Rules & Use Cases

> **Service Path:** `apps/backend/inventory-service/`  
> **Default Port:** `3004`  
> **Business Rules Reference:** [inventory.md](../business/inventory.md)  

---

### INV-UC-01: Query SKU Stock Balance

- **Primary Actor**: Public / Internal Microservices
- **Preconditions**: Target SKU exists in Inventory database.
- **Trigger**: Client sends `GET /api/v1/inventory/stock/{sku}`.
- **Main Success Scenario**:
  1. Inventory Service queries `inventory_db` for physical and reserved stock balances.
  2. Service computes `Available Quantity = Physical Quantity - Reserved Quantity` (`INV-BR-01`).
  3. Service returns `200 OK` with available stock count and safety stock status.
- **Business Rules Referenced**: `INV-BR-01`, `INV-BR-02`.
- **Postconditions**: Stock balance returned.

---

### INV-UC-02: Reserve Stock Units for Checkout

- **Primary Actor**: Order Service / Customer BFF (Internal)
- **Preconditions**: Order items specified with SKU and requested quantities.
- **Trigger**: System sends `POST /api/v1/inventory/reserve` with orderId, items array `[{sku, quantity}]`.
- **Main Success Scenario**:
  1. Inventory Service acquires Redis distributed locks `lock:inventory:{sku}` for requested SKUs (`INV-BR-06`).
  2. Service verifies `Available Quantity >= requestedQuantity` for all items (`INV-BR-02`).
  3. Service increments `Reserved Quantity` for each SKU in `inventory_db`.
  4. Service inserts stock reservation records with a **15-minute TTL** (`INV-BR-04`).
  5. Service releases Redis distributed locks.
  6. Service emits `inventory.reserved` event and returns `200 OK`.
- **Alternative / Exception Flows**:
  - *Insufficient Stock*: Service releases locks, reverts partial reservations, and returns `400 BAD_REQUEST` with `INSUFFICIENT_STOCK`.
- **Business Rules Referenced**: `INV-BR-01`, `INV-BR-02`, `INV-BR-04`, `INV-BR-06`, `INV-BR-09`, `INV-BR-13`, `INV-BR-16`, `INV-BR-17`.
- **Postconditions**: Stock reserved in DB for 15 minutes, event `inventory.reserved` emitted.

---

### INV-UC-03: Confirm Permanent Stock Deduction (Payment Success)

- **Primary Actor**: Payment Service / Order Service (Event Consumer)
- **Preconditions**: Payment succeeded for order; stock is in `RESERVED` state.
- **Trigger**: AMQP Event `payment.completed` received by Inventory Service.
- **Main Success Scenario**:
  1. Inventory Service extracts `orderId` from event payload.
  2. Service fetches active reservation records for `orderId`.
  3. Service atomically decrements `Physical Quantity` and `Reserved Quantity` in `inventory_db` (`INV-BR-07`).
  4. Service updates reservation record status to `CONFIRMED`.
  5. Service checks if updated `Available Quantity < safetyStockThreshold` (5 units) and emits `inventory.low_stock` if triggered (`INV-BR-03`).
  6. Service emits `inventory.deducted` event.
- **Business Rules Referenced**: `INV-BR-03`, `INV-BR-07`, `INV-BR-11`, `INV-BR-12`, `INV-BR-14`.
- **Postconditions**: Physical stock decremented, reservation confirmed.

---

### INV-UC-04: Release Expired / Cancelled Stock Reservation

- **Primary Actor**: System Timer Worker / Order Service
- **Preconditions**: Stock reservation 15-minute TTL elapses OR order is cancelled.
- **Trigger**: Reservation TTL timer worker fires OR AMQP event `order.cancelled` received.
- **Main Success Scenario**:
  1. Inventory Service fetches active reservation for `orderId` or expired reservation ID.
  2. Service decrements `Reserved Quantity` in `inventory_db`, restoring units to `Available Quantity` (`INV-BR-05`, `INV-BR-08`).
  3. Service updates reservation record status to `RELEASED` or `EXPIRED`.
  4. Service emits `inventory.released` event.
- **Business Rules Referenced**: `INV-BR-05`, `INV-BR-08`, `INV-BR-10`, `INV-BR-15`.
- **Postconditions**: Reserved stock released back to available inventory pool.

---

### INV-UC-05: Warehouse Stock Adjustment (Merchant / Admin)

- **Primary Actor**: Seller / Warehouse Admin
- **Preconditions**: Requester authorized for target SKU.
- **Trigger**: Client sends `POST /api/v1/inventory/adjust` with `sku`, `warehouseId`, `adjustmentQuantity`, `reason`.
- **Main Success Scenario**:
  1. Inventory Service validates SKU and warehouse existence.
  2. Service updates physical stock balance in `inventory_db`.
  3. Service logs stock adjustment audit record.
  4. Service returns `200 OK` with updated stock balance.
- **Business Rules Referenced**: `INV-BR-01`, `INV-BR-02`.
- **Postconditions**: Physical stock updated in DB, audit entry created.

---

### INV-UC-06: Low Stock Safety Threshold Alert

- **Primary Actor**: System Event Handler
- **Preconditions**: Available stock drops below `safetyStockThreshold` (5 units) after deduction or manual adjustment.
- **Trigger**: Internal stock deduction logic evaluates `Available Quantity < 5`.
- **Main Success Scenario**:
  1. Inventory Service constructs `inventory.low_stock` event payload (`sku`, `availableQuantity`, `warehouseId`).
  2. Service publishes event to RabbitMQ topic exchange (`omni.events.topic`).
  3. Notification Service consumes event and sends low-stock alert email to merchant/admin.
- **Business Rules Referenced**: `INV-BR-03`, `INV-BR-12`.
- **Postconditions**: Event `inventory.low_stock` published to message broker.
