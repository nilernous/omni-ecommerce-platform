# Analytics Service Business Rules

> **Service Path:** `apps/backend/analytics-service/`  
> **Default Port:** `3014`  
> **Primary Storage:** PostgreSQL / TimescaleDB (`analytics_db`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Analytics Service** aggregates platform-wide business metrics, sales revenue summaries, conversion funnels, best-selling product rankings, and merchant performance statistics via event consumption.

---

## 2. Core Business Rules & Validations

### Metric Aggregation Rules
- **ANL-BR-01: Non-Blocking Event Ingestion**: Collects metric data exclusively via AMQP domain events without blocking active REST transaction flows.
- **ANL-BR-02: Time-Series Hyper-Table Storage**: Stores sales and order metrics bucketed by hour, day, month, and year using TimescaleDB hyper-tables.
- **ANL-BR-03: Gross Merchandise Value (GMV)**: `GMV = SUM(Total Amount of All Placed Orders)`.
- **ANL-BR-04: Net Revenue Calculation**: `Net Revenue = SUM(Paid Orders) - SUM(Cancelled/Refunded Amounts)`.
- **ANL-BR-05: Average Order Value (AOV)**: `AOV = Net Revenue / Total Paid Orders Count`.
- **ANL-BR-06: Conversion Rate Formula**: `Conversion Rate = (Total Placed Orders / Unique Visitor Sessions) * 100`.

### Data Privacy & Retention
- **ANL-BR-07: PII Scrubbing**: User Personally Identifiable Information (email, name, street address) is scrubbed from incoming analytics event payloads before hyper-table insertion.
- **ANL-BR-08: Telemetry Data Retention**: Aggregated daily summaries are retained indefinitely; raw event telemetry logs are purged after **90 Days**.

---

## 3. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/analytics/sales-summary` | Admin | Platform-wide sales revenue summary & GMV |
| `GET` | `/api/v1/analytics/top-products` | Admin / Seller | Best-selling products by quantity and revenue |
| `GET` | `/api/v1/analytics/seller/performance`| Seller | Merchant-specific store performance metrics |

---

## 4. Domain Events Consumed

- **ANL-BR-09: Consumer `order.created`**: Increments GMV and order volume counts.
- **ANL-BR-10: Consumer `order.paid`**: Updates net revenue and seller earnings metrics.
- **ANL-BR-11: Consumer `order.cancelled`**: Reverts revenue and order metrics.
- **ANL-BR-12: Consumer `user.registered`**: Increments customer growth metric.
- **ANL-BR-13: Consumer `product.created`**: Updates catalog size metric.
