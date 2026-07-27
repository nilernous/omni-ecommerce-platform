# Media Service Use Cases

> **Service Path:** `apps/backend/media-service/`  
> **Default Port:** `3011`  
> **Business Rules Reference:** [media.md](../business/media.md)  

---

### MED-UC-01: Upload Media File Asset

- **Primary Actor**: Authenticated Seller / Admin / User
- **Preconditions**: File is uploaded as `multipart/form-data`.
- **Trigger**: Client sends `POST /api/v1/media/upload` with file attachment and folder scope (`products`, `avatars`, `banners`).
- **Main Success Scenario**:
  1. Media Service validates file MIME type against whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) (`MED-BR-01`).
  2. Service checks file size limit (max 5MB for images, max 10MB for documents) (`MED-BR-02`, `MED-BR-03`).
  3. Service inspects file binary header magic bytes to verify genuine file format (`MED-BR-04`).
  4. Service converts image files to **WebP** format (`MED-BR-05`).
  5. Service generates image thumbnail variants: `thumbnail` (150x150), `medium` (500x500), `large` (1200x1200) (`MED-BR-06`).
  6. Service uploads converted assets to object storage bucket (MinIO / Cloudflare R2 / S3).
  7. Service saves media record in `media_db` and formats public CDN HTTPS URLs (`MED-BR-07`).
  8. Service emits `media.uploaded` event and returns `201 CREATED` with asset details and CDN URLs.
- **Alternative / Exception Flows**:
  - *MIME or Magic Byte Validation Fails*: Returns `400 BAD_REQUEST` with error `UNSUPPORTED_FILE_TYPE`.
  - *File Size Exceeded*: Returns `400 BAD_REQUEST` with error `FILE_SIZE_EXCEEDED`.
- **Business Rules Referenced**: `MED-BR-01`, `MED-BR-02`, `MED-BR-03`, `MED-BR-04`, `MED-BR-05`, `MED-BR-06`, `MED-BR-07`, `MED-BR-08`.
- **Postconditions**: Assets stored in bucket, media metadata saved in DB, CDN URLs returned.

---

### MED-UC-02: Retrieve Media Asset Metadata

- **Primary Actor**: Authenticated User / Internal Microservice
- **Preconditions**: Media asset ID exists in DB.
- **Trigger**: Client sends `GET /api/v1/media/{id}/metadata`.
- **Main Success Scenario**:
  1. Media Service queries `media_db` for asset record by ID.
  2. Service returns `200 OK` with asset file dimensions, MIME type, size, upload date, and CDN URLs array.
- **Business Rules Referenced**: `MED-BR-07`.
- **Postconditions**: Asset metadata returned.

---

### MED-UC-03: Delete Media Asset

- **Primary Actor**: Asset Owner / Admin
- **Preconditions**: Media asset exists in DB.
- **Trigger**: Client sends `DELETE /api/v1/media/{id}`.
- **Main Success Scenario**:
  1. Media Service verifies asset ownership or admin permission.
  2. Service deletes original file and thumbnail variants from object storage bucket.
  3. Service deletes media record from `media_db`.
  4. Service emits `media.deleted` event and returns `200 OK`.
- **Business Rules Referenced**: `MED-BR-09`.
- **Postconditions**: File objects removed from storage bucket, DB record deleted.
