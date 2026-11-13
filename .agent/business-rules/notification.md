# Notification Service Business Rules

> **Service Path:** `apps/backend/notification-service/`  
> **Default Port:** `3013`  
> **Primary Storage:** PostgreSQL (`notification_db`) + RabbitMQ (dispatch & retry queues)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Notification Service** handles multi-channel communication dispatching (Email via Nodemailer/SendGrid, SMS via Twilio, Push via Firebase Cloud Messaging), template rendering, notification history logging, and user opt-out preference enforcement.

---

## 2. Core Business Rules & Validations

### Multi-Channel Dispatch Rules
- **NOTIF-BR-01: Email Template Rendering**: Formats HTML emails using Handlebars templates for transactional notifications (Order Confirmations, Welcome, Password Reset).
- **NOTIF-BR-02: SMS Dispatching**: Dispatches short transactional SMS text messages for order status updates and OTP verification codes.
- **NOTIF-BR-03: Mobile Push Dispatching**: Sends push notifications to iOS and Android devices via Firebase Cloud Messaging (FCM) using stored device tokens.

### User Preference Enforcement
- **NOTIF-BR-04: Mandatory Transactional Messages**: Transactional notifications (Password Reset, Order Placed, Payment Receipts) CANNOT be unsubscribed or opted out by users.
- **NOTIF-BR-05: Marketing Preference Check**: Promotional notifications (Flash Sales, Discounts) MUST check User Service preferences (`marketingEnabled = true`). If user opted out, message is skipped.

### Retry & Delivery Guarantees
- **NOTIF-BR-06: Asynchronous Queueing**: Outbound notifications are published as dispatch messages to the RabbitMQ topic exchange `omni.notification.dispatch` (routing keys `email`, `sms`, `push`) and consumed from durable per-channel queues (`omni.notification.email-dispatch.queue`, `omni.notification.sms-dispatch.queue`, `omni.notification.push-dispatch.queue`) to decouple dispatching from event emission.
- **NOTIF-BR-07: Dispatch Retry Strategy**: Failed delivery attempts retry **3 times** with exponential backoff delays (10s, 30s, 90s) before moving to Dead Letter Queue (DLQ). Retries use RabbitMQ delay queues (`omni.notification.retry-10s.queue`, `retry-30s`, `retry-90s`) with `x-message-ttl` and `x-dead-letter-exchange = omni.notification.dispatch`, so expired messages return to their channel queue. The attempt count is carried in the `x-retry-count` header. After the 3rd failed retry the message is published to `omni.dead.letter` (routing key `dlq.notification`) and lands in `omni.notification.dlq`.

---

## 3. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Customer | Fetch in-app user notifications history |
| `PATCH` | `/api/v1/notifications/{id}/read`| Customer | Mark notification item as read |
| `POST` | `/api/v1/notifications/send-test` | Admin | Dispatch test notification template |

---

## 4. Domain Events Consumed

- **NOTIF-BR-08: Consumer `auth.user.registered`**: Dispatches welcome email.
- **NOTIF-BR-09: Consumer `auth.password.changed`**: Dispatches security alert email.
- **NOTIF-BR-10: Consumer `order.created`**: Dispatches order placement confirmation email & push alert.
- **NOTIF-BR-11: Consumer `payment.completed`**: Dispatches payment receipt email.
- **NOTIF-BR-12: Consumer `shipping.dispatched`**: Dispatches shipment tracking email & SMS alert.
