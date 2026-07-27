# Cache Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Cache Software Architecture Document (CSAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Caching & In-Memory Data Storage Layer |
| Primary Technology | Redis (In-Memory Data Structure Store) |
| Caching Pattern | Cache-Aside Pattern (Primary) |
| Persistence Policy | RDB Snapshots + AOF (Append-Only File) for Session/Token durability |
| Eviction Policy | `allkeys-lru` (Least Recently Used) |
| Audience | Backend Engineers, Database Administrators, DevOps Engineers, System Architects |

---

# Table of Contents

1. Introduction
   1.1 Purpose  
   1.2 Scope  
   1.3 Intended Audience  
   1.4 Core Design Principles  
2. Redis Topology & Cluster Architecture
   2.1 Topology Overview  
   2.2 High Availability & Sentinel Configuration  
   2.3 Memory Management & Eviction Policy  
3. Core Caching Patterns
   3.1 Cache-Aside Pattern (Lazy Loading)  
   3.2 Write-Through / Write-Behind Rules  
4. Key Namespacing Standard
   4.1 Key Format Specification  
   4.2 Namespace Registry & TTL Rules  
5. Domain Use Case Mapping
   5.1 Product Catalog Caching  
   5.2 User Session & Refresh Token Storage  
   5.3 OTP & Verification Code Storage  
   5.4 API Rate Limiting Counters  
   5.5 Idempotency Response Cache  
   5.6 Temporary Cart & Checkout State  
6. Cache Invalidation & Synchronization
   6.1 Event-Driven Cache Invalidation  
   6.2 TTL-Based Expiration Strategy  
7. Anti-Pattern Mitigation & Resilience
   7.1 Cache Stampede (Dogpiling) Mitigation  
   7.2 Cache Penetration Prevention  
   7.3 Cache Avalanche Prevention  
8. Security & Compliance
   8.1 Sensitive Data Caching Policy  
   8.2 Network Security & Authentication  
9. Observability & Telemetry
   9.1 Cache Performance Telemetry  
   9.2 Prometheus Metrics & Grafana Alerts  
10. Architecture Decision Summary
11. Related Documents
12. Conclusion

---

# 1. Introduction

## 1.1 Purpose

This document defines the **Cache Architecture** for OmniCommerce. It establishes the caching patterns, key structures, TTL policies, invalidation strategies, and resilience controls required to minimize database workload, decrease API latencies, and deliver high throughput across the platform.

---

## 1.2 Scope

This specification covers:
- Redis cluster infrastructure and high-availability configuration.
- Caching standards and key namespacing conventions.
- Specialized caching implementations for catalog, session, rate limiting, and idempotency.
- Event-driven cache invalidation routines.
- Mitigation strategies for Cache Stampede, Cache Penetration, and Cache Avalanche.
- Telemetry, metrics, and memory eviction monitoring.

---

## 1.3 Intended Audience

This document is for Backend Engineers, Database Administrators, System Architects, and DevOps Engineers managing high-performance caching layers.

---

## 1.4 Core Design Principles

1. **Redis is Not Source of Truth**: Persistent data must always originate from PostgreSQL; Redis serves exclusively as an acceleration layer.
2. **Explicit Expiration (TTLs)**: Every stored key must carry an explicit Time-To-Live (TTL) to prevent memory bloat.
3. **Event-Driven Invalidation**: Mutations in PostgreSQL immediately trigger RabbitMQ invalidation events to maintain consistency.
4. **Resiliency by Design**: System failures in Redis must gracefully degrade to database queries without bringing down API endpoints.

---

# 2. Redis Topology & Cluster Architecture

## 2.1 Topology Overview

OmniCommerce utilizes **Redis** for in-memory caching and session management.

```text
 Client API / BFF / Microservice
                │
                ▼
     Redis Master Node (Read/Write)
       ├── Async Replication ──► Redis Replica Node 1 (Read Only)
       └── Async Replication ──► Redis Replica Node 2 (Read Only)
                ▲
                │ Health Check & Automatic Failover
        Redis Sentinel Cluster (3 Nodes)
```

---

## 2.2 High Availability & Sentinel Configuration

- **Development**: Single Redis 7.x instance.
- **Production**: Redis Sentinel cluster with 1 Primary Master and 2 Replicas across distinct availability zones.
- **Failover SLA**: Automatic master failover occurs within `< 5 seconds`.

---

## 2.3 Memory Management & Eviction Policy

- **Eviction Policy**: `allkeys-lru` (Evicts least recently used keys when max memory is reached).
- **Max Memory Limit**: Configured to 80% of node RAM (leaving 20% for replication buffers and background saving).

---

# 3. Core Caching Patterns

## 3.1 Cache-Aside Pattern (Lazy Loading)

Microservices primarily adopt the **Cache-Aside Pattern** for read operations:

```text
Client ──► Microservice ──► 1. Check Redis Cache
                                  │
                 ┌────────────────┴────────────────┐
                 │ Cache Hit                       │ Cache Miss
                 ▼                                 ▼
        Return Cached Data               2. Query PostgreSQL DB
                                                   │
                                         3. Write Result to Redis (with TTL)
                                                   │
                                         4. Return Result to Client
```

---

## 3.2 Write-Through / Write-Behind Rules

- **Write-Through**: Used exclusively for high-speed rate limiting counters and temporary checkout states.
- **Write-Behind (Asynchronous)**: Not used for core financial or order transactions to prevent data loss risk.

---

# 4. Key Namespacing Standard

## 4.1 Key Format Specification

All keys stored in Redis must follow strict colon-delimited namespacing:

`omni:{environment}:{domain}:{entity_type}:{entity_id}:{attribute}`

- **Example 1**: `omni:prod:product:details:prd_987654`
- **Example 2**: `omni:prod:auth:refresh-token:usr_112233`
- **Example 3**: `omni:prod:ratelimit:ip:192.168.1.1`

---

## 4.2 Namespace Registry & TTL Rules

| Domain | Namespace Pattern | Data Structure | Standard TTL |
|--------|-------------------|----------------|--------------|
| **Product** | `omni:{env}:product:details:{id}` | String (JSON) | 1 Hour (3600s) |
| **Product** | `omni:{env}:product:category-tree` | String (JSON) | 24 Hours (86400s) |
| **Auth** | `omni:{env}:auth:refresh-token:{userId}` | String | 7 Days (604800s) |
| **Auth** | `omni:{env}:auth:otp:{email}` | String | 5 Minutes (300s) |
| **Rate Limit**| `omni:{env}:ratelimit:{clientId}` | Sorted Set (ZSET) | 1 Minute (60s) |
| **Idempotency**|`omni:{env}:idempotency:{key}` | String (JSON) | 24 Hours (86400s) |
| **Cart** | `omni:{env}:cart:{customerId}` | Hash (HSET) | 30 Days (2592000s)|

---

# 5. Domain Use Case Mapping

## 5.1 Product Catalog Caching

- **Key**: `omni:{env}:product:details:{productId}`
- **Pattern**: Cache-Aside with JSON string payload.
- **Invalidation**: Cleared automatically upon consumption of `ProductUpdated` or `ProductDeleted` RabbitMQ events.

---

## 5.2 User Session & Refresh Token Storage

- **Key**: `omni:{env}:auth:refresh-token:{userId}`
- **Security**: Contains hashed refresh token string with 7-day TTL.
- **Logout Action**: Deletes key immediately from Redis, revoking session.

---

## 5.3 OTP & Verification Code Storage

- **Key**: `omni:{env}:auth:otp:{email}`
- **Pattern**: String value storing 6-digit hashed OTP code.
- **Strict TTL**: Hard 5-minute expiration. Attempt counter increments on failure (max 3 failed attempts before key purging).

---

## 5.4 API Rate Limiting Counters

- **Pattern**: Sliding Window Log using Redis Sorted Sets (`ZSET`).
- **Score**: Microsecond timestamp (`UnixTimeMs`).
- **Operation**: `ZADD` timestamp, `ZREMRANGEBYSCORE` entries older than window, `ZCARD` to count current window requests.

---

## 5.5 Idempotency Response Cache

- **Key**: `omni:{env}:idempotency:{idempotencyKey}`
- **Value**: Encapsulated standard success HTTP response envelope.
- **TTL**: 24 Hours.

---

## 5.6 Temporary Cart & Checkout State

- **Key**: `omni:{env}:cart:{customerId}`
- **Data Structure**: Redis Hash (`HSET` where field is `sku` and value is `quantity`).
- **Performance**: Provides `< 2ms` response time for cart additions and updates before formal order checkout.

---

# 6. Cache Invalidation & Synchronization

## 6.1 Event-Driven Cache Invalidation

To guarantee eventual consistency, business microservices emit domain events on state updates. Cache consumer listeners purge stale keys immediately:

```text
[ Product Service ] ──► Update DB ──► Emit `ProductUpdated` ──► [ RabbitMQ ]
                                                                      │
                                                                      ▼
                                                       [ Product Cache Consumer ]
                                                                      │
                                                                      ▼
                                                      Redis: `DEL omni:prod:product:details:prd_123`
```

---

## 6.2 TTL-Based Expiration Strategy

Every cached item acts as a self-cleaning entity via Redis `EXPIRE` commands to safeguard against lost invalidation events.

---

# 7. Anti-Pattern Mitigation & Resilience

## 7.1 Cache Stampede (Dogpiling) Mitigation

When a high-traffic cache key expires, thousands of concurrent requests might hit PostgreSQL simultaneously.

- **Mitigation**: **Distributed Locks (Redlock Algorithm)**.
- First request acquires a 5-second Redis lock (`SET lock_key uuid NX EX 5`), queries PostgreSQL, and updates cache. Concurrent requests wait 50ms and retry reading from cache.

---

## 7.2 Cache Penetration Prevention

Attacks requesting non-existent keys (e.g. `GET /products/fake_id`) can bypass cache and stress database tables.

- **Mitigation**: **Null Object Caching**.
- Non-existent database query results are cached in Redis as `{ "empty": true }` with a short **2-minute TTL**.

---

## 7.3 Cache Avalanche Prevention

Simultaneous expiration of large key batches causes massive database spike.

- **Mitigation**: **Jittered TTLs**.
- Base TTL values are randomized by adding `± 10%` Gaussian jitter (e.g. 3600s TTL randomized between 3240s and 3960s).

---

# 8. Security & Compliance

## 8.1 Sensitive Data Caching Policy

- Passwords, credit card numbers, CVVs, and raw JWT private keys must **never** be written to Redis.
- Tokens stored in Redis must be cryptographically hashed (SHA-256).

---

## 8.2 Network Security & Authentication

- Redis is isolated within private backend VPC subnets (no public IP exposure).
- Require `AUTH` password authentication with TLS encrypted client connections.

---

# 9. Observability & Telemetry

## 9.1 Cache Performance Telemetry

Prometheus monitors Redis operational metrics via Redis Exporter:

- `redis_keyspace_hits_total` / `redis_keyspace_misses_total` (Cache Hit Ratio).
- `redis_memory_used_bytes` vs `redis_memory_max_bytes` (RAM Consumption).
- `redis_connected_clients` (Active pool connection counts).

---

## 9.2 Prometheus Metrics & Grafana Alerts

- **Alert 1**: Cache Hit Ratio drops below **80%** over 15 minutes.
- **Alert 2**: Redis Memory usage exceeds **85%** of allocated limit.

---

# 10. Architecture Decision Summary

| Decision | Selected Option | Rationale |
|----------|-----------------|-----------|
| **Engine** | Redis 7.x | Superior data structures (Hashes, ZSETs), high throughput, Sentinel failover |
| **Pattern** | Cache-Aside | Decouples cache failure from core database reads |
| **Eviction** | `allkeys-lru` | Reclaims memory automatically by dropping least recently used items |
| **Consistency** | Event-Driven Invalidation | Ensures rapid cache purging via RabbitMQ domain events |

---

# 11. Related Documents

- [BACKEND_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/BACKEND_ARCHITECTURE.md)
- [API_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/API_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/EVENT_ARCHITECTURE.md)

---

# 12. Conclusion

The OmniCommerce Cache Architecture optimizes platform performance by combining Redis Sentinel high availability, Cache-Aside execution patterns, event-driven invalidations, and anti-stampede protections. This layer guarantees sub-10ms response times for catalog and session queries while protecting transactional PostgreSQL databases.
