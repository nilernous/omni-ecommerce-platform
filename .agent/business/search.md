# Search Service Business Rules

> **Service Path:** `apps/backend/search-service/`  
> **Default Port:** `3012`  
> **Primary Storage:** Elasticsearch (`products_index`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Search Service** powers high-performance full-text product search, auto-complete query suggestions, faceted category/brand filtering, price range aggregations, and Elasticsearch catalog index synchronization.

---

## 2. Core Business Rules & Validations

### Search & Indexing Rules
- **SRCH-BR-01: Index Document Target**: Indexes active product documents into the `products_index` Elasticsearch cluster.
- **SRCH-BR-02: Relevance Weight Boosting**:
  - Product Title: Boosted **3x**.
  - Category Name: Boosted **2x**.
  - Brand Name: Boosted **2x**.
  - Description, Tags, SKU: Weight **1x**.
- **SRCH-BR-03: Multi-Facet Aggregation**: Enables simultaneous filtering by `categoryId`, `brandId`, `minPrice`, `maxPrice`, `rating`, and `inStock`.
- **SRCH-BR-04: Auto-Complete Threshold**: Returns top 5 suggested keywords when query string length is `>= 2 characters`.

### Synchronization Rules
- **SRCH-BR-05: Event-Driven Sync Ingestion**: Listens to AMQP events from Product Service (`product.created`, `product.updated`, `product.deleted`).
- **SRCH-BR-06: Sync Latency SLA**: Catalog changes in Product Service must sync to the Elasticsearch index within an eventual consistency SLA of **2 Seconds**.
- **SRCH-BR-07: Admin Reindex Execution**: Admin reindex endpoint triggers an asynchronous background job processing `product_db` into Elasticsearch using bulk batches of 500 documents.

---

## 3. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/search/products` | Public | Full-text product search with facets & pagination |
| `GET` | `/api/v1/search/suggestions`| Public | Auto-complete query suggestion list |
| `POST` | `/api/v1/search/reindex` | Admin | Trigger full Elasticsearch catalog reindex |

---

## 4. Domain Events Consumed

- **SRCH-BR-08: Consumer `product.created`**: Inserts new product document into Elasticsearch index.
- **SRCH-BR-09: Consumer `product.updated`**: Updates existing product index document attributes.
- **SRCH-BR-10: Consumer `product.deleted`**: Removes product document from Elasticsearch index.
- **SRCH-BR-11: Consumer `inventory.updated`**: Updates `inStock` boolean status in search index.
