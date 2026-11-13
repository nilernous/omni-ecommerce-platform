# Review Domain Business Rules (Product Service)

> **Service Path:** `apps/backend/product-service/`  
> **Default Port:** `3003`  
> **Module:** `src/modules/review` (shares `product_db` with the Product module)  
> **Primary Storage:** PostgreSQL (`product_db`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Review module of the Product Service** manages customer product reviews, star ratings (1 to 5 stars), verified purchase badges, review moderation, and aggregate product rating metrics.

---

## 2. Core Business Rules & Validations

### Review Submission Rules
- **REV-BR-01: Verified Purchase Prerequisite**: A customer can submit a review ONLY for products they have previously purchased and received (`Order Status = DELIVERED` or `COMPLETED`).
- **REV-BR-02: One Review Per Product Limit**: A customer is allowed a maximum of **1 review per product ID** per completed order.
- **REV-BR-03: Rating Scale Bound**: `rating` must be an integer between **1** and **5** stars inclusive.
- **REV-BR-04: Review Content Bounds**: Review text length must be between **10** and **2,000 characters**.

### Review Moderation Rules
- **REV-BR-05: Automated Profanity Screening**: Inbound reviews containing profanity or blacklisted keywords are flagged for manual review with status `PENDING_MODERATION`.
- **REV-BR-06: Visibility States**:
  - `APPROVED`: Publicly displayed on product detail pages.
  - `PENDING_MODERATION`: Under admin review; hidden from product pages.
  - `REJECTED`: Permanently hidden due to policy violations.
- **REV-BR-07: Verified Purchase Badge**: Reviews linked to a confirmed delivered order display a `Verified Purchase` badge.

### Aggregate Metrics Rules
- **REV-BR-08: Average Rating Formula**: `averageRating = SUM(ratings) / count(reviews)` rounded to 1 decimal place.
- **REV-BR-09: Transactional Metric Sync**: When a review is approved, the product's `averageRating` and `reviewCount` are recomputed and written in the same `product_db` transaction as the review status change (Review and Product are modules of the same service, so no cross-service call or event is needed).

---

## 3. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/reviews/products/{productId}`| Public | List approved reviews & rating breakdown for product |
| `POST` | `/api/v1/reviews/products/{productId}`| Customer | Submit customer review for verified purchase |
| `POST` | `/api/v1/reviews/{id}/moderate` | Admin | Approve or reject submitted review |

---

## 4. Domain Events Emitted & Consumed

### Emitted Events
- **REV-BR-10: Event `review.submitted`**: Emitted when a customer posts a review.
- **REV-BR-11: Event `review.approved`**: Emitted when a review is approved, for downstream consumers. The product rating update does not depend on this event; it happens in-transaction (`REV-BR-09`).

### Consumed Events
- **REV-BR-12: Consumer `order.delivered`**: Updates customer eligibility record to allow product review submission.
