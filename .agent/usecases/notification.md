# Notification Service Use Cases

> **Service Path:** `apps/backend/notification-service/`  
> **Default Port:** `3013`  
> **Business Rules Reference:** [notification.md](../business/notification.md)  

---

### NOTIF-UC-01: Dispatch Transactional Email Notification

- **Primary Actor**: Domain Event Consumer (System)
- **Preconditions**: Domain event emitted requiring email notification (`auth.user.registered`, `order.created`, `payment.completed`).
- **Trigger**: AMQP Event received by Notification Service.
- **Main Success Scenario**:
  1. Notification Service parses event payload (recipient email, recipient name, order details).
  2. Service checks notification type:
     - Transactional notifications (Welcome, Order Placed, Password Reset) bypass marketing opt-out check (`NOTIF-BR-04`).
     - Promotional notifications check User Service preferences (`marketingEnabled == true`, `NOTIF-BR-05`).
  3. Service loads HTML Handlebars template for event type (`NOTIF-BR-01`).
  4. Service renders Handlebars template with event data.
  5. Service enqueues email job in BullMQ Redis queue (`NOTIF-BR-06`).
  6. BullMQ worker calls SMTP gateway (Nodemailer / SendGrid) and dispatches email.
  7. Service logs notification delivery status in `notification_db`.
- **Alternative / Exception Flows**:
  - *User Opted Out of Marketing*: Promotional notification skipped, log recorded as `SKIPPED_OPT_OUT`.
- **Business Rules Referenced**: `NOTIF-BR-01`, `NOTIF-BR-04`, `NOTIF-BR-05`, `NOTIF-BR-06`, `NOTIF-BR-08`, `NOTIF-BR-10`, `NOTIF-BR-11`.
- **Postconditions**: Email rendered, queued, and dispatched via SMTP provider.

---

### NOTIF-UC-02: Send Transactional SMS Notification

- **Primary Actor**: System Event Handler
- **Preconditions**: Recipient phone number provided in E.164 format.
- **Trigger**: Domain event received (`shipping.dispatched` or OTP request).
- **Main Success Scenario**:
  1. Notification Service extracts phone number and message template variables.
  2. Service formats text message (`NOTIF-BR-02`).
  3. Service enqueues SMS job in BullMQ queue (`NOTIF-BR-06`).
  4. Worker dispatches SMS via Twilio API.
  5. Service logs delivery record in `notification_db`.
- **Business Rules Referenced**: `NOTIF-BR-02`, `NOTIF-BR-06`, `NOTIF-BR-12`.
- **Postconditions**: SMS text message sent to recipient mobile device.

---

### NOTIF-UC-03: Send Mobile Push Notification (FCM)

- **Primary Actor**: System Event Handler
- **Preconditions**: User has registered active FCM device token in Flutter mobile app.
- **Trigger**: Domain event received (`order.created`, `order.shipped`, `order.delivered`).
- **Main Success Scenario**:
  1. Notification Service queries User Service for recipient's FCM device push tokens.
  2. Service constructs FCM push payload (title, body, orderId deep link) (`NOTIF-BR-03`).
  3. Service calls Firebase Cloud Messaging (FCM) API.
  4. FCM delivers push notification to customer's iOS / Android device.
  5. Service logs push delivery in `notification_db`.
- **Business Rules Referenced**: `NOTIF-BR-03`, `NOTIF-BR-10`, `NOTIF-BR-12`.
- **Postconditions**: Mobile push notification delivered to user device.

---

### NOTIF-UC-04: View & Mark In-App Customer Notifications

- **Primary Actor**: Authenticated Customer
- **Preconditions**: User has in-app notification records.
- **Trigger**: Client sends `GET /api/v1/notifications` or `PATCH /api/v1/notifications/{id}/read`.
- **Main Success Scenario**:
  1. Notification Service fetches customer's in-app notification history from `notification_db`.
  2. For mark read request: Service updates `isRead: true` for target notification ID.
  3. Service returns `200 OK`.
- **Postconditions**: Notification history returned or marked read.

---

### NOTIF-UC-05: Handle Notification Dispatch Failure & Retries

- **Primary Actor**: BullMQ Worker / System Queue
- **Preconditions**: Email, SMS, or Push dispatch failed due to network or gateway error.
- **Trigger**: SMTP / Twilio / FCM API returns error or timeout.
- **Main Success Scenario**:
  1. BullMQ worker intercepts failure.
  2. Worker schedules job retry with exponential backoff delay (Attempt 1: 10s, Attempt 2: 30s, Attempt 3: 90s) (`NOTIF-BR-07`).
  3. If all 3 retry attempts fail, worker moves job to Dead Letter Queue (DLQ) and flags status `FAILED` in `notification_db`.
- **Business Rules Referenced**: `NOTIF-BR-06`, `NOTIF-BR-07`.
- **Postconditions**: Notification retried up to 3 times before DLQ movement.
