# OmniCommerce Business Rules Index

> **Target Directory:** `.agent/business/`  
> **Purpose:** Central repository of business rules, validation constraints, domain state machines, entity boundaries, and event contracts for all OmniCommerce backend services.  
> **Version:** 1.0.0  
> **Last Updated:** July 2026  

---

## Service Business Rules Index

The business rules of the OmniCommerce platform are split by core microservice:

| Service Name | File Link | Port | Main Responsibility |
|---|---|---|---|
| **Auth Service** | [auth.md](./auth.md) | `3001` | Identity management, registration, JWT issuance/refresh, password hashing, session revocation. |
| **User Service** | [user.md](./user.md) | `3002` | User profile attributes, delivery addresses, customer preferences, RBAC role definitions. |
| **Product Service** | [product.md](./product.md) | `3003` | Product catalog, SKU management, categories, brands, variants, seller approval workflow. |
| **Inventory Service** | [inventory.md](./inventory.md) | `3004` | Stock level tracking across warehouses, stock reservations during checkout, safety stock thresholds. |
| **Cart Service** | [cart.md](./cart.md) | `3005` | Active shopping cart operations, guest carts, quantity updates, price caching, TTL management. |
| **Order Service** | [order.md](./order.md) | `3006` | Order placement, state machine transitions, cancellation rules, fulfillment lifecycle. |
| **Payment Service** | [payment.md](./payment.md) | `3007` | Gateway integrations (Stripe, PayPal), transaction logs, webhook validation, refund handling. |
| **Shipping Service** | [shipping.md](./shipping.md) | `3008` | Carrier integrations, rate calculations, shipping label generation, tracking status updates. |
| **Promotion Service** | [promotion.md](./promotion.md) | `3009` | Coupon discount validation, flash sale rules, promotional campaigns, voucher usage limits. |
| **Review Service** | [review.md](./review.md) | `3010` | Verified customer product reviews, rating aggregates, review moderation workflow. |
| **Media Service** | [media.md](./media.md) | `3011` | File upload handling, image resizing, CDN asset distribution, asset deletion rules. |
| **Search Service** | [search.md](./search.md) | `3012` | Elasticsearch product indexing, full-text search, auto-complete, faceted search filters. |
| **Notification Service**| [notification.md](./notification.md)| `3013` | Email delivery, SMS alerts, Firebase mobile push notifications, template rendering. |
| **Analytics Service** | [analytics.md](./analytics.md) | `3014` | Sales aggregation metrics, top product reports, user conversion tracking, system telemetry. |

---

## Universal Business Governance Rules

1. **Database per Service**: Microservices must only read/write their own dedicated datastore. No service may query another service's tables directly.
2. **Transactional Outbox**: All domain event emissions must use the Outbox pattern committed within the same database transaction as the state change.
3. **Idempotency**: All mutation APIs and event consumers must enforce idempotency to prevent duplicate operations (e.g. duplicate payments or orders).
4. **Strict Input Validation**: Every request DTO is strictly validated; extra or unexpected fields are automatically rejected.
