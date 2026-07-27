# Auth Service Business Rules

> **Service Path:** `apps/backend/auth-service/`  
> **Default Port:** `3001`  
> **Primary Storage:** PostgreSQL (`auth_db`) + Redis (`session_cache`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Auth Service** is the central identity provider for OmniCommerce. It handles user registration, authentication, credential validation, JWT token issuance/rotation, password resets, session management, and token revocation.

---

## 2. Core Business Rules & Validations

### Registration Rules
- **AUTH-BR-01: Email Uniqueness**: Email addresses must be unique across the platform (case-insensitive search before creation).
- **AUTH-BR-02: Email Format Validation**: Must conform to standard RFC 5322 email formatting specifications.
- **AUTH-BR-03: Password Complexity**:
  - Minimum length: 8 characters, maximum length: 64 characters.
  - Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`!@#$%^&*`).
- **AUTH-BR-04: Credential Hashing**: Passwords must be hashed using **Argon2id** (or **Bcrypt** with work factor 12) before database persistence. Plaintext passwords must never be stored, logged, or returned in API responses.
- **AUTH-BR-05: Default Role Assignment**: Newly registered users are assigned the `CUSTOMER` role by default unless registered via the merchant portal (`SELLER`). Admin roles (`ADMIN`, `SUPER_ADMIN`) cannot be self-assigned.
- **AUTH-BR-06: Identity Outbox Emission**: Successful registration must transactionally commit a `user` record and enqueue an `auth.user.registered` domain event in the local outbox table.

### Authentication & Token Rules
- **AUTH-BR-07: Access Token Lifecycle**:
  - JWT Access Token Time-To-Live (TTL): **1 Hour (3600 seconds)**.
  - Signed using RS256 private key (asymmetric signature).
  - Required claims: `sub` (User ID), `email`, `roles`, `permissions`, `iss`, `iat`, `exp`, `jti`.
- **AUTH-BR-08: Refresh Token Storage**:
  - Refresh Token TTL: **7 Days**.
  - Stored securely in `auth_db` as a SHA-256 hashed string alongside device IP, user-agent metadata, and expiration date.
- **AUTH-BR-09: Single-Use Token Rotation**: Executing `POST /api/v1/auth/refresh-token` validates the current refresh token, invalidates it immediately, and issues a new access token and refresh token pair.
- **AUTH-BR-10: Token Reuse Detection**: If a previously revoked or replaced refresh token is submitted, the Auth Service flags a security breach, invalidates ALL active refresh tokens for that user ID, and forces full re-authentication.
- **AUTH-BR-11: Brute Force Account Lockout**:
  - Maximum allowed failed login attempts: **5 consecutive failures** within a 15-minute sliding window per IP/email pair.
  - Exceeding limit locks account authentication for **15 minutes** (HTTP 429 / 401 with lockout metadata).

### Password Reset Rules
- **AUTH-BR-12: Password Reset Token Expiration**: Reset tokens generated via `POST /api/v1/auth/forgot-password` expire **15 minutes** after creation.
- **AUTH-BR-13: Reset Token Single-Use**: Password reset tokens are single-use and deleted immediately upon successful password modification.
- **AUTH-BR-14: Universal Session Revocation**: Changing or resetting a password automatically revokes all active refresh tokens and blacklists active JWT access tokens for that user ID.

---

## 3. Account Lifecycle & Statuses

```text
[REGISTERED] ──► [ACTIVE] ──► [SUSPENDED] (by Admin) ──► [DELETED] (Soft-delete)
```

- **AUTH-BR-15: Account State Enforcement**:
  - **ACTIVE**: Standard operational account state allowing login and token issuance.
  - **SUSPENDED**: Account locked due to security policy or admin action. Authentication requests fail with `403 Account Suspended`.
  - **DELETED**: User requested account removal. Soft-deleted record retained for 30-day legal compliance before hard purge.

---

## 4. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new customer or seller account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate credentials, return JWT tokens |
| `POST` | `/api/v1/auth/refresh-token` | Public (Refresh Token) | Rotate access token and refresh token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke current user refresh token session |
| `POST` | `/api/v1/auth/forgot-password` | Public | Generate & dispatch password reset email link |
| `POST` | `/api/v1/auth/reset-password` | Public (Reset Token) | Set new account password |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch current identity details from JWT context |

---

## 5. Domain Events Emitted

- **AUTH-BR-16: Event `auth.user.registered`**: Emitted when a new account is registered. Triggers welcome email dispatch via Notification Service.
- **AUTH-BR-17: Event `auth.password.changed`**: Emitted on password update. Triggers security alert email.
- **AUTH-BR-18: Event `auth.session.revoked`**: Emitted when user or admin revokes active session.

---

## 6. Caching & Storage Rules
- **AUTH-BR-19: Redis Session Blacklist**: Revoked access token IDs (`jti`) are cached in Redis key `blacklist:jti:{id}` with TTL matching the remaining token expiration time.
- **AUTH-BR-20: Outbox Pattern**: Outbox table `auth_outbox` persists event payload in the same transaction as user creation.
