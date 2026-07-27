# Cart Service Use Cases

> **Service Path:** `apps/backend/cart-service/`  
> **Default Port:** `3005`  
> **Business Rules Reference:** [cart.md](../business/cart.md)  

---

### CART-UC-01: View Active Shopping Cart

- **Primary Actor**: Customer / Guest User
- **Preconditions**: User possesses a valid session JWT OR a `guestCartId` cookie.
- **Trigger**: Client sends `GET /api/v1/cart`.
- **Main Success Scenario**:
  1. Cart Service identifies target key `cart:{userId}` or `cart:guest:{guestCartId}` in Redis.
  2. Service fetches cart hash payload from Redis.
  3. If cart exists, Service returns `200 OK` with items array, quantities, transient prices, and total item count.
  4. If cart does not exist, Service returns `200 OK` with an empty cart object.
- **Business Rules Referenced**: `CART-BR-01`, `CART-BR-02`, `CART-BR-03`, `CART-BR-08`.
- **Postconditions**: Cart object returned.

---

### CART-UC-02: Add Product Variant to Cart

- **Primary Actor**: Customer / Guest User
- **Preconditions**: Product variant SKU exists.
- **Trigger**: Client sends `POST /api/v1/cart/items` with `sku`, `quantity` (default: 1).
- **Main Success Scenario**:
  1. Cart Service fetches target cart key from Redis.
  2. Service checks current distinct items count (`<= 50 distinct items`, `CART-BR-05`).
  3. If SKU already exists in cart, Service adds new quantity to existing quantity, ensuring total `quantity <= 99` (`CART-BR-06`).
  4. If SKU is new, Service adds item to items array.
  5. Service updates Redis cart payload and resets TTL (30d for Auth / 7d for Guest).
  6. Service emits `cart.item_added` event and returns `200 OK` with updated cart.
- **Alternative / Exception Flows**:
  - *Cart Limit Exceeded (> 50 items)*: Returns `400 BAD_REQUEST` with `CART_LIMIT_EXCEEDED`.
  - *Item Quantity > 99*: Caps quantity at 99 or returns `400 BAD_REQUEST`.
- **Business Rules Referenced**: `CART-BR-01`, `CART-BR-02`, `CART-BR-03`, `CART-BR-05`, `CART-BR-06`, `CART-BR-10`.
- **Postconditions**: Item added to Redis cart, cart TTL refreshed.

---

### CART-UC-03: Update Cart Item Quantity

- **Primary Actor**: Customer / Guest User
- **Preconditions**: Cart exists in Redis and contains target SKU item.
- **Trigger**: Client sends `PATCH /api/v1/cart/items/{sku}` with new `quantity`.
- **Main Success Scenario**:
  1. Cart Service fetches cart from Redis.
  2. If new `quantity == 0`, Service removes item from cart (`CART-BR-07`).
  3. If `0 < quantity <= 99`, Service updates item quantity.
  4. Service persists updated cart in Redis and resets TTL.
  5. Service returns `200 OK` with updated cart.
- **Business Rules Referenced**: `CART-BR-06`, `CART-BR-07`.
- **Postconditions**: Item quantity updated or removed from cart in Redis.

---

### CART-UC-04: Remove Item from Cart

- **Primary Actor**: Customer / Guest User
- **Preconditions**: Cart contains target SKU item.
- **Trigger**: Client sends `DELETE /api/v1/cart/items/{sku}`.
- **Main Success Scenario**:
  1. Cart Service fetches cart from Redis.
  2. Service removes matching SKU item from cart array.
  3. Service saves updated cart to Redis and returns `200 OK`.
- **Business Rules Referenced**: `CART-BR-07`.
- **Postconditions**: Item removed from Redis cart.

---

### CART-UC-05: Merge Guest Cart Upon User Login

- **Primary Actor**: Newly Authenticated Customer
- **Preconditions**: User logged in; guest cart cookie `guestCartId` exists.
- **Trigger**: Client sends `POST /api/v1/cart/merge` with `guestCartId`.
- **Main Success Scenario**:
  1. Cart Service fetches guest cart `cart:guest:{guestCartId}` from Redis.
  2. Service fetches user cart `cart:{userId}` from Redis.
  3. Service merges guest items into user cart array, combining quantities for duplicate SKUs up to 99 units.
  4. Service ensures combined distinct item count does not exceed 50 items (`CART-BR-05`).
  5. Service saves merged cart to `cart:{userId}` with 30-day TTL.
  6. Service deletes `cart:guest:{guestCartId}` key from Redis.
  7. Service returns `200 OK` with merged cart payload.
- **Business Rules Referenced**: `CART-BR-02`, `CART-BR-04`, `CART-BR-05`, `CART-BR-06`.
- **Postconditions**: Guest cart merged into authenticated user cart, guest key deleted.

---

### CART-UC-06: Clear Cart Upon Order Placement

- **Primary Actor**: System Event Handler / Order Service
- **Preconditions**: Order placed successfully by customer.
- **Trigger**: AMQP Event `order.placed` or `cart.cleared` emitted.
- **Main Success Scenario**:
  1. Cart Service extracts `userId` from event payload.
  2. Service deletes Redis key `cart:{userId}`.
  3. Service emits `cart.cleared` event.
- **Business Rules Referenced**: `CART-BR-09`, `CART-BR-11`, `CART-BR-13`.
- **Postconditions**: User cart key deleted from Redis.
