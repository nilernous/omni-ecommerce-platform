# Search Service Use Cases

> **Service Path:** `apps/backend/search-service/`  
> **Default Port:** `3012`  
> **Business Rules Reference:** [search.md](../business/search.md)  

---

### SRCH-UC-01: Full-Text Product Search & Faceted Filter

- **Primary Actor**: Customer / Public User
- **Preconditions**: Product documents indexed in Elasticsearch `products_index`.
- **Trigger**: Client sends `GET /api/v1/search/products` with query `q`, `categoryId`, `brandId`, `minPrice`, `maxPrice`, `rating`, `page`, `limit`.
- **Main Success Scenario**:
  1. Search Service constructs Elasticsearch multi-match search query targeting `products_index`.
  2. Service applies field weight boosting: Title (3x), Category (2x), Brand (2x) (`SRCH-BR-02`).
  3. Service applies exact filters (`categoryId`, `brandId`, `minPrice`, `maxPrice`, `rating`, `inStock: true`) (`SRCH-BR-03`).
  4. Service retrieves matching product documents and aggregation facets breakdown from Elasticsearch.
  5. Service returns `200 OK` with paginated search results and facet options (categories, brands, price ranges).
- **Business Rules Referenced**: `SRCH-BR-01`, `SRCH-BR-02`, `SRCH-BR-03`.
- **Postconditions**: Search results and category/brand/price facets returned.

---

### SRCH-UC-02: Auto-Complete Search Suggestions

- **Primary Actor**: Customer / Web & Mobile Search Bar
- **Preconditions**: User typing query string in search bar.
- **Trigger**: Client sends `GET /api/v1/search/suggestions` with `q` (query prefix).
- **Main Success Scenario**:
  1. Search Service verifies query prefix string length `q.length >= 2` (`SRCH-BR-04`).
  2. Service executes edge n-gram suggestion query against Elasticsearch `products_index`.
  3. Service fetches top 5 matching product title keywords and category names.
  4. Service returns `200 OK` with auto-complete suggestions array.
- **Alternative / Exception Flows**:
  - *Query Length < 2*: Returns `200 OK` with an empty array.
- **Business Rules Referenced**: `SRCH-BR-04`.
- **Postconditions**: Up to 5 auto-complete keyword suggestions returned.

---

### SRCH-UC-03: Event-Driven Elasticsearch Index Sync

- **Primary Actor**: Product Service / Inventory Service (AMQP Event Producers)
- **Preconditions**: State change occurred in catalog or inventory.
- **Trigger**: AMQP Event received (`product.created`, `product.updated`, `product.deleted`, `inventory.updated`).
- **Main Success Scenario**:
  1. Search Service parses domain event payload.
  2. If `product.created` or `product.updated`: Service transforms product details into Elasticsearch document format and upserts document in `products_index` (`SRCH-BR-05`, `SRCH-BR-08`, `SRCH-BR-09`).
  3. If `product.deleted`: Service deletes corresponding document ID from `products_index` (`SRCH-BR-10`).
  4. If `inventory.updated`: Service updates `inStock` boolean flag in Elasticsearch document (`SRCH-BR-11`).
  5. Index sync completes within the 2-second eventual consistency SLA (`SRCH-BR-06`).
- **Business Rules Referenced**: `SRCH-BR-05`, `SRCH-BR-06`, `SRCH-BR-08`, `SRCH-BR-09`, `SRCH-BR-10`, `SRCH-BR-11`.
- **Postconditions**: Elasticsearch index document synchronized with PostgreSQL database.

---

### SRCH-UC-04: Full Catalog Bulk Reindex (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Requester possesses `ADMIN` role.
- **Trigger**: Admin sends `POST /api/v1/search/reindex`.
- **Main Success Scenario**:
  1. Search Service verifies admin role.
  2. Service creates temporary new index `products_index_v2` in Elasticsearch.
  3. Service streams all active products from Product Service `product_db` in bulk batches of 500 records (`SRCH-BR-07`).
  4. Service populates `products_index_v2`.
  5. Service atomically updates index alias `products_index` to point to `products_index_v2`.
  6. Service drops old index and returns `200 OK` with total reindexed document count.
- **Business Rules Referenced**: `SRCH-BR-01`, `SRCH-BR-07`.
- **Postconditions**: Complete Elasticsearch catalog index rebuilt without downtime.
