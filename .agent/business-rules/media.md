# Media Service Business Rules

> **Service Path:** `apps/backend/media-service/`  
> **Default Port:** `3011`  
> **Primary Storage:** MinIO / Cloudflare R2 / AWS S3 (`media_bucket`) + PostgreSQL (`media_db`)  
> **Documentation Ref:** [BACKEND_ARCHITECTURE.md](../../docs/02-backend/BACKEND_ARCHITECTURE.md), [API_ARCHITECTURE.md](../../docs/02-backend/API_ARCHITECTURE.md)  

---

## 1. Domain Overview & Purpose
The **Media Service** handles image and document uploads, MIME-type verification, image resizing/thumbnail generation, CDN URL generation, and object storage asset lifecycles.

---

## 2. Core Business Rules & Validations

### Upload Constraints
- **MED-BR-01: Whitelisted MIME Types**:
  - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
  - Documents: `application/pdf` (invoices/labels only).
- **MED-BR-02: Maximum Image File Size**: Product and user avatar images must not exceed **5 MB** per file.
- **MED-BR-03: Maximum Document File Size**: Banners and PDF shipping documents must not exceed **10 MB** per file.
- **MED-BR-04: Magic Byte Header Verification**: In addition to file extensions, initial magic bytes MUST be verified to prevent malicious file uploads (e.g. PHP scripts masked as `.png`).

### Processing & CDN Rules
- **MED-BR-05: Automated WebP Conversion**: All uploaded image assets are automatically converted to **WebP** format for optimal compression and fast web rendering.
- **MED-BR-06: Preset Thumbnail Sizes**:
  - `thumbnail`: 150 x 150 px
  - `medium`: 500 x 500 px
  - `large`: 1200 x 1200 px (original quality retained)
- **MED-BR-07: Public CDN URL Formatting**: Upload endpoints return absolute HTTPS CDN URLs (e.g. `https://cdn.omnicommerce.com/uploads/2026/07/img_123.webp`).

---

## 3. REST API Endpoints & Access Control

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/media/upload` | Authenticated | Upload file asset (`multipart/form-data`) |
| `GET` | `/api/v1/media/{id}/metadata` | Authenticated | Fetch asset dimensions, size, & CDN URLs |
| `DELETE` | `/api/v1/media/{id}` | Owner / Admin | Delete asset file from object storage bucket |

---

## 4. Domain Events Emitted

- **MED-BR-08: Event `media.uploaded`**: Emitted when media upload finishes. Contains CDN URL metadata.
- **MED-BR-09: Event `media.deleted`**: Emitted when asset is deleted from object storage.
