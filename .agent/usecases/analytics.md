# Analytics Service Use Cases

> **Service Path:** `apps/backend/analytics-service/`  
> **Default Port:** `3014`  
> **Business Rules Reference:** [analytics.md](../business/analytics.md)  

---

### ANL-UC-01: Asynchronous Metric Event Ingestion

- **Primary Actor**: AMQP Domain Event Bus
- **Preconditions**: Domain event emitted across backend (`order.created`, `order.paid`, `order.cancelled`, `user.registered`, `product.created`).
- **Trigger**: AMQP Event received by Analytics Service.
- **Main Success Scenario**:
  1. Analytics Service parses domain event payload (`ANL-BR-01`).
  2. Service scrubs user PII (names, emails, street addresses) from event payload (`ANL-BR-07`).
  3. Service inserts sanitized metric record into TimescaleDB hyper-table `analytics_events` (`ANL-BR-02`).
  4. Service updates hourly and daily roll-up aggregate metrics (GMV, Net Revenue, Order Count, Customer Registration Count).
- **Business Rules Referenced**: `ANL-BR-01`, `ANL-BR-02`, `ANL-BR-03`, `ANL-BR-04`, `ANL-BR-07`, `ANL-BR-09`, `ANL-BR-10`, `ANL-BR-11`, `ANL-BR-12`, `ANL-BR-13`.
- **Postconditions**: PII scrubbed, metric data inserted into TimescaleDB hyper-tables.

---

### ANL-UC-02: View Platform Sales Revenue Summary (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Requester possesses `ADMIN` role.
- **Trigger**: Admin sends `GET /api/v1/analytics/sales-summary` with time range (`startDate`, `endDate`, `interval: DAY/MONTH`).
- **Main Success Scenario**:
  1. Analytics Service verifies admin role.
  2. Service queries TimescaleDB hyper-tables for aggregated sales metrics over target date range.
  3. Service computes `GMV`, `Net Revenue`, `Average Order Value (AOV)`, and `Conversion Rate` (`ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`, `ANL-BR-06`).
  4. Service returns `200 OK` with revenue time-series array and summary KPIs.
- **Business Rules Referenced**: `ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`, `ANL-BR-06`.
- **Postconditions**: Executive sales summary and KPIs returned.

---

### ANL-UC-03: View Top Product Sales Rankings (Admin / Seller)

- **Primary Actor**: Admin / Seller
- **Preconditions**: User authenticated.
- **Trigger**: Client sends `GET /api/v1/analytics/top-products` with `limit` (default: 10).
- **Main Success Scenario**:
  1. Analytics Service queries TimescaleDB for top selling SKUs ordered by unit volume and gross revenue.
  2. If requester is `SELLER`, Service filters results to include only SKUs owned by seller's store.
  3. Service returns `200 OK` with ranked products list.
- **Business Rules Referenced**: `ANL-BR-02`.
- **Postconditions**: Top product sales ranking returned.

---

### ANL-UC-04: View Seller Store Performance Analytics

- **Primary Actor**: Authenticated Seller
- **Preconditions**: Merchant owns an active seller store.
- **Trigger**: Seller sends `GET /api/v1/analytics/seller/performance` with time window.
- **Main Success Scenario**:
  1. Analytics Service extracts `sellerId` from identity context.
  2. Service queries TimescaleDB hyper-tables for merchant's total revenue, order count, average order value, and return rate.
  3. Service returns `200 OK` with seller store analytics.
- **Business Rules Referenced**: `ANL-BR-03`, `ANL-BR-04`, `ANL-BR-05`.
- **Postconditions**: Merchant performance analytics returned.

---

### ANL-UC-05: Purge Expired Raw Telemetry Data

- **Primary Actor**: System Maintenance Cron Worker
- **Preconditions**: Raw event telemetry older than 90 days exists in TimescaleDB.
- **Trigger**: Daily cron worker executes telemetry cleanup job.
- **Main Success Scenario**:
  1. Analytics Service retains aggregated daily/monthly hyper-table summaries indefinitely (`ANL-BR-08`).
  2. Service drops raw event telemetry partitions older than 90 days from TimescaleDB (`ANL-BR-08`).
  3. Service logs cleanup execution audit entry.
- **Business Rules Referenced**: `ANL-BR-08`.
- **Postconditions**: Raw telemetry partitions older than 90 days purged from DB.
