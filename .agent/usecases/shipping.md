# Shipping Service Use Cases

> **Service Path:** `apps/backend/shipping-service/`  
> **Default Port:** `3008`  
> **Business Rules Reference:** [shipping.md](../business/shipping.md)  

---

### SHIP-UC-01: Calculate Shipping Rate Options

- **Primary Actor**: Customer / Checkout Flow
- **Preconditions**: Items in cart have weight and dimensions.
- **Trigger**: Client sends `POST /api/v1/shipping/calculate-rate` with `originPostalCode`, `destinationPostalCode`, item dimensions, cart subtotal.
- **Main Success Scenario**:
  1. Shipping Service computes billable weight using `MAX(Actual Weight, Volumetric Weight)` formula (`SHIP-BR-02`).
  2. Service checks if `Subtotal >= $100.00` (`SHIP-BR-03`).
  3. If eligible for free shipping, Service sets `Standard Shipping Rate = $0.00`.
  4. Service queries carrier APIs (FedEx, UPS, DHL) for active rates across service tiers (Standard, Express, Overnight).
  5. Service returns `200 OK` with available shipping options, prices, and estimated delivery dates.
- **Business Rules Referenced**: `SHIP-BR-01`, `SHIP-BR-02`, `SHIP-BR-03`.
- **Postconditions**: Shipping rate options list returned.

---

### SHIP-UC-02: Generate Carrier Shipping Label

- **Primary Actor**: Merchant (`SELLER`) / Admin
- **Preconditions**: Order status is `PAID` (`SHIP-BR-04`).
- **Trigger**: Merchant sends `POST /api/v1/shipping/shipments` with `orderId`, `carrierCode`.
- **Main Success Scenario**:
  1. Shipping Service verifies order status is `PAID`.
  2. Service calls selected logistics carrier API to book package dispatch.
  3. Carrier returns unique tracking number (`trackingNumber`) and label payload.
  4. Service generates PDF / ZPL label file and uploads it to object storage via Media Service (`SHIP-BR-06`).
  5. Service creates shipment record in `shipping_db` with status `LABEL_CREATED` (`SHIP-BR-09`).
  6. Service emits `shipping.label_created` event and returns `201 CREATED` with tracking info and label PDF URL.
- **Alternative / Exception Flows**:
  - *Order Not Paid*: Returns `400 BAD_REQUEST` with error `ORDER_NOT_PAID`.
- **Business Rules Referenced**: `SHIP-BR-04`, `SHIP-BR-05`, `SHIP-BR-06`, `SHIP-BR-09`, `SHIP-BR-15`.
- **Postconditions**: Shipment record created, tracking number assigned, shipping label generated.

---

### SHIP-UC-03: Ingest Carrier Real-Time Tracking Update

- **Primary Actor**: Carrier Webhook / System Poller
- **Preconditions**: Active shipment exists with tracking number.
- **Trigger**: Carrier webhook POSTs to `/api/v1/shipping/webhook/{carrier}` with tracking event.
- **Main Success Scenario**:
  1. Shipping Service validates webhook signature.
  2. Service matches tracking number to active shipment in `shipping_db`.
  3. Service updates shipment status (`PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`).
  4. If status transitions to `PICKED_UP` / `IN_TRANSIT`, Service emits `shipping.dispatched` event (`SHIP-BR-16`).
  5. Order Service consumes event and transitions order to `SHIPPED` (`ORD-UC-06`).
  6. Service returns `200 OK`.
- **Business Rules Referenced**: `SHIP-BR-07`, `SHIP-BR-10`, `SHIP-BR-11`, `SHIP-BR-12`, `SHIP-BR-16`.
- **Postconditions**: Shipment status updated, `shipping.dispatched` event emitted.

---

### SHIP-UC-04: Confirm Delivery & Start Return Window

- **Primary Actor**: Carrier Tracking Webhook
- **Preconditions**: Shipment status is `OUT_FOR_DELIVERY` or `IN_TRANSIT`.
- **Trigger**: Carrier webhook confirms package delivered.
- **Main Success Scenario**:
  1. Shipping Service updates shipment status to `DELIVERED` in `shipping_db` (`SHIP-BR-13`).
  2. Service records exact delivery timestamp.
  3. Service emits `shipping.delivered` event (`SHIP-BR-17`).
  4. Order Service consumes event, updates order to `DELIVERED`, and initiates 7-day return window countdown (`ORD-UC-07`).
  5. Notification Service sends delivery confirmation email/SMS to customer.
  6. Service returns `200 OK`.
- **Business Rules Referenced**: `SHIP-BR-08`, `SHIP-BR-13`, `SHIP-BR-17`.
- **Postconditions**: Shipment marked `DELIVERED`, return window started.
