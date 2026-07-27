# File Storage Architecture

> **Version:** 1.0.0  
> **Status:** Draft  
> **Document Type:** File Storage Software Architecture Document (FSAD)  
> **Last Updated:** July 2026

---

# Document Information

| Item | Description |
|------|-------------|
| Project | OmniCommerce |
| Layer | Object Storage & Digital Asset Management Layer |
| Primary Technologies | MinIO (Development) / Cloudflare R2 (Production S3-Compatible API) |
| Managing Microservice | Media Service |
| Delivery Network | Cloudflare CDN |
| Audience | Backend Engineers, Security Engineers, DevOps Engineers, System Architects |

---

# Table of Contents

1. Introduction
   1.1 Purpose  
   1.2 Scope  
   1.3 Intended Audience  
   1.4 Core Design Goals  
2. Storage System Architecture & Topology
   2.1 Architecture Overview  
   2.2 Storage Environments (Development vs Production)  
   2.3 Database Metadata Decoupling  
3. Bucket Hierarchy & Asset Categorization
   3.1 Bucket Distribution Standard  
   3.2 Asset Types & Access Rules  
4. Media Upload Workflows
   4.1 Direct Presigned URL Upload Pattern (Primary)  
   4.2 Microservice Proxy Upload Pattern (Fallback)  
   4.3 Upload Sequence Diagram  
5. Security & Access Control
   5.1 Public vs Private Bucket Policies  
   5.2 Presigned URL Security & Expiration  
   5.3 File Integrity & Validation Standards  
6. Asset Processing & Optimization Pipeline
   6.1 Asynchronous Image Processing Pipeline  
   6.2 Image Format Conversion & Compression (WebP)  
   6.3 Multi-Resolution Thumbnail Generation  
7. CDN Integration & Content Delivery
   7.1 Cloudflare CDN Edge Caching  
   7.2 HTTP Caching Headers Policy  
8. Storage Lifecycle & Garbage Collection
   8.1 Soft Deletion & Asset Lifecycle  
   8.2 Async Orphan File Garbage Collection  
9. Observability & Storage Telemetry
   9.1 Storage Utilization Metrics  
   9.2 Prometheus Telemetry & Alerts  
10. Architecture Decision Summary
11. Related Documents
12. Conclusion

---

# 1. Introduction

## 1.1 Purpose

This document defines the **File Storage Architecture** for OmniCommerce. It establishes object storage topologies, bucket hierarchy standards, secure upload workflows, asset optimization pipelines, and CDN delivery policies for digital assets across the platform.

---

## 1.2 Scope

This specification covers:
- Object storage integration (MinIO for dev, Cloudflare R2 for production).
- The central role of `Media Service` and metadata database separation.
- Bucket organization (`omni-products`, `omni-avatars`, `omni-documents`, `omni-promotions`).
- Secure upload workflows (Presigned URLs, file type validation, size limits).
- Image processing (WebP conversion, thumbnail generation, watermarking).
- CDN caching headers and secure private document access.
- Asynchronous asset garbage collection routines.

---

## 1.3 Intended Audience

This document is for Backend Engineers, Media Service Developers, Security Specialists, and DevOps Engineers managing storage assets.

---

## 1.4 Core Design Goals

1. **Decoupled Binary Storage**: Storing raw binary files exclusively in Object Storage while storing metadata in PostgreSQL.
2. **High Delivery Performance**: Serving static assets through global Cloudflare CDN edge locations with sub-50ms latencies.
3. **Security & Validation**: Preventing malicious uploads via strict magic-byte verification and signed presigned URLs.
4. **S3 API Compatibility**: Ensuring seamless portability between local MinIO instances and cloud object storage.

---

# 2. Storage System Architecture & Topology

## 2.1 Architecture Overview

OmniCommerce decouples file management into a dedicated **Media Service**. Client applications upload and consume files directly from Object Storage or CDN edge locations:

```text
                               Cloudflare CDN (Global Edge)
                                             │
                                             ▼
Client App ──► 1. Request Presigned URL ──► Media Service ──► 2. Issue Signed S3 URL
    │                                                            │
    └────────► 3. Upload Binary File Direct ─────────────────────┤
                                                                 ▼
                                                    Object Storage Bucket (R2 / MinIO)
                                                                 │
                                                                 ▼ 4. Emit `MediaUploaded` Event
                                                          RabbitMQ Broker
                                                                 │
                                                                 ▼
                                                  Media Processing Worker
                                                  (Generates WebP & Thumbnails)
```

---

## 2.2 Storage Environments (Development vs Production)

- **Development**: Local **MinIO** container exposing S3-compatible endpoints (`http://localhost:9000`).
- **Production**: **Cloudflare R2** S3-compatible Object Storage (provides zero egress fee data transfer and native Cloudflare CDN integration).

---

## 2.3 Database Metadata Decoupling

Binary objects reside exclusively in Object Storage buckets. PostgreSQL stores file metadata records in `Media Service`:

```json
{
  "id": "med_123456789",
  "bucket": "omni-products",
  "fileKey": "products/2026/07/prd_987654/main.webp",
  "originalName": "headphone_photo.png",
  "mimeType": "image/webp",
  "sizeBytes": 245800,
  "dimensions": { "width": 1200, "height": 1200 },
  "publicUrl": "https://cdn.omnicommerce.com/products/2026/07/prd_987654/main.webp",
  "checksumMd5": "d41d8cd98f00b204e9800998ecf8427e",
  "createdAt": "2026-07-27T14:58:00.000Z"
}
```

---

# 3. Bucket Hierarchy & Asset Categorization

## 3.1 Bucket Distribution Standard

Storage assets are strictly categorized into isolated buckets based on security and access requirements:

| Bucket Name | Access Policy | CDN Cached | Allowed File Types | Max File Size |
|-------------|---------------|------------|--------------------|---------------|
| `omni-products` | Public Read | Yes | WebP, JPEG, PNG | 10 MB |
| `omni-avatars` | Public Read | Yes | WebP, JPEG, PNG | 5 MB |
| `omni-promotions`| Public Read | Yes | WebP, JPEG, PNG, GIF| 15 MB |
| `omni-documents` | Private (Signed URLs Only) | No | PDF, JPEG, PNG | 20 MB |

---

## 3.2 Asset Types & Access Rules

- **Public Assets (Products, Avatars, Banners)**: Accessible directly via public CDN URLs (`https://cdn.omnicommerce.com/*`).
- **Private Assets (Seller Contracts, Financial Invoices)**: Access restricted. Requests require temporary presigned read URLs (`GET` presigned URL valid for 5 minutes).

---

# 4. Media Upload Workflows

## 4.1 Direct Presigned URL Upload Pattern (Primary)

To prevent media uploads from choking API Gateway bandwidth, client applications upload files directly to Object Storage using **S3 Presigned URLs**:

1. Client requests upload authorization: `POST /api/v1/media/presigned-url` with filename, MIME type, and bucket.
2. Media Service validates permissions, generates a unique `fileKey`, and signs an S3 `PUT` Presigned URL (valid for 15 minutes).
3. Client executes HTTP `PUT` directly to the presigned URL with raw binary data.
4. Client notifies Media Service upon completion: `POST /api/v1/media/confirm-upload` to persist database metadata.

---

## 4.2 Microservice Proxy Upload Pattern (Fallback)

For small assets or automated server-to-server file imports, clients upload multipart forms directly to Media Service (`POST /api/v1/media/upload`), which streams the file buffer to Object Storage.

---

# 5. Security & Access Control

## 5.1 Public vs Private Bucket Policies

Buckets enforce strict IAM S3 bucket policies:
- `omni-products` and `omni-avatars` permit `s3:GetObject` for public CDN IPs.
- `omni-documents` denies all public unauthenticated reads.

---

## 5.2 Presigned URL Security & Expiration

- **Upload Presigned URLs (`PUT`)**: Expire after **15 minutes**.
- **Private Document Read URLs (`GET`)**: Expire after **5 minutes**.

---

## 5.3 File Integrity & Validation Standards

Before issuing upload signatures, Media Service enforces:

1. **MIME Type Whitelisting**: Restricts uploads strictly to `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
2. **Magic Byte Inspection**: Workers inspect the initial bytes of uploaded buffers (`0xFF 0xD8 0xFF` for JPEG, `0x89 0x50 0x4E 0x47` for PNG) to detect spoofed file extensions.
3. **Strict Size Limits**: Rejects requests exceeding bucket max file size limits.

---

# 6. Asset Processing & Optimization Pipeline

## 6.1 Asynchronous Image Processing Pipeline

When an image is successfully uploaded, Media Service publishes a `MediaUploaded` domain event:

```text
[ Confirm Upload ] ──► Emit `MediaUploaded` ──► [ RabbitMQ ]
                                                     │
                                                     ▼
                                       [ Media Processing Worker ]
                                                     │
                                 ┌───────────────────┴───────────────────┐
                                 ▼                                       ▼
                       Convert to WebP Format                 Generate Thumbnails
                       (80% Quality Compression)              (150x150, 500x500, 1000x1000)
                                 │                                       │
                                 └───────────────────┬───────────────────┘
                                                     ▼
                                    Save Transformed Variants to Storage
```

---

## 6.2 Image Format Conversion & Compression (WebP)

- Uploaded JPEGs and PNGs are automatically converted to **WebP** format.
- Reduces image file sizes by **30% - 70%** without noticeable visual quality degradation.

---

## 6.3 Multi-Resolution Thumbnail Generation

Product images generate standardized variants:

- `thumbnail`: 150x150 px (Cart & list views).
- `medium`: 500x500 px (Product search grid).
- `large`: 1000x1000 px (Product detail page zoom).

---

# 7. CDN Integration & Content Delivery

## 7.1 Cloudflare CDN Edge Caching

Cloudflare CDN caches all public static assets at edge locations globally:

- **Origin Server**: Cloudflare R2 Object Storage Bucket.
- **Cache Hit Latency**: Sub-30ms global asset load times.

---

## 7.2 HTTP Caching Headers Policy

Media Service returns immutable cache headers for public images:

```text
Cache-Control: public, max-age=31536000, immutable
ETag: "w/checksum-md5-string"
```

---

# 8. Storage Lifecycle & Garbage Collection

## 8.1 Soft Deletion & Asset Lifecycle

When a product or user profile is deleted:
1. Media Service marks database metadata status as `DELETED`.
2. Media Service emits a `MediaDeleted` event.

---

## 8.2 Async Orphan File Garbage Collection

A background cleanup worker consumes `MediaDeleted` events:
1. Issues S3 `DeleteObject` command to remove binary file and its thumbnail variants from Object Storage.
2. Removes metadata record from PostgreSQL database.

---

# 9. Observability & Storage Telemetry

## 9.1 Storage Utilization Metrics

Prometheus tracks:
- `storage_used_bytes{bucket}`: Total storage space occupied per bucket.
- `media_uploads_total{status, mime_type}`: Total successful and failed file uploads.
- `media_processing_duration_seconds`: Time taken for WebP conversion and thumbnail generation.

---

# 10. Architecture Decision Summary

| Decision | Selected Option | Rationale |
|----------|-----------------|-----------|
| **Dev Storage** | MinIO | S3-compatible API, runs locally in Docker |
| **Prod Storage** | Cloudflare R2 | Zero egress fees, high performance, native Cloudflare CDN integration |
| **Upload Flow** | Direct Presigned URLs | Eliminates API Gateway network bottleneck during heavy uploads |
| **Format Standard**| WebP Conversion | Reduces payload sizes by up to 70%, improving mobile loading speeds |

---

# 11. Related Documents

- [BACKEND_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/BACKEND_ARCHITECTURE.md)
- [API_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/API_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](file:///c:/Users/ASUS/Desktop/omni-ecommerce/docs/02-backend/EVENT_ARCHITECTURE.md)

---

# 12. Conclusion

The OmniCommerce File Storage Architecture provides a secure, scalable digital asset management foundation. By utilizing S3 Presigned URLs for direct uploads, converting assets to WebP asynchronously, separating metadata into PostgreSQL, and serving content through Cloudflare CDN, the system guarantees high-speed asset delivery and efficient storage utilization.
