# OmniCommerce Use Cases Index

> **Target Directory:** `.agent/usecases/`  
> **Purpose:** Comprehensive directory of functional use cases, actor flows, preconditions, exception paths, postconditions, and business rule cross-references across all OmniCommerce microservices.  
> **Version:** 1.0.0  
> **Last Updated:** July 2026  

---

## Microservice Use Case Catalog

| Service Name | File Link | UC Prefix | Key Responsibilities & Use Case Highlights |
|---|---|---|---|
| **Auth Service** | [auth.md](./auth.md) | `AUTH-UC-XX` | Registration, credential login, token rotation, logout, password reset, account lockout handling. |
| **User Service** | [user.md](./user.md) | `USER-UC-XX` | View/update profile, manage delivery addresses, default address switching, preference updates, admin role assignment. |
| **Product Service** | [product.md](./product.md) | `PRD-UC-XX` | Product catalog creation, variant setup, seller listing submission, admin approval/rejection, category management. |
| **Inventory Service** | [inventory.md](./inventory.md) | `INV-UC-XX` | Check stock, reserve stock during checkout, release expired reservations, confirm physical stock deduction, safety alerts. |
| **Cart Service** | [cart.md](./cart.md) | `CART-UC-XX` | View cart, add variant to cart, update item quantity, remove item, guest-to-user cart merging, clear cart. |
| **Order Service** | [order.md](./order.md) | `ORD-UC-XX` | Checkout order creation, order subtotal/tax/shipping calculation, order cancellation, status state transitions, order timeline lookup. |
| **Payment Service** | [payment.md](./payment.md) | `PAY-UC-XX` | Process credit card/gateway payment, verify gateway webhook signatures, issue full/partial refund, handle payment failure. |
| **Shipping Service** | [shipping.md](./shipping.md) | `SHIP-UC-XX` | Calculate shipping rates, generate shipping label PDF/ZPL, carrier tracking status update, delivery auto-completion. |
| **Promotion Service** | [promotion.md](./promotion.md) | `PROM-UC-XX` | Validate coupon code, apply percentage/fixed discount, schedule flash sale campaign, redeem voucher, enforce usage caps. |
| **Review Service** | [review.md](./review.md) | `REV-UC-XX` | Submit verified purchase review, rate product (1-5 stars), profanity moderation, compute aggregate average rating. |
| **Media Service** | [media.md](./media.md) | `MED-UC-XX` | Upload media asset (multipart), magic-byte validation, convert to WebP, generate 150px/500px/1200px thumbnails, asset deletion. |
| **Search Service** | [search.md](./search.md) | `SRCH-UC-XX` | Full-text catalog search, faceted filter execution, auto-complete suggestions, event-driven search sync, full catalog reindex. |
| **Notification Service**| [notification.md](./notification.md)| `NOTIF-UC-XX` | Dispatch email via Handlebars, send SMS alert, send FCM mobile push, BullMQ queue retries, marketing opt-out check. |
| **Analytics Service** | [analytics.md](./analytics.md) | `ANL-UC-XX` | Async metric ingestion, TimescaleDB time-series aggregation, GMV/Revenue/AOV calculations, top product performance report. |

---

## Standard Use Case Template Structure

Every use case within these service files adheres to the following specification:

```markdown
### [SERVICE]-UC-XX: Use Case Title

- **Primary Actor**: Customer / Seller / Admin / System Worker / Carrier Webhook
- **Preconditions**: System prerequisites prior to execution
- **Trigger**: Initiating API request or domain event trigger
- **Main Success Scenario**: Step-by-step execution path
- **Alternative / Exception Flows**: Failure modes and error responses
- **Business Rules Referenced**: Direct mapping to `.agent/business/[service].md` rules
- **Postconditions**: Resulting database state, emitted events, and response output
```
