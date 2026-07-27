# User Service Use Cases

> **Service Path:** `apps/backend/user-service/`  
> **Default Port:** `3002`  
> **Business Rules Reference:** [user.md](../business/user.md)  

---

### USER-UC-01: View User Profile

- **Primary Actor**: Authenticated User
- **Preconditions**: User is authenticated with a valid JWT.
- **Trigger**: Client sends `GET /api/v1/users/profile`.
- **Main Success Scenario**:
  1. User Service extracts `userId` from request identity context.
  2. Service queries `user_db` for profile details, preferences, and saved addresses.
  3. Service returns `200 OK` with unified user profile object.
- **Business Rules Referenced**: `USER-BR-01`, `USER-BR-03`, `USER-BR-17`.
- **Postconditions**: User profile payload returned.

---

### USER-UC-02: Update User Profile

- **Primary Actor**: Authenticated User
- **Preconditions**: User is authenticated.
- **Trigger**: Client sends `PATCH /api/v1/users/profile` with `firstName`, `lastName`, `phone`, `avatarUrl`, `gender`, `dateOfBirth`.
- **Main Success Scenario**:
  1. User Service validates input attributes (E.164 phone format, name character lengths, age >= 13).
  2. Service updates `user` record in `user_db`.
  3. Service emits `user.profile.updated` event.
  4. Service returns `200 OK` with updated profile.
- **Alternative / Exception Flows**:
  - *Invalid phone format*: Returns `400 BAD_REQUEST` with validation error.
  - *Age under 13*: Returns `400 BAD_REQUEST` with error `AGE_RESTRICTION`.
- **Business Rules Referenced**: `USER-BR-01`, `USER-BR-02`, `USER-BR-04`, `USER-BR-05`, `USER-BR-14`.
- **Postconditions**: User record updated in DB, event emitted.

---

### USER-UC-03: Add Delivery Address

- **Primary Actor**: Authenticated Customer
- **Preconditions**: User has fewer than 10 saved addresses.
- **Trigger**: Client sends `POST /api/v1/users/addresses` with address payload.
- **Main Success Scenario**:
  1. User Service checks current address count for `userId` in `user_db`.
  2. Service validates required fields (`recipientName`, `streetAddress`, `city`, `state`, `postalCode`, `countryCode`).
  3. If user has 0 addresses OR `isDefault: true` is passed, Service sets `isDefault: true` on new address and clears `isDefault` on previous addresses.
  4. Service persists new address record in `user_db`.
  5. Service emits `user.address.updated` event and returns `201 CREATED`.
- **Alternative / Exception Flows**:
  - *Address Limit Reached (10 addresses)*: Returns `400 BAD_REQUEST` with error `ADDRESS_LIMIT_EXCEEDED`.
- **Business Rules Referenced**: `USER-BR-06`, `USER-BR-07`, `USER-BR-08`, `USER-BR-10`, `USER-BR-15`.
- **Postconditions**: Address added to DB, default address flag adjusted.

---

### USER-UC-04: Update Delivery Address

- **Primary Actor**: Authenticated Customer (Owner)
- **Preconditions**: Address ID exists and belongs to the user.
- **Trigger**: Client sends `PUT /api/v1/users/addresses/{id}` with updated address details.
- **Main Success Scenario**:
  1. User Service verifies address ownership (`address.userId == requester.id`).
  2. Service updates address fields in `user_db`.
  3. If updated to `isDefault: true`, Service clears default flag on all other addresses for user.
  4. Service emits `user.address.updated` event and returns `200 OK`.
- **Alternative / Exception Flows**:
  - *Unauthorized Access*: Returns `403 FORBIDDEN` if address belongs to another user.
- **Business Rules Referenced**: `USER-BR-08`, `USER-BR-10`, `USER-BR-15`, `USER-BR-17`.
- **Postconditions**: Address updated in DB.

---

### USER-UC-05: Delete Delivery Address

- **Primary Actor**: Authenticated Customer (Owner)
- **Preconditions**: Address ID exists and belongs to user.
- **Trigger**: Client sends `DELETE /api/v1/users/addresses/{id}`.
- **Main Success Scenario**:
  1. User Service verifies address ownership.
  2. Service checks if target address is marked `isDefault: true`.
  3. Service deletes address record from `user_db`.
  4. If deleted address was default and remaining addresses exist, Service reassigns `isDefault: true` to the most recently updated remaining address.
  5. Service returns `200 OK`.
- **Business Rules Referenced**: `USER-BR-07`, `USER-BR-09`, `USER-BR-15`, `USER-BR-17`.
- **Postconditions**: Address removed from DB, default flag reassigned if needed.

---

### USER-UC-06: Update Notification Preferences

- **Primary Actor**: Authenticated User
- **Preconditions**: User is logged in.
- **Trigger**: Client sends `PATCH /api/v1/users/preferences` with preference flags.
- **Main Success Scenario**:
  1. User Service updates preference record (`emailEnabled`, `smsEnabled`, `pushEnabled`, `marketingEnabled`) in `user_db`.
  2. Service returns `200 OK` with updated preferences.
- **Business Rules Referenced**: `USER-BR-11`, `USER-BR-12`.
- **Postconditions**: Notification preferences updated in DB.

---

### USER-UC-07: Admin Role & Privilege Assignment

- **Primary Actor**: Platform Admin / Super Admin
- **Preconditions**: Requester possesses `ADMIN` or `SUPER_ADMIN` role.
- **Trigger**: Admin sends `PATCH /api/v1/admin/users/{id}/status` or role modification request.
- **Main Success Scenario**:
  1. User Service validates requester permissions.
  2. Service updates target user's role array (`roles: ['SELLER', 'CUSTOMER']`) or status (`SUSPENDED`).
  3. Service invalidates active user sessions in Auth Service.
  4. Service returns `200 OK`.
- **Business Rules Referenced**: `USER-BR-13`, `USER-BR-17`.
- **Postconditions**: User role/status updated, active sessions invalidated.
