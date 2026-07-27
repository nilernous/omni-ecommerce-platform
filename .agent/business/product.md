# Product Service Business Rules

> **Service Path:** `apps/backend/product-service/`  
> **Default Port:** `3003`  
> **Primary Storage:** PostgreSQL (`product_db`) + Redis (`catalog_cache`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Product Service** is the master source of truth for product catalog data, categories, brands, product specifications, variants, SKUs, and merchant listing submission workflows.

---

## 2. Core Business Rules & Validations

### Catalog & SKU Rules
- **PRD-BR-01: Global SKU Uniqueness**: Every product variant must have a unique **Stock Keeping Unit (SKU)** string across the entire system.
- **PRD-BR-02: Product Slug Generation**: URL slugs must be unique, lowercase, hyphenated strings generated from the product title (e.g., `wireless-noise-canceling-headphones`).
- **PRD-BR-03: Base Price Constraint**: `basePrice` must be a positive numeric decimal (`> 0.00`).
- **PRD-BR-04: Sale Price Constraint**: If `salePrice` is specified, it must be strictly less than `basePrice` (`salePrice < basePrice`).
- **PRD-BR-05: Currency Standardization**: All product prices default to `USD` currency (ISO 4217 standard).
- **PRD-BR-06: Product Variant Inheritence**: Each product variant inherits parent product metadata (category, brand, title) but overrides SKU, price, dimensions, and variant media images.

### Category & Brand Governance
- **PRD-BR-07: Category Hierarchy Depth**: Category tree supports nested parent-child relationships up to a maximum of **3 levels deep** (Root → Category → Subcategory).
- **PRD-BR-08: Mandatory Brand Association**: Every published product must be linked to a valid, active Brand entity ID.

### Seller Publishing & Approval Workflow
- **PRD-BR-09: Seller Submission State**: Products created by merchant accounts (`SELLER`) default to `PENDING_APPROVAL` status.
- **PRD-BR-10: Public Search Visibility**: Only products in `ACTIVE` status appear in public catalog search results, recommendations, or customer storefronts.
- **PRD-BR-11: Draft & Pending Visibility**: Products in `DRAFT` or `PENDING_APPROVAL` status are accessible only by their owning merchant or platform administrators.
- **PRD-BR-12: Rejection Reason Documentation**: When an admin rejects a product listing (`REJECTED`), a mandatory textual rejection reason note must be provided.

---

## 3. Product Lifecycle & Status State Machine

```text
[DRAFT] ──► [PENDING_APPROVAL] ──► [ACTIVE] ──► [ARCHIVED] / [REJECTED]
```

- **DRAFT**: Seller is assembling product details.
- **PENDING_APPROVAL**: Submitted by seller, queued for admin review.
- **ACTIVE**: Approved by admin; publicly searchable and purchasable.
- **REJECTED**: Rejected by admin with required review rejection reason notes.
- **ARCHIVED**: Soft-deleted or discontinued product listing.

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | Public | List & filter active catalog products |
| `GET` | `/api/v1/products/{id}` | Public | Get product details by ID or slug |
| `POST` | `/api/v1/products` | Seller / Admin | Create new product listing |
| `PUT` | `/api/v1/products/{id}` | Seller (Owner) / Admin | Update product details |
| `DELETE` | `/api/v1/products/{id}` | Seller (Owner) / Admin | Soft-delete / Archive product |
| `GET` | `/api/v1/products/categories` | Public | Get category tree structure |
| `POST` | `/api/v1/products/categories` | Admin | Create product category |
| `POST` | `/api/v1/products/{id}/approve` | Admin | Approve/Reject seller listing |

---

## 5. Domain Events Emitted

- **PRD-BR-13: Event `product.created`**: Emitted when product is published. Triggers Search Service indexing.
- **PRD-BR-14: Event `product.updated`**: Emitted on details update. Triggers Search Service reindex and Cart Service price validation.
- **PRD-BR-15: Event `product.deleted`**: Emitted on product archiving. Triggers cache purge and search index deletion.
- **PRD-BR-16: Event `product.approved`**: Emitted when admin approves seller listing.

---

## 6. Caching & Performance Strategy
- **PRD-BR-17: Detail Cache TTL**: Individual product responses (`product:detail:{id}`) are cached in Redis with a **15-minute TTL**.
- **PRD-BR-18: Cache Invalidation**: Modifying or deleting a product immediately invalidates `product:detail:{id}` and flushes catalog search cache keys.
