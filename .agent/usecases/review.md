# Review Service Use Cases

> **Service Path:** `apps/backend/review-service/`  
> **Default Port:** `3010`  
> **Business Rules Reference:** [review.md](../business/review.md)  

---

### REV-UC-01: Submit Customer Product Review

- **Primary Actor**: Authenticated Customer
- **Preconditions**: Customer purchased product and order status is `DELIVERED` or `COMPLETED` (`REV-BR-01`).
- **Trigger**: Client sends `POST /api/v1/reviews/products/{productId}` with `rating` (1-5), `comment` text (10-2000 chars).
- **Main Success Scenario**:
  1. Review Service queries Order Service / DB to verify user has a delivered order containing `productId` (`REV-BR-01`).
  2. Service checks that user has not previously reviewed this product for this order (`REV-BR-02`).
  3. Service validates `rating` is an integer between 1 and 5 (`REV-BR-03`).
  4. Service validates comment text length (10 to 2000 characters) (`REV-BR-04`).
  5. Service passes comment text through automated profanity filter (`REV-BR-05`).
  6. If clean, status is set to `APPROVED` and `verifiedPurchase: true` badge is attached (`REV-BR-06`, `REV-BR-07`).
  7. If profanity flagged, status is set to `PENDING_MODERATION`.
  8. Service persists review in `review_db`, emits `review.submitted` event, and returns `201 CREATED`.
- **Alternative / Exception Flows**:
  - *No Verified Purchase*: Returns `403 FORBIDDEN` with error `VERIFIED_PURCHASE_REQUIRED`.
  - *Duplicate Review*: Returns `400 BAD_REQUEST` with error `DUPLICATE_REVIEW`.
- **Business Rules Referenced**: `REV-BR-01`, `REV-BR-02`, `REV-BR-03`, `REV-BR-04`, `REV-BR-05`, `REV-BR-06`, `REV-BR-07`, `REV-BR-10`.
- **Postconditions**: Review created in DB, status assigned, event emitted.

---

### REV-UC-02: Moderate Submitted Review (Admin)

- **Primary Actor**: Platform Admin
- **Preconditions**: Review exists in `PENDING_MODERATION` status.
- **Trigger**: Admin sends `POST /api/v1/reviews/{id}/moderate` with `action: APPROVED` or `action: REJECTED`.
- **Main Success Scenario**:
  1. Review Service validates admin role.
  2. Service updates review status in `review_db` (`APPROVED` or `REJECTED`).
  3. If approved, Service emits `review.approved` event (`REV-BR-11`).
  4. Product Service consumes `review.approved` and re-computes `averageRating` (`REV-BR-08`, `REV-BR-09`).
  5. Service returns `200 OK`.
- **Business Rules Referenced**: `REV-BR-06`, `REV-BR-08`, `REV-BR-09`, `REV-BR-11`.
- **Postconditions**: Review status updated, product average rating re-calculated if approved.

---

### REV-UC-03: View Product Reviews & Aggregate Rating

- **Primary Actor**: Public / Customer
- **Preconditions**: Product exists.
- **Trigger**: Client sends `GET /api/v1/reviews/products/{productId}` with page, limit, ratingFilter.
- **Main Success Scenario**:
  1. Review Service queries `review_db` for approved reviews (`status == APPROVED`) linked to `productId`.
  2. Service computes rating distribution breakdown (counts for 5, 4, 3, 2, 1 stars) and overall `averageRating`.
  3. Service returns `200 OK` with aggregate rating summary and paginated review items.
- **Business Rules Referenced**: `REV-BR-06`, `REV-BR-07`, `REV-BR-08`.
- **Postconditions**: Reviews and rating breakdown returned.
