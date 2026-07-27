# State Management Architecture

**Document Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-07-27  
**Owner:** Frontend Team

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [State Taxonomy & Classification](#2-state-taxonomy--classification)
3. [Global Client State Architecture (Zustand)](#3-global-client-state-architecture-zustand)
4. [Server State Architecture (TanStack Query)](#4-server-state-architecture-tanstack-query)
5. [Form State & Validation (React Hook Form + Zod)](#5-form-state--validation-react-hook-form--zod)
6. [URL State & Search Parameters](#6-url-state--search-parameters)
7. [Cross-Microfrontend State Sharing](#7-cross-microfrontend-state-sharing)
8. [Persistence & Security](#8-persistence--security)
9. [References](#9-references)

---

# 1. Introduction

## 1.1 Purpose

This document specifies the State Management Architecture for the OmniCommerce frontend platform. It establishes clear boundaries, technology standards, data flows, and performance rules for managing state across client applications and Microfrontend (MFE) modules.

## 1.2 Scope

This document covers all state layers within OmniCommerce applications, including local component state, global client stores, server cache state, form management, URL parameters, and cross-MFE event communication.

## 1.3 Objectives

- **Predictability:** Single source of truth per state domain with strict unidirectional data flow.
- **Separation of Concerns:** Clear demarcation between server-cached data and client UI state.
- **Performance:** Minimizing component re-renders through atomic state selection and targeted cache invalidation.
- **Microfrontend Isolation:** Preventing unintended global state pollution across independent MFE modules.

---

# 2. State Taxonomy & Classification

OmniCommerce classifies state into six distinct categories:

```text
┌─────────────────────────────────────────────────────────┐
│                    Server State                         │  TanStack Query v5
├─────────────────────────────────────────────────────────┤
│                 Global Client State                     │  Zustand Stores
├─────────────────────────────────────────────────────────┤
│                    Form State                           │  React Hook Form + Zod
├─────────────────────────────────────────────────────────┤
│                    URL State                            │  nuqs / Next searchParams
├─────────────────────────────────────────────────────────┤
│                    Local UI State                       │  useState / useReducer
├─────────────────────────────────────────────────────────┤
│                 Persistent State                        │  IndexedDB / LocalStorage
└─────────────────────────────────────────────────────────┘
```

## 2.1 State Matrix

| State Type | Primary Technology | Lifetime | Scope | Example Use Case |
|------------|-------------------|----------|-------|------------------|
| **Local UI State** | React `useState` / `useReducer` | Component Lifecycle | Single Component | Modal visibility, dropdown toggle |
| **Global Client State** | Zustand | Session / Tab | Application / Global | Active theme, sidebar collapsed, cart drawer open |
| **Server State** | TanStack Query v5 | Cache TTL | Application-wide | Product catalog, user profile, order details |
| **Form State** | React Hook Form + Zod | Form Lifecycle | Form Component Subtree | Checkout form inputs, address validation |
| **URL State** | `nuqs` / Next Router | URL / History | Page / Route | Search filters, page index, sorting order |
| **Persistent State** | IndexedDB (`idb-keyval`) | Cross-Session | Browser | Guest cart backup, recently viewed items |

---

# 3. Global Client State Architecture (Zustand)

Global client state represents ephemeral client data that must be accessible across multiple distant components but is **not** sourced directly from server API responses.

## 3.1 Store Organization

Client stores are organized into domain-specific slices:

```text
src/stores/
├── useUIStore.ts         # Modals, sidebars, toast notifications
├── useCartStore.ts       # Guest cart state & client drawer interactions
└── useAuthStore.ts       # Active user session state & token metadata
```

## 3.2 Slice Definition Example

```typescript
// stores/useUIStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  activeTheme: 'light' | 'dark' | 'system';
  openCart: () => void;
  closeCart: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isCartOpen: false,
      isSearchOpen: false,
      activeTheme: 'system',
      openCart: () => set({ isCartOpen: true }, false, 'ui/openCart'),
      closeCart: () => set({ isCartOpen: false }, false, 'ui/closeCart'),
      setTheme: (theme) => set({ activeTheme: theme }, false, 'ui/setTheme'),
    }),
    { name: 'UIStore' }
  )
);
```

## 3.3 Atomic State Selectors

To prevent unnecessary re-renders, components **must** select state atomically rather than consuming the whole store object.

```tsx
// ❌ Bad: Causes re-render on any UIStore change
const { isCartOpen, openCart } = useUIStore();

// ✅ Good: Atomic selectors ensure component only renders when isCartOpen changes
const isCartOpen = useUIStore((state) => state.isCartOpen);
const openCart = useUIStore((state) => state.openCart);
```

---

# 4. Server State Architecture (TanStack Query)

Server state (data residing on backend services) must be managed using **TanStack Query v5**. Direct storage of server API payloads in Zustand or Redux is strictly prohibited.

## 4.1 Query Key Factory Pattern

All query keys must be generated using deterministic key factories to ensure consistent cache invalidation.

```typescript
// features/products/queries.ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
```

## 4.2 Query Hook Example

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProductById, updateProductRating } from '@/api/products';
import { productKeys } from './queries';

export function useProduct(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProductById(productId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });
}
```

## 4.3 Optimistic Updates Pattern

```typescript
export function useUpdateRating(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newRating: number) => updateProductRating(productId, newRating),
    onMutate: async (newRating) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(productId) });
      const previousProduct = queryClient.getQueryData(productKeys.detail(productId));

      queryClient.setQueryData(productKeys.detail(productId), (old: any) => ({
        ...old,
        rating: newRating,
      }));

      return { previousProduct };
    },
    onError: (err, newRating, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(productId), context.previousProduct);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}
```

---

# 5. Form State & Validation (React Hook Form + Zod)

All interactive forms must combine **React Hook Form** for input state tracking with **Zod** for schema validation.

```typescript
// schemas/checkout.ts
import { z } from 'zod';

export const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  shippingAddress: z.object({
    street: z.string().min(3, 'Street is required'),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
```

---

# 6. URL State & Search Parameters

Search terms, pagination indices, sort orders, and active filter facets must be synchronized with the browser URL.

```tsx
// Using 'nuqs' for type-safe search parameters
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export function ProductCatalogFilter() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value || null)} placeholder="Search..." />
      <button onClick={() => setPage(page + 1)}>Next Page ({page})</button>
    </div>
  );
}
```

---

# 7. Cross-Microfrontend State Sharing

Microfrontends must remain decoupled. Sharing state across MFE boundaries must occur exclusively through **Custom DOM Events** or an **Event Bus**.

```typescript
// shared/eventBus.ts
export interface CartItemAddedEvent {
  productId: string;
  quantity: number;
}

export function publishCartItemAdded(detail: CartItemAddedEvent) {
  window.dispatchEvent(new CustomEvent('omni:cart:item-added', { detail }));
}

export function subscribeCartItemAdded(callback: (detail: CartItemAddedEvent) => void) {
  const handler = (e: Event) => callback((e as CustomEvent<CartItemAddedEvent>).detail);
  window.addEventListener('omni:cart:item-added', handler);
  return () => window.removeEventListener('omni:cart:item-added', handler);
}
```

---

# 8. Persistence & Security

## 8.1 Sensitive Token Security

- Access JWTs must **never** be stored in `localStorage` or `sessionStorage` due to XSS vulnerability risks.
- Session tokens are maintained via `HttpOnly`, `SameSite=Strict`, `Secure` cookies managed by the BFF.

## 8.2 Persistent Caching

Non-sensitive data (e.g., offline cart backup, recent search queries) is stored in **IndexedDB** using `idb-keyval`.

---

# 9. References

- `FRONTEND_ARCHITECTURE.md`
- `MICROFRONTEND_ARCHITECTURE.md`
- `COMPONENT_ARCHITECTURE.md`
- `API_ARCHITECTURE.md`
