# Routing Architecture

**Document Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-07-27  
**Owner:** Frontend Team

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [Routing Topology & App Router Setup](#2-routing-topology--app-router-setup)
3. [Shell & Microfrontend Route Integration](#3-shell--microfrontend-route-integration)
4. [Route Guarding & Middleware](#4-route-guarding--middleware)
5. [Code Splitting, Loading, & Fallbacks](#5-code-splitting-loading--fallbacks)
6. [Deep Linking & State Navigation](#6-deep-linking--state-navigation)
7. [Internationalization (i18n) Routing](#7-internationalization-i18n-routing)
8. [SEO & Metadata Strategy](#8-seo--metadata-strategy)
9. [References](#9-references)

---

# 1. Introduction

## 1.1 Purpose

This document defines the Routing Architecture for the OmniCommerce frontend platform. It details how URLs, client-side navigation, microfrontend route orchestration, route security guards, and deep-linking mechanisms operate across Next.js applications and Module Federation remotes.

## 1.2 Scope

This document applies to all route handlers, page layouts, microfrontend entry paths, middleware proxies, and navigation links within OmniCommerce.

## 1.3 Objectives

- **Seamless User Experience:** Enable client-side transitions without full-page reloads across independent Microfrontends.
- **Security:** Enforce declarative authentication and role-based route access before page execution.
- **Performance:** Optimize initial load times via route-level code splitting and intelligent prefetching.
- **SEO & Searchability:** Support clean dynamic routing, canonical URLs, and localized meta tags.

---

# 2. Routing Topology & App Router Setup

OmniCommerce utilizes the **Next.js App Router** architecture, leveraging file-system based routing and nested layouts.

## 2.1 File System Route Mapping

```text
apps/shell/app/
├── (auth)/                  # Route group for authentication flows
│   ├── login/
│   │   └── page.tsx         # /login
│   └── register/
│       └── page.tsx         # /register
├── (store)/                 # Route group for e-commerce storefront
│   ├── layout.tsx           # Storefront layout (Header, Footer, Nav)
│   ├── page.tsx             # / (Homepage)
│   ├── products/
│   │   ├── page.tsx         # /products (Catalog listing)
│   │   └── [id]/
│   │       └── page.tsx     # /products/:id (Product Detail Page)
│   ├── cart/
│   │   └── page.tsx         # /cart (Shopping cart)
│   └── checkout/
│       └── page.tsx         # /checkout (Checkout flow)
├── (account)/               # Route group for authenticated account area
│   ├── layout.tsx           # Account dashboard layout with sidebar
│   └── account/
│       ├── profile/page.tsx # /account/profile
│       └── orders/page.tsx  # /account/orders
├── api/                     # BFF Route Handlers
│   └── auth/
│       └── [...nextauth]/route.ts
├── global-error.tsx         # Catch-all error boundary
├── loading.tsx              # Root loading skeleton
├── not-found.tsx            # Global 404 handler
└── middleware.ts            # Auth & localization proxy
```

---

# 3. Shell & Microfrontend Route Integration

The Shell application acts as the primary router router, hosting top-level URL paths and delegating sub-path execution to dynamic Microfrontend remotes.

## 3.1 Microfrontend Route Matrix

| Route Path Prefix | Target Microfrontend | Remote Entry | Host Container |
|-------------------|----------------------|--------------|----------------|
| `/` | Shell App (Host) | Native | Shell Layout |
| `/products/*` | Product Catalog MFE | `productMfe@http://.../remoteEntry.js` | `<ProductMfeContainer />` |
| `/cart` | Cart & Checkout MFE | `checkoutMfe@http://.../remoteEntry.js` | `<CartMfeContainer />` |
| `/checkout/*` | Cart & Checkout MFE | `checkoutMfe@http://.../remoteEntry.js` | `<CheckoutMfeContainer />` |
| `/account/*` | Customer Account MFE | `accountMfe@http://.../remoteEntry.js` | `<AccountMfeContainer />` |

## 3.2 Dynamic Microfrontend Route Mounting Example

```tsx
// app/(store)/products/[...slug]/page.tsx
import dynamic from 'next/dynamic';
import { SkeletonCatalog } from '@/components/skeletons/SkeletonCatalog';

const RemoteProductApp = dynamic(() => import('productMfe/ProductApp'), {
  loading: () => <SkeletonCatalog />,
  ssr: false, // Module Federation client-side mounting
});

export default function ProductMfeRoute({ params }: { params: { slug?: string[] } }) {
  return <RemoteProductApp routePath={params.slug ? `/${params.slug.join('/')}` : '/'} />;
}
```

---

# 4. Route Guarding & Middleware

Route protection occurs at the edge before any React server or client components execute, using Next.js Edge Middleware (`middleware.ts`).

## 4.1 Edge Middleware Flow

```text
Browser Request ──► Next.js Edge Middleware ──► Session Token Valid? 
                                                      ├── Yes ──► Render Route
                                                      └── No  ──► Redirect to /login?redirect=/target
```

## 4.2 Middleware Implementation Example

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/account', '/checkout', '/orders'];
const GUEST_ONLY_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('omni_session_token')?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isGuestOnly = GUEST_ONLY_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL('/account/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*', '/login', '/register'],
};
```

---

# 5. Code Splitting, Loading, & Fallbacks

Next.js automatically splits code by route segment. OmniCommerce uses standardized layout conventions for progressive rendering:

## 5.1 Route Fallback Architecture

- **`loading.tsx`:** Provides visual feedback (skeleton screens) using React Suspense while route server data is fetched.
- **`error.tsx`:** Isolates route runtime exceptions so the rest of the layout remains operational. Provides a reset trigger button (`reset()`).
- **`not-found.tsx`:** Rendered automatically when `notFound()` is invoked in a server component or dynamic parameter is invalid.

```tsx
// app/(store)/products/[id]/error.tsx
'use client';

export default function ProductError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <h2 className="text-xl font-semibold text-destructive">Failed to load product details</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={() => reset()} className="mt-4 btn btn-primary">
        Try Again
      </button>
    </div>
  );
}
```

---

# 6. Deep Linking & State Navigation

Navigation between pages must preserve active query parameters (e.g. search filters, tab indices) when navigating via deep links.

```tsx
import Link from 'next/link';

export function CategoryFilterLink({ categoryId, activeQuery }: { categoryId: string; activeQuery: string }) {
  return (
    <Link
      href={{
        pathname: '/products',
        query: { category: categoryId, q: activeQuery },
      }}
      prefetch={true}
      className="text-sm font-medium hover:underline"
    >
      View Category
    </Link>
  );
}
```

---

# 7. Internationalization (i18n) Routing

OmniCommerce supports multi-locale routing using path-based prefixes (`/[locale]/...`).

```text
/en-US/products/123   --> English (United States)
/id-ID/products/123   --> Indonesian (Indonesia)
```

Locale resolution sequence in middleware:
1. URL locale prefix (if present)
2. `omni_locale` user preference cookie
3. `Accept-Language` HTTP header
4. Default fallback locale (`en-US`)

---

# 8. SEO & Metadata Strategy

Dynamic routes must export `generateMetadata` for SEO search engines.

```typescript
// app/(store)/products/[id]/page.tsx
import type { Metadata } from 'next';
import { fetchProduct } from '@/api/products';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await fetchProduct(params.id);

  return {
    title: `${product.title} | OmniCommerce`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [{ url: product.imageUrl, width: 800, height: 600, alt: product.title }],
    },
    alternates: {
      canonical: `https://omnicommerce.com/products/${params.id}`,
    },
  };
}
```

---

# 9. References

- `FRONTEND_ARCHITECTURE.md`
- `MICROFRONTEND_ARCHITECTURE.md`
- `COMPONENT_ARCHITECTURE.md`
- `STATE_MANAGEMENT.md`
