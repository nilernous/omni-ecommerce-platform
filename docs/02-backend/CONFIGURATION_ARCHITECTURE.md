# Configuration Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** Configuration Software Architecture Document (CSAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Platform Configuration & Secrets Management Layer |
| Primary Framework | NestJS (`@nestjs/config` + `Joi` Validation) |
| Configuration Strategy | 12-Factor App (Environment-Based Externalization) |
| Secrets Management | HashiCorp Vault / Cloud Secrets Manager / K8s Secrets |
| Feature Flagging | LaunchDarkly / Unleash / Redis Feature Toggles |
| Audience | Backend Engineers, Security Engineers, DevOps Engineers, System Architects |

---

# Table of Contents

1. Introduction
   1.1 Purpose  
   1.2 Scope  
   1.3 Intended Audience  
   1.4 Core Design Principles  
2. Configuration Management Topology
   2.1 12-Factor Configuration Principles  
   2.2 Configuration Sources & Hierarchy  
   2.3 Precedence & Resolution Order  
3. NestJS Configuration Architecture
   3.1 Module Design Pattern (`ConfigModule`)  
   3.2 Type-Safe Namespace Registration (`registerAs`)  
   3.3 Fail-Fast Startup Validation (`Joi` Schemas)  
   3.4 Dependency Injection & Usage Patterns  
4. Configuration Taxonomy & Registry
   4.1 Infrastructure Configuration  
   4.2 Application Configuration  
   4.3 Security & Authentication Configuration  
   4.4 Third-Party Integration Configuration  
5. Environment Profiles & Matrices
   5.1 Local Development Profile (`development`)  
   5.2 Automated Testing Profile (`test`)  
   5.3 Staging Profile (`staging`)  
   5.4 Production Profile (`production`)  
   5.5 Environment Configuration Matrix  
6. Secrets Management & Security Controls
   6.1 Zero Plain-Text Secrets Policy  
   6.2 Secret Provisioning Pipelines  
   6.3 Secret Rotation & Lifetime Management  
   6.4 Log Sanitization & Sensitive Attribute Masking  
7. Feature Flagging & Dynamic Configuration
8. Architecture Decision Summary
9. Related Documents
10. Conclusion

---

# 1. Introduction

## 1.1 Purpose

This document defines the **Configuration Architecture** for OmniCommerce. It establishes the standards, validation frameworks, environment hierarchies, secret management protocols, and feature flagging architectures used across all backend microservices.

---

## 1.2 Scope

This specification covers:
- Externalization of application configuration based on 12-Factor App methodology.
- Configuration resolution hierarchy (`process.env`, `.env` files, Secrets Store).
- NestJS `@nestjs/config` integration with type-safe namespaces and `Joi` schema validation.
- Fail-fast startup validation rules.
- Environment profiles (`development`, `test`, `staging`, `production`).
- Secrets management security controls and log redaction.
- Dynamic feature toggling.

---

## 1.3 Intended Audience

This document is intended for Backend Engineers, Security Engineers, DevOps Engineers, and System Architects building microservices and managing deployment environments.

---

## 1.4 Core Design Principles

1. **Strict Externalization**: Configuration MUST be decoupled from source code; binaries remain identical across all environments.
2. **Fail-Fast Startup**: Microservices MUST crash immediately during boot if mandatory configuration or secrets are missing or invalid.
3. **Type Safety & Namespacing**: Configuration properties must be strongly typed and grouped into domain namespaces.
4. **Zero Plain-Text Secrets**: Credentials, private keys, and passwords must never be committed to Git repositories.

---

# 2. Configuration Management Topology

## 2.1 12-Factor Configuration Principles

OmniCommerce enforces **Factor III (Config)** of the 12-Factor App methodology:
- Codebase is completely agnostic of deployment target.
- Configuration varies between deployments (Development, Test, Staging, Production).
- Environment variables (`process.env`) serve as the universal configuration boundary.

---

## 2.2 Configuration Sources & Hierarchy

Configuration values originate from four distinct tiers:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │ Priority 1: Operating System Environment Variables          │ (Container / K8s / OS)
 └──────────────────────────────┬──────────────────────────────┘
                                │ Overrides
 ┌──────────────────────────────▼──────────────────────────────┐
 │ Priority 2: Secret Store / Mounted Volume Secrets           │ (Vault / Cloud Secrets)
 └──────────────────────────────┬──────────────────────────────┘
                                │ Overrides
 ┌──────────────────────────────▼──────────────────────────────┐
 │ Priority 3: Environment Dotenv Files (`.env.{environment}`)  │ (Local Dev / CI)
 └──────────────────────────────┬──────────────────────────────┘
                                │ Overrides
 ┌──────────────────────────────▼──────────────────────────────┐
 │ Priority 4: Application Default Hardcoded Fallbacks         │ (Safe Non-Secret Defaults)
 └─────────────────────────────────────────────────────────────┘
```

---

## 2.3 Precedence & Resolution Order

1. OS environment variables (`export DATABASE_URL=...`) override all other sources.
2. Mounted secret files override local `.env` files.
3. `.env.{environment}` overrides base `.env`.
4. Default fallbacks in TypeScript code apply only if no higher priority source provides a value.

---

# 3. NestJS Configuration Architecture

## 3.1 Module Design Pattern (`ConfigModule`)

Every NestJS microservice imports `@nestjs/config` inside its root `AppModule`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}.local`, `.env.${process.env.NODE_ENV}`, '.env'],
      load: [databaseConfig, authConfig, rabbitmqConfig, redisConfig],
      validationSchema: environmentValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false, // Report ALL missing variables at startup
      },
    }),
  ],
})
export class AppModule {}
```

---

## 3.2 Type-Safe Namespace Registration (`registerAs`)

Configuration settings are grouped into modular, strongly-typed namespaces:

```typescript
// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  name: process.env.DATABASE_NAME || 'omni_db',
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  maxConnections: parseInt(process.env.DATABASE_MAX_CONN || '20', 10),
}));
```

---

## 3.3 Fail-Fast Startup Validation (`Joi` Schemas)

NestJS microservices execute Joi validation during boot. Missing mandatory variables trigger an immediate process termination (`process.exit(1)`):

```typescript
// src/config/env.validation.ts
import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  
  // Mandatory Infrastructure Secrets
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  
  RABBITMQ_URL: Joi.string().uri({ scheme: ['amqp', 'amqps'] }).required(),
  
  // Mandatory Security Secrets
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION_TIME: Joi.string().default('3600s'),
  REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
});
```

---

## 3.4 Dependency Injection & Usage Patterns

Services inject strongly-typed configuration using `@Inject()` and `ConfigType`:

```typescript
@Injectable()
export class DatabaseService {
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly dbConfig: ConfigType<typeof databaseConfig>,
  ) {}

  createPool() {
    console.log(`Connecting to PostgreSQL at ${this.dbConfig.host}:${this.dbConfig.port}`);
  }
}
```

---

# 4. Configuration Taxonomy & Registry

## 4.1 Infrastructure Configuration

| Variable Key | Type | Mandatory | Default Value | Description |
|--------------|------|-----------|---------------+-------------|
| `DATABASE_HOST` | String | Yes | `localhost` | PostgreSQL host address |
| `DATABASE_PORT` | Number | No | `5432` | PostgreSQL port |
| `DATABASE_NAME` | String | Yes | N/A | Microservice database name |
| `REDIS_HOST` | String | Yes | `localhost` | Redis node address |
| `REDIS_PORT` | Number | No | `6379` | Redis port |
| `RABBITMQ_URL` | URI | Yes | N/A | AMQP broker connection URL |

---

## 4.2 Application Configuration

| Variable Key | Type | Mandatory | Default Value | Description |
|--------------|------|-----------|---------------+-------------|
| `NODE_ENV` | Enum | Yes | `development` | Environment tier |
| `PORT` | Number | No | `3000` | HTTP listening port |
| `API_PREFIX` | String | No | `/api/v1` | Public API prefix |
| `CORS_ORIGINS` | Array | Yes | `*` | Allowed CORS origins |
| `LOG_LEVEL` | Enum | No | `info` | Logging verbosity level |

---

## 4.3 Security & Authentication Configuration

| Variable Key | Type | Mandatory | Min Length | Description |
|--------------|------|-----------|------------|-------------|
| `JWT_SECRET` | String | Yes | 32 chars | HMAC key for signing Access Tokens |
| `REFRESH_TOKEN_SECRET` | String | Yes | 32 chars | HMAC key for signing Refresh Tokens |
| `BCRYPT_SALT_ROUNDS` | Number | No | 10 | Password hashing salt iterations |

---

## 4.4 Third-Party Integration Configuration

| Variable Key | Type | Mandatory | Description |
|--------------|------|-----------|-------------|
| `CLOUDFLARE_R2_ACCESS_KEY` | String | Production Only | Storage S3 Access Key |
| `CLOUDFLARE_R2_SECRET_KEY` | String | Production Only | Storage S3 Secret Key |
| `STRIPE_SECRET_KEY` | String | Production Only | Stripe Payment Gateway API Key |
| `SMTP_HOST` | String | Production Only | Email notification server host |

---

# 5. Environment Profiles & Matrices

## 5.1 Local Development Profile (`development`)

- Reads `.env.development` and `.env.local`.
- Enables hot-reloading (`nest start --watch`).
- Connects to local Docker containers (PostgreSQL, Redis, RabbitMQ, MinIO).
- Relaxes CORS and exposes Swagger OpenAPI at `/docs`.

---

## 5.2 Automated Testing Profile (`test`)

- Uses isolated in-memory or ephemeral container instances.
- Fast execution with low salt rounds for bcrypt (`BCRYPT_SALT_ROUNDS=1`).
- Mocks external SMTP and Payment Gateways.

---

## 5.3 Staging Profile (`staging`)

- Mirrors Production architecture (Redis Sentinel, RabbitMQ Cluster, MinIO/R2).
- Validates real Third-Party Sandbox APIs (Stripe Test Keys, Sandbox Carriers).

---

## 5.4 Production Profile (`production`)

- Strict validation: All secrets MUST be injected via Kubernetes Secrets / HashiCorp Vault.
- Swagger `/docs` endpoint disabled.
- Strict CORS whitelist.
- Log level set to `info` or `warn` with JSON formatting.

---

## 5.5 Environment Configuration Matrix

| Feature / Setting | Development | Test | Staging | Production |
|-------------------|-------------|------|---------|------------|
| **Source of Secrets** | `.env.development` | `.env.test` | Secrets Manager | Kubernetes / Vault |
| **Swagger `/docs`** | Enabled | Disabled | Enabled (Basic Auth)| Disabled |
| **Log Format** | Pretty Print | Silent / Minimal | JSON Structured | JSON Structured |
| **CORS Restriction** | Allowed (`*`) | N/A | Restricted Domain | Strict Whitelist |
| **SSL Enforcement** | Optional | Off | Mandatory (TLS 1.3) | Mandatory (TLS 1.3) |

---

# 6. Secrets Management & Security Controls

## 6.1 Zero Plain-Text Secrets Policy

- Secret files (`.env*`) are explicitly barred from Git commit history via `.gitignore`.
- CI/CD pipelines run automated secret scanners (e.g. `gitleaks`) to reject commits containing API keys or private certificates.

```text
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
```

---

## 6.2 Secret Provisioning Pipelines

In production Kubernetes clusters, HashiCorp Vault or Cloud Secret Managers dynamically inject secrets directly into microservice pod environment variables or mounted ephemeral memory volumes (`tmpfs`), avoiding persistent disk writes.

---

## 6.3 Secret Rotation & Lifetime Management

- **JWT Signing Keys**: Rotated every 90 days.
- **Database Credentials**: Rotated automatically every 30 days via Vault database secrets engine.
- Microservices re-read secrets without downtime by listening to OS signals (`SIGUSR2`) or monitoring mounted file secret updates.

---

## 6.4 Log Sanitization & Sensitive Attribute Masking

Application loggers automatically filter and mask sensitive configuration values:

```typescript
// Logger Interceptor Masking Standard
const SENSITIVE_KEYS = ['password', 'secret', 'authorization', 'token', 'key', 'apiKey'];

function sanitizeConfig(config: Record<string, any>) {
  const sanitized = { ...config };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '******** [REDACTED]';
    }
  }
  return sanitized;
}
```

---

# 7. Feature Flagging & Dynamic Configuration

- **Operational Toggles**: Feature flags managed via LaunchDarkly / Redis allow ops teams to toggle background jobs or heavy indexing tasks without redeploying code.
- **Circuit Toggles**: Instantly disable non-critical features (e.g. product recommendations) during extreme peak holiday traffic spikes.

---

# 8. Architecture Decision Summary

| Decision | Selected Option | Rationale |
|----------|-----------------|-----------|
| **Framework** | `@nestjs/config` | Native NestJS integration, module lifecycle support, dependency injection |
| **Validation** | Joi Schemas | Powerful schema rules, custom error messages, fail-fast application boot |
| **Methodology** | 12-Factor App | Ensures binaries remain identical across dev, staging, and production |
| **Secrets Engine** | Vault / K8s Secrets | Eliminates plain-text file storage, supports dynamic rotation |

---

# 9. Related Documents

- [BACKEND_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/BACKEND_ARCHITECTURE.md)
- [API_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/API_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/EVENT_ARCHITECTURE.md)

---

# 10. Conclusion

The OmniCommerce Configuration Architecture establishes a type-safe, environment-decoupled, and secure configuration platform. By enforcing fail-fast startup validations with Joi, injecting secrets securely via cloud secret providers, and automatically redacting sensitive properties in telemetry logs, the platform ensures operational stability and security across all microservice deployment targets.
