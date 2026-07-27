# User Service Business Rules

> **Service Path:** `apps/backend/user-service/`  
> **Default Port:** `3002`  
> **Primary Storage:** PostgreSQL (`user_db`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **User Service** manages customer and user profile information, contact details, shipping addresses, notification preferences, and role/permission assignment tracking.

---

## 2. Core Business Rules & Validations

### Profile Management Rules
- **USER-BR-01: Profile Data Scope**: Manages `firstName`, `lastName`, `phone`, `avatarUrl`, `gender`, `dateOfBirth`.
- **USER-BR-02: Phone Number Format**: Must be formatted according to E.164 international phone number format (e.g. `+1234567890`).
- **USER-BR-03: User System Identification**: Every user has a unique system ID (`usr_...`) generated at account registration.
- **USER-BR-04: Name Field Constraints**: `firstName` and `lastName` must be between 1 and 50 characters each; special symbols and script tags are sanitized.
- **USER-BR-05: Date of Birth Validation**: If provided, `dateOfBirth` must be a valid past date establishing minimum age of **13 years**.

### Delivery Address Rules
- **USER-BR-06: Address Storage Limit**: A single user account can store a maximum of **10 delivery addresses**. Attempting to add an 11th address returns `400 BAD_REQUEST`.
- **USER-BR-07: Default Address Assignment**: Exactly **1 address** must be designated as `isDefault: true` per user whenever 1 or more addresses exist.
- **USER-BR-08: Default Address Switching**: Creating or updating an address marked as `isDefault: true` automatically sets `isDefault: false` on all previously existing addresses for that user.
- **USER-BR-09: Default Address Deletion**: Deleting the default address automatically reassigns default status (`isDefault: true`) to the most recently updated remaining address.
- **USER-BR-10: Required Address Fields**: Delivery addresses must specify `recipientName`, `phoneNumber`, `streetAddress`, `city`, `state`, `postalCode`, and ISO 3166-1 alpha-2 `countryCode`.

### Preferences & Roles Rules
- **USER-BR-11: Notification Preferences Defaults**: New user accounts default to `emailEnabled: true`, `smsEnabled: true`, `pushEnabled: true`, `marketingEnabled: true`.
- **USER-BR-12: Marketing Opt-Out Isolation**: Updating `marketingEnabled: false` revokes promotional emails without affecting transactional order notifications.
- **USER-BR-13: Role Privilege Governance**: Available Roles: `CUSTOMER`, `SELLER`, `ADMIN`, `SUPER_ADMIN`. Modifying user roles is restricted strictly to accounts possessing `ADMIN` or `SUPER_ADMIN` authorization.

---

## 3. Address & User Entity Rules

```text
User Entity (1) ──── (0..10) Delivery Address Entities
  │
  └─── (1) User Preferences Record
```

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/profile` | Authenticated | Retrieve current user's profile |
| `PATCH` | `/api/v1/users/profile` | Authenticated | Update user profile details |
| `GET` | `/api/v1/users/addresses` | Authenticated | List all saved delivery addresses for user |
| `POST` | `/api/v1/users/addresses` | Authenticated | Add new delivery address (max 10) |
| `PUT` | `/api/v1/users/addresses/{id}` | Authenticated (Owner) | Update existing address details |
| `DELETE` | `/api/v1/users/addresses/{id}` | Authenticated (Owner) | Remove a delivery address |
| `PATCH` | `/api/v1/users/preferences` | Authenticated | Update notification & marketing preferences |

---

## 5. Domain Events Emitted & Consumed

### Emitted Events
- **USER-BR-14: Event `user.profile.updated`**: Emitted when user updates contact or profile info.
- **USER-BR-15: Event `user.address.updated`**: Emitted when shipping addresses are added, modified, or set as default.

### Consumed Events
- **USER-BR-16: Event `auth.user.registered`**: Triggers initial user profile and preference record creation in `user_db`.

---

## 6. Security & Authorization Rules
- **USER-BR-17: Resource Ownership Enforcement**: Users can only read, edit, or delete their own profile and address entities unless the requester possesses `ADMIN` or `SUPER_ADMIN` permissions.
