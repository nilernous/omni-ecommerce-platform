# Cart Service Business Rules

> **Service Path:** `apps/backend/cart-service/`  
> **Default Port:** `3005`  
> **Primary Storage:** Redis (`cart_store`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Cart Service** manages active shopping cart sessions for authenticated customers and guest users, supporting fast in-memory item addition, quantity updates, item removals, price validation, and cart clearing.

---

## 2. Core Business Rules & Validations

### Cart Lifetime & Persistence Rules
- **CART-BR-01: In-Memory Storage Engine**: Cart data is stored exclusively in **Redis** for sub-millisecond retrieval speeds.
- **CART-BR-02: Authenticated Cart TTL**: Customer carts persist for **30 Days (2,592,000 seconds)** from the last modification timestamp.
- **CART-BR-03: Guest Cart TTL**: Guest carts persist for **7 Days (604,800 seconds)** based on a client-generated `guestCartId` cookie.
- **CART-BR-04: Guest-to-User Cart Merging**: When a guest logs in, their guest cart items are merged into their authenticated user cart. Duplicate SKUs combine quantities up to the item quantity ceiling.

### Item Limits & Quantity Rules
- **CART-BR-05: Distinct Item Limit**: A single cart can contain a maximum of **50 distinct SKU items**. Attempting to add a 51st item returns `400 CART_LIMIT_EXCEEDED`.
- **CART-BR-06: Per-Item Quantity Ceiling**: A single cart item cannot exceed **99 units** per SKU.
- **CART-BR-07: Zero Quantity Removal**: Updating an item's quantity to `0` automatically removes the item from the cart.

### Price & Snapshot Rules
- **CART-BR-08: Transient Price Snapshots**: Prices stored in Redis are transient snapshots. Final price calculation occurs dynamically by querying Product Service / Customer BFF during checkout preview.
- **CART-BR-09: Automatic Cart Clearance**: Placing an order successfully emits `cart.cleared`, immediately wiping the user's cart in Redis.

---

## 3. Cart Structure & Keys

```text
Redis Key: `cart:{userId}` or `cart:guest:{guestCartId}`
Data Model: Hash / JSON payload containing items array, total item count, and lastUpdated timestamp.
```

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Public (Guest / User) | Retrieve active shopping cart contents |
| `POST` | `/api/v1/cart/items` | Public (Guest / User) | Add product variant to active cart |
| `PATCH` | `/api/v1/cart/items/{id}` | Public (Guest / User) | Update item quantity in cart |
| `DELETE` | `/api/v1/cart/items/{id}` | Public (Guest / User) | Remove specific item from cart |
| `DELETE` | `/api/v1/cart` | Public (Guest / User) | Clear all items from cart |
| `POST` | `/api/v1/cart/merge` | Authenticated | Merge guest cart into user cart upon login |

---

## 5. Domain Events Emitted & Consumed

### Emitted Events
- **CART-BR-10: Event `cart.item_added`**: Emitted when a user adds a product to cart. Used by Analytics Service.
- **CART-BR-11: Event `cart.cleared`**: Emitted when cart is emptied following order placement.

### Consumed Events
- **CART-BR-12: Consumer `product.updated`**: Triggers cart item price re-validation.
- **CART-BR-13: Consumer `order.placed`**: Triggers complete cart wipe for the ordering user.
