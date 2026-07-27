# Product Service Use Cases

> **Service Path:** `apps/backend/product-service/`  
> **Default Port:** `3003`  
> **Business Rules Reference:** [product.md](../business/product.md)  

---

### PRD-UC-01: Browse & Filter Product Catalog

- **Primary Actor**: Anonymous / Authenticated Customer
- **Preconditions**: Products exist in `ACTIVE` status.
- **Trigger**: Client sends `GET /api/v1/products` with query filters (category, brand, price range, page, limit).
- **Main Success Scenario**:
  1. Product Service queries Redis cache for list parameters.
  2. On cache miss, Service queries `product_db` filtering for `status: ACTIVE`.
  3. Service formats items and paginated metadata envelope (`PRD-BR-05`).
  4. Service returns `200 OK` with product items list.
- **Business Rules Referenced**: `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-05`, `PRD-BR-10`.
- **Postconditions**: Product catalog collection returned.

---

### PRD-UC-02: View Product Detail

- **Primary Actor**: Customer / Public
- **Preconditions**: Product exists in DB.
- **Trigger**: Client sends `GET /api/v1/products/{id_or_slug}`.
- **Main Success Scenario**:
  1. Product Service checks Redis cache key `product:detail:{id}`.
  2. On cache miss, Service fetches product, variants, SKUs, category, and brand details from `product_db`.
  3. Service caches detail object in Redis with 15-minute TTL.
  4. Service returns `200 OK` with full product detail payload.
- **Alternative / Exception Flows**:
  - *Product Inactive/Draft*: Returns `404 NOT_FOUND` to public users unless requester is owner seller or admin.
- **Business Rules Referenced**: `PRD-BR-01`, `PRD-BR-02`, `PRD-BR-06`, `PRD-BR-10`, `PRD-BR-11`, `PRD-BR-17`.
- **Postconditions**: Product detail payload returned and cached in Redis.

---

### PRD-UC-03: Create Product Listing (Seller)

- **Primary Actor**: Authenticated Seller
- **Preconditions**: Seller has an active merchant account.
- **Trigger**: Client sends `POST /api/v1/products` with product title, description, basePrice, SKUs, categoryId, brandId, variants.
- **Main Success Scenario**:
  1. Product Service validates SKU uniqueness across variants (`PRD-BR-01`).
  2. Service validates `basePrice > 0.00` and `salePrice < basePrice` if provided.
  3. Service auto-generates URL slug from product title.
  4. Service inserts master product record with `status: PENDING_APPROVAL`.
  5. Service inserts variant records linked to master product in `product_db`.
  6. Service emits `product.created` event and returns `201 CREATED`.
- **Alternative / Exception Flows**:
  - *Duplicate SKU*: Returns `400 BAD_REQUEST` with error `DUPLICATE_SKU`.
  - *Invalid Price*: Returns `400 BAD_REQUEST` with validation details.
- **Business Rules Referenced**: `PRD-BR-01`, `PRD-BR-02`, `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-08`, `PRD-BR-09`, `PRD-BR-13`.
- **Postconditions**: Product created in `PENDING_APPROVAL` status, event emitted.

---

### PRD-UC-04: Update Product Specification

- **Primary Actor**: Merchant Owner / Admin
- **Preconditions**: Product exists; requester owns product or is admin.
- **Trigger**: Client sends `PUT /api/v1/products/{id}` with updated fields.
- **Main Success Scenario**:
  1. Product Service verifies product ownership.
  2. Service validates pricing and SKU rules.
  3. Service updates product and variant records in `product_db`.
  4. Service invalidates Redis cache key `product:detail:{id}`.
  5. Service emits `product.updated` event (triggering Search reindex & Cart price check).
  6. Service returns `200 OK`.
- **Business Rules Referenced**: `PRD-BR-01`, `PRD-BR-03`, `PRD-BR-04`, `PRD-BR-14`, `PRD-BR-18`.
- **Postconditions**: Product updated in DB, Redis cache invalidated, `product.updated` event emitted.

---

### PRD-UC-05: Approve / Reject Seller Product Listing (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Product is in `PENDING_APPROVAL` status.
- **Trigger**: Admin sends `POST /api/v1/products/{id}/approve` with `action: APPROVED` or `action: REJECTED` + `rejectionReason`.
- **Main Success Scenario (Approve)**:
  1. Product Service validates admin role.
  2. Service updates product status to `ACTIVE`.
  3. Service emits `product.approved` and `product.created` events.
  4. Service returns `200 OK`.
- **Main Success Scenario (Reject)**:
  1. Service validates `rejectionReason` is provided (`PRD-BR-12`).
  2. Service updates product status to `REJECTED` and saves review notes.
  3. Service returns `200 OK`.
- **Business Rules Referenced**: `PRD-BR-09`, `PRD-BR-10`, `PRD-BR-12`, `PRD-BR-16`.
- **Postconditions**: Product status updated in DB, events emitted for search indexing.

---

### PRD-UC-06: Archive Product Listing

- **Primary Actor**: Merchant Owner / Admin
- **Preconditions**: Product exists in DB.
- **Trigger**: Client sends `DELETE /api/v1/products/{id}`.
- **Main Success Scenario**:
  1. Product Service updates product status to `ARCHIVED` (soft delete).
  2. Service invalidates Redis cache key `product:detail:{id}`.
  3. Service emits `product.deleted` event (triggering Search index deletion).
  4. Service returns `200 OK`.
- **Business Rules Referenced**: `PRD-BR-15`, `PRD-BR-18`.
- **Postconditions**: Product status marked `ARCHIVED`, search index document removed.

---

### PRD-UC-07: Create Product Category Hierarchy (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Admin authenticated.
- **Trigger**: Client sends `POST /api/v1/products/categories` with category name and optional `parentId`.
- **Main Success Scenario**:
  1. Product Service checks category depth hierarchy (`<= 3 levels deep`).
  2. Service inserts category record in `product_db`.
  3. Service returns `201 CREATED`.
- **Alternative / Exception Flows**:
  - *Depth > 3 Levels*: Returns `400 BAD_REQUEST` with error `MAX_CATEGORY_DEPTH_EXCEEDED`.
- **Business Rules Referenced**: `PRD-BR-07`.
- **Postconditions**: Category created in DB.
