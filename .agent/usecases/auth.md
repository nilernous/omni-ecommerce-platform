# Auth Service Use Cases

> **Service Path:** `apps/backend/auth-service/`  
> **Default Port:** `3001`  
> **Business Rules Reference:** [auth.md](../business/auth.md)  

---

### AUTH-UC-01: User Registration

- **Primary Actor**: Anonymous Customer / Seller applicant
- **Preconditions**: User possesses a valid email address and meets password criteria.
- **Trigger**: Client sends `POST /api/v1/auth/register` with email, password, firstName, lastName.
- **Main Success Scenario**:
  1. Auth Service validates email format and password complexity.
  2. Service queries `auth_db` to ensure email is not already registered.
  3. Service hashes plaintext password using Argon2id / Bcrypt.
  4. Service inserts new `user` record into `auth_db` with `role: CUSTOMER` (or `SELLER`).
  5. Service writes an outbox record for `auth.user.registered` domain event within the same database transaction.
  6. Service generates initial JWT access token (1h) and refresh token (7d).
  7. Service returns `201 CREATED` with user profile payload and token pair in standard envelope.
- **Alternative / Exception Flows**:
  - *Email already exists*: System returns `409 CONFLICT` with error `EMAIL_ALREADY_REGISTERED`.
  - *Password fails complexity*: System returns `400 BAD_REQUEST` with validation details.
- **Business Rules Referenced**: `AUTH-BR-01`, `AUTH-BR-02`, `AUTH-BR-03`, `AUTH-BR-04`, `AUTH-BR-05`, `AUTH-BR-06`, `AUTH-BR-07`.
- **Postconditions**: User record created in DB, event `auth.user.registered` queued in outbox.

---

### AUTH-UC-02: User Credential Login

- **Primary Actor**: Customer / Seller / Admin
- **Preconditions**: User has an existing active account in the system.
- **Trigger**: Client sends `POST /api/v1/auth/login` with email and password.
- **Main Success Scenario**:
  1. Auth Service fetches account record by email from `auth_db`.
  2. Service verifies account status is `ACTIVE`.
  3. Service verifies password hash against provided plaintext password.
  4. Service resets failed login counter to 0 in Redis.
  5. Service generates RS256-signed JWT Access Token (1h) and Refresh Token (7d).
  6. Service persists hashed Refresh Token string in `auth_db` with device IP and User-Agent metadata.
  7. Service returns `200 OK` with user info, access token, and refresh token cookie/payload.
- **Alternative / Exception Flows**:
  - *Invalid Credentials*: System increments failed login attempt counter in Redis and returns `401 UNAUTHORIZED`.
  - *Consecutive Failures >= 5*: Account authentication is locked out for 15 minutes; returns `429 TOO_MANY_REQUESTS`.
  - *Account Suspended*: Returns `403 FORBIDDEN` with error `ACCOUNT_SUSPENDED`.
- **Business Rules Referenced**: `AUTH-BR-04`, `AUTH-BR-07`, `AUTH-BR-08`, `AUTH-BR-11`, `AUTH-BR-15`.
- **Postconditions**: Active session recorded in DB, JWT tokens delivered to client.

---

### AUTH-UC-03: Access & Refresh Token Rotation

- **Primary Actor**: Client Application (Web / Mobile)
- **Preconditions**: Client possesses a valid, non-expired refresh token.
- **Trigger**: Client sends `POST /api/v1/auth/refresh-token` with refresh token payload or cookie.
- **Main Success Scenario**:
  1. Auth Service hashes incoming refresh token string.
  2. Service queries `auth_db` for active refresh token session.
  3. Service checks token expiration date (`exp > NOW`) and ensures token status is not revoked.
  4. Service revokes current refresh token session record in DB.
  5. Service issues a brand new JWT Access Token (1h) and new Refresh Token (7d).
  6. Service persists new Refresh Token record in DB and returns `200 OK` with rotated tokens.
- **Alternative / Exception Flows**:
  - *Revoked Token Submitted (Security Breach)*: Auth Service revokes ALL active sessions for that user ID and returns `401 UNAUTHORIZED`.
  - *Expired Token*: System returns `401 UNAUTHORIZED` with error `REFRESH_TOKEN_EXPIRED`.
- **Business Rules Referenced**: `AUTH-BR-07`, `AUTH-BR-08`, `AUTH-BR-09`, `AUTH-BR-10`.
- **Postconditions**: Old refresh token revoked, new token pair issued.

---

### AUTH-UC-04: User Logout & Session Revocation

- **Primary Actor**: Authenticated User
- **Preconditions**: User is logged in with valid bearer token.
- **Trigger**: Client sends `POST /api/v1/auth/logout`.
- **Main Success Scenario**:
  1. Auth Service extracts `jti` (JWT ID) from access token and user session context.
  2. Service invalidates the corresponding refresh token in `auth_db`.
  3. Service pushes access token `jti` to Redis blacklist with TTL matching remaining token lifespan.
  4. Service returns `200 OK` with confirmation message.
- **Business Rules Referenced**: `AUTH-BR-08`, `AUTH-BR-19`.
- **Postconditions**: Active session revoked in DB, access token blacklisted in Redis.

---

### AUTH-UC-05: Forgot Password Email Request

- **Primary Actor**: Customer / Seller
- **Preconditions**: User registered an email account.
- **Trigger**: Client sends `POST /api/v1/auth/forgot-password` with email.
- **Main Success Scenario**:
  1. Auth Service checks if email exists in `auth_db`.
  2. If found, Service generates a cryptographically secure 15-minute reset token.
  3. Service writes reset token record to DB and enqueues `auth.password.reset_requested` outbox event.
  4. Notification Service consumes event and emails password reset link to user.
  5. Service returns `200 OK` (returns generic success response even if email is not found to prevent email enumeration).
- **Business Rules Referenced**: `AUTH-BR-12`.
- **Postconditions**: Reset token generated and saved in DB; reset link email queued.

---

### AUTH-UC-06: Reset Password Submission

- **Primary Actor**: Customer / Seller
- **Preconditions**: User clicked valid reset link from email.
- **Trigger**: Client sends `POST /api/v1/auth/reset-password` with reset token and new password.
- **Main Success Scenario**:
  1. Auth Service validates reset token in `auth_db` (`NOW <= expiresAt` and `used = false`).
  2. Service validates new password against complexity rules (`AUTH-BR-03`).
  3. Service hashes new password using Argon2id/Bcrypt and updates `user` record in `auth_db`.
  4. Service marks reset token as `used: true`.
  5. Service revokes ALL active sessions/refresh tokens for that user ID.
  6. Service emits `auth.password.changed` event and returns `200 OK`.
- **Alternative / Exception Flows**:
  - *Expired or Invalid Token*: Returns `400 BAD_REQUEST` with error `INVALID_RESET_TOKEN`.
- **Business Rules Referenced**: `AUTH-BR-03`, `AUTH-BR-04`, `AUTH-BR-12`, `AUTH-BR-13`, `AUTH-BR-14`, `AUTH-BR-17`.
- **Postconditions**: Password updated in DB, all active user sessions revoked.
