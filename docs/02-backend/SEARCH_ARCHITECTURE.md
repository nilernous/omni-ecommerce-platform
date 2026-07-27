# Search Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Search Software Architecture Document (SSAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Search & Discovery Layer |
| Primary Search Engine | Elasticsearch 8.x |
| Primary Domain | Product Catalog Discovery & Filtering |
| Synchronization Model | Asynchronous Event-Driven Indexing (via RabbitMQ) |
| Read Topology | Index Aliases (`omni_products_read`) |
| Audience | Backend Engineers, Search Engineers, Data Engineers, DevOps Engineers |

---

# Table of Contents

1. Introduction
   1.1 Purpose  
   1.2 Scope  
   1.3 Intended Audience  
   1.4 Core Design Goals  
2. Search Architectural Topology
   2.1 System Architecture Overview  
   2.2 Component Responsibilities  
   2.3 High-Level Search Query Flow  
3. Elasticsearch Cluster & Node Architecture
   3.1 Cluster Topology  
   3.2 Sharding & Replication Strategy  
   3.3 Index Lifecycle Management (ILM)  
4. Index Mapping & Analysis Specification
   4.1 Product Index Mapping (`omni_products_v1`)  
   4.2 Custom Analyzers & Tokenizers  
   4.3 Field Weighting & Boosting Rules  
5. Asynchronous Indexing & Synchronization Pipeline
   5.1 Event-Driven Indexing Workflow  
   5.2 Bulk Indexing Batch Processing  
   5.3 Zero-Downtime Reindexing Strategy (Index Aliases)  
6. Search Query Architecture
   6.1 Multi-Match Relevance Querying  
   6.2 Faceted Aggregations (Filtering)  
   6.3 Function Score Rescoring (Popularity & Rating Boosting)  
7. Auto-Complete & Suggestion Engine
   7.1 Prefix Matching via Edge-N-Gram  
   7.2 Completion Suggester API  
8. Resilience, Performance Tuning & Caching
   8.1 Query Caching & Filter Caching  
   8.2 Timeout Guards & Circuit Breakers  
9. Observability & Telemetry
   9.1 Search Metrics Telemetry  
   9.2 Slow Query Logging & Performance Alerts  
10. Architecture Decision Summary
11. Related Documents
12. Conclusion

---

# 1. Introduction

## 1.1 Purpose

This document defines the **Search Architecture** for OmniCommerce. It establishes the search cluster topologies, index mapping schemas, event-driven synchronization pipelines, search relevance scoring rules, and auto-complete mechanisms required to deliver sub-50ms full-text product search and faceted navigation across the platform.

---

## 1.2 Scope

This specification covers:
- Elasticsearch 8.x cluster configuration, node roles, and sharding strategies.
- The primary product index schema (`omni_products_v1`) and custom text analyzers.
- Asynchronous search indexing driven by RabbitMQ domain events.
- Search query constructs, multi-match field boosting, and faceted aggregations.
- Instant auto-complete search suggestions.
- Zero-downtime index alias management and search performance tuning.

---

## 1.3 Intended Audience

This document is for Search Engineers, Backend Developers, DevOps Engineers, and System Architects building catalog search features.

---

## 1.4 Core Design Goals

1. **Sub-50ms Latency**: Delivering fast product discovery queries under peak holiday workloads.
2. **High Relevance**: Returning accurate, ranked results using multi-field text boosting and popularity rescoring.
3. **Decoupled Architecture**: Separating heavy search query loads from transactional PostgreSQL databases.
4. **Eventually Consistent**: Index updates process within `< 1 second` after transactional commits in Product Service.

---

# 2. Search Architectural Topology

## 2.1 System Architecture Overview

OmniCommerce decouples full-text product search from the transactional `Product Service` by establishing a dedicated `Search Service` backed by an Elasticsearch cluster:

```text
 Client Application (Web / Mobile)
               │
               ▼
          API Gateway / Customer BFF
               │
               ▼ 1. Synchronous Search Query (HTTP GET /api/v1/search/products)
        Search Service
               │
               ▼ 2. Query Index Alias `omni_products_read`
      Elasticsearch Cluster
               ▲
               │ 3. Async Event-Driven Indexing (`ProductUpdated` Event)
         RabbitMQ Broker ◄── Product Service (PostgreSQL Mutation)
```

---

## 2.2 Component Responsibilities

- **Search Service (NestJS)**: Exposes REST APIs for search queries, handles request validation, constructs Elasticsearch DSL queries, and converts search aggregations into standard response payloads.
- **Elasticsearch Cluster**: In-memory and disk-based inverted index store providing full-text search, term filtering, and faceted aggregations.
- **RabbitMQ Indexing Consumer**: Consumes `product.created`, `product.updated`, `product.deleted` events to apply bulk updates to Elasticsearch.

---

## 2.3 High-Level Search Query Flow

1. Client sends `GET /api/v1/search/products?q=wireless+headphones&category=audio&minPrice=50&sort=popularity`.
2. Search Service validates query parameters and builds an Elasticsearch `bool` query with `multi_match` text search and `term`/`range` filters.
3. Elasticsearch evaluates query against inverted index and returns matching product documents alongside term aggregations (brands, categories, price bounds).
4. Search Service maps results into standard Paginated Response Envelope.

---

# 3. Elasticsearch Cluster & Node Architecture

## 3.1 Cluster Topology

- **Development**: Single-node Elasticsearch instance.
- **Production**: 3-Node Dedicated Cluster across separate availability zones:
  - **Master Eligible Nodes**: 3 nodes (prevents split-brain).
  - **Data Nodes**: 3 nodes (stores indices and processes queries).
  - **Ingest Nodes**: Integrated into Data nodes for pipeline transformation.

---

## 3.2 Sharding & Replication Strategy

| Index Name | Primary Shards | Replica Shards | Total Shards | Target Size per Shards |
|------------|----------------|----------------|--------------|------------------------|
| `omni_products_v1` | 3 | 1 (per primary) | 6 Shards | 10 GB - 25 GB |
| `omni_suggestions_v1` | 2 | 1 (per primary) | 4 Shards | 2 GB - 5 GB |

---

## 3.3 Index Lifecycle Management (ILM)

- **Hot Phase**: Active read/write operations on primary index alias (`omni_products_read`).
- **Snapshot Retention**: Daily automated index snapshots backed up to Cloudflare R2 / AWS S3 object storage.

---

# 4. Index Mapping & Analysis Specification

## 4.1 Product Index Mapping (`omni_products_v1`)

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "sku": { "type": "keyword" },
      "title": { 
        "type": "text", 
        "analyzer": "omni_text_analyzer",
        "fields": {
          "suggest": { "type": "completion" },
          "keyword": { "type": "keyword" }
        }
      },
      "description": { "type": "text", "analyzer": "omni_text_analyzer" },
      "categoryId": { "type": "keyword" },
      "categoryPath": { "type": "keyword" },
      "brandId": { "type": "keyword" },
      "brandName": { "type": "keyword" },
      "price": { "type": "double" },
      "salePrice": { "type": "double" },
      "inStock": { "type": "boolean" },
      "attributes": {
        "type": "nested",
        "properties": {
          "key": { "type": "keyword" },
          "value": { "type": "keyword" }
        }
      },
      "tags": { "type": "keyword" },
      "rating": { "type": "float" },
      "salesCount": { "type": "integer" },
      "createdAt": { "type": "date" }
    }
  }
}
```

---

## 4.2 Custom Analyzers & Tokenizers

```json
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 15,
          "token_chars": ["letter", "digit"]
        }
      },
      "analyzer": {
        "omni_text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "snowball"]
        },
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "autocomplete_tokenizer",
          "filter": ["lowercase"]
        }
      }
    }
  }
}
```

---

## 4.3 Field Weighting & Boosting Rules

When evaluating search queries, fields are weighted according to business relevance:

| Field Name | Boost Factor | Rationale |
|------------|--------------|-----------|
| `title` | **^3.0** | Matches in product title carry highest relevance |
| `brandName` | **^2.0** | Brand name matches carry high user intent |
| `tags` | **^2.0** | Curated product tags reflect search intent |
| `categoryPath`| **^1.5** | Category matches structure discovery |
| `description` | **^1.0** | Body text matches carry standard weight |

---

# 5. Asynchronous Indexing & Synchronization Pipeline

## 5.1 Event-Driven Indexing Workflow

```text
[ Product Service ] ──(DB Commit)──► Publish `ProductUpdated` ──► [ RabbitMQ ]
                                                                      │
                                                                      ▼
                                                       [ Search Indexing Consumer ]
                                                                      │
                                                                      ▼
                                                       Elasticsearch Index API
                                                       (Update document in `omni_products_v1`)
```

---

## 5.2 Bulk Indexing Batch Processing

- To maximize indexing throughput, consumer workers buffer incoming events for **500ms** or until **200 items** accumulate before executing a single Elasticsearch `_bulk` API call.

---

## 5.3 Zero-Downtime Reindexing Strategy (Index Aliases)

Clients query an **Index Alias** (`omni_products_read`) rather than direct index names:

```text
omni_products_read ──► Alias ──► Points to current active index: `omni_products_v1`
```

### Reindexing Steps:
1. Create new index: `omni_products_v2` with updated mapping.
2. Reindex data from `omni_products_v1` to `omni_products_v2` via `_reindex` API.
3. Atomically update Alias pointer:
```json
POST /_aliases
{
  "actions": [
    { "remove": { "index": "omni_products_v1", "alias": "omni_products_read" } },
    { "add":    { "index": "omni_products_v2", "alias": "omni_products_read" } }
  ]
}
```
4. Drop old index `omni_products_v1` after verification. Zero client downtime is incurred.

---

# 6. Search Query Architecture

## 6.1 Multi-Match Relevance Querying

Search requests generate a structured Elasticsearch DSL query:

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "wireless headphones",
            "fields": ["title^3.0", "brandName^2.0", "tags^2.0", "description^1.0"],
            "type": "best_fields",
            "fuzziness": "AUTO"
          }
        }
      ],
      "filter": [
        { "term": { "inStock": true } },
        { "range": { "price": { "gte": 50, "lte": 300 } } }
      ]
    }
  }
}
```

---

## 6.2 Faceted Aggregations (Filtering)

Search queries automatically return breakdown counts for frontend filter sidebar UI:

```json
{
  "aggs": {
    "brands": { "terms": { "field": "brandName" } },
    "categories": { "terms": { "field": "categoryPath" } },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50 },
          { "from": 50, "to": 100 },
          { "from": 100, "to": 300 },
          { "from": 300 }
        ]
      }
    }
  }
}
```

---

## 6.3 Function Score Rescoring (Popularity & Rating Boosting)

To ensure popular, highly-rated items rank higher in search results, relevance scores (`_score`) are rescored:

`Final Score = Relevance Score * log(1 + salesCount) * (rating / 5.0)`

---

# 7. Auto-Complete & Suggestion Engine

## 7.1 Prefix Matching via Edge-N-Gram

Auto-complete endpoints (`GET /api/v1/search/suggestions?q=wire`) query fields configured with the `autocomplete_analyzer` to return instant product title matches within `< 15ms`.

---

## 7.2 Completion Suggester API

High-speed completion suggestions utilize the dedicated `completion` field mapping:

```json
{
  "suggest": {
    "product-suggest": {
      "prefix": "wire",
      "completion": {
        "field": "title.suggest",
        "size": 5,
        "skip_duplicates": true
      }
    }
  }
}
```

---

# 8. Resilience, Performance Tuning & Caching

## 8.1 Query Caching & Filter Caching

- Elasticsearch automatically caches Filter contexts in memory.
- Search Service caches high-frequency autocomplete suggestions in Redis for 15 minutes.

---

## 8.2 Timeout Guards & Circuit Breakers

- Search queries execute with a strict **2-second timeout guard** (`timeout: "2s"`).
- If Elasticsearch fails or times out, Search Service falls back to basic SQL queries in Product Service to preserve platform availability.

---

# 9. Observability & Telemetry

## 9.1 Search Metrics Telemetry

Prometheus tracks:
- `elasticsearch_query_latency_seconds`: Latency of search executions.
- `elasticsearch_indexing_rate_per_sec`: Rate of document indexing.

---

## 9.2 Slow Query Logging & Performance Alerts

- Elasticsearch logs any query exceeding **500ms** to `slowlog`.
- Grafana triggers an alert if 95th percentile search latency exceeds **150ms** over 5 minutes.

---

# 10. Architecture Decision Summary

| Decision | Selected Option | Rationale |
|----------|-----------------|-----------|
| **Search Engine** | Elasticsearch 8.x | Market standard, rich text analyzers, fast aggregations, scalable sharding |
| **Sync Pattern** | Async Domain Events | Decouples catalog persistence from search indexing |
| **Alias Strategy** | Read Aliases | Enables zero-downtime mapping updates and index re-building |
| **Relevance Model** | Multi-match + Function Score | Balances text match precision with business popularity and ratings |

---

# 11. Related Documents

- [BACKEND_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/BACKEND_ARCHITECTURE.md)
- [API_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/API_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/EVENT_ARCHITECTURE.md)

---

# 12. Conclusion

The OmniCommerce Search Architecture provides a high-performance discovery platform. By decoupling search queries into Elasticsearch, leveraging event-driven asynchronous index synchronization, and applying relevance rescoring algorithms, the system delivers fast, accurate product search and instant auto-complete suggestions.
