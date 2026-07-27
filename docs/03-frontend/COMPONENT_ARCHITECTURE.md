# Component Architecture

**Document Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-07-27  
**Owner:** Frontend Team

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [Component Design Principles](#2-component-design-principles)
3. [Component Taxonomy & Hierarchy](#3-component-taxonomy--hierarchy)
4. [Server Components vs Client Components](#4-server-components-vs-client-components)
5. [Component Composition Patterns](#5-component-composition-patterns)
6. [Component Interface & Prop Contracts](#6-component-interface--prop-contracts)
7. [Performance & Render Optimization](#7-performance--render-optimization)
8. [Accessibility & Standards](#8-accessibility--standards)
9. [Component Testing & Quality Assurance](#9-component-testing--quality-assurance)
10. [Component Lifecycle & Maintenance](#10-component-lifecycle--maintenance)
11. [References](#11-references)

---

# 1. Introduction

## 1.1 Purpose

This document defines the Component Architecture for the OmniCommerce frontend platform. It establishes standardized patterns, architectural rules, taxonomies, and performance guidelines for constructing React and Next.js components across both the core monolith and distributed Microfrontend (MFE) applications.

## 1.2 Scope

This document applies to all UI components developed within the OmniCommerce repository, including:
- Shared design system components (`@omni/design-system`)
- Business domain components inside individual Microfrontends
- Page and layout components in Next.js App Router applications
- Shell composition wrappers and integration slots

## 1.3 Audience

| Role | Responsibility |
|------|----------------|
| Frontend Engineers | Write component logic, props, and UI presentation |
| Technical Leads | Review component structure and architectural compliance |
| UI/UX Designers | Partner on component design system tokens and variants |
| QA Engineers | Validate component accessibility and behavior |

## 1.4 Objectives

- **Consistency:** Ensure uniform look, feel, and behavior across all applications.
- **Maintainability:** Keep component responsibilities localized, predictable, and easy to refactor.
- **Performance:** Eliminate unnecessary re-renders, reduce bundle sizes, and optimize Next.js Server Components.
- **Accessibility:** Guarantee WCAG 2.1 AA compliance across all user-facing components.

---

# 2. Component Design Principles

## 2.1 Single Responsibility Principle (SRP)

Every component must have a single, clearly defined purpose. A component should either:
1. Render a specific piece of UI (Presentational), or
2. Manage state/data integration for a sub-tree (Container), or
3. Provide context/layout structure (Wrapper).

```tsx
// ❌ Bad: Component handles data fetching, business logic, state, and rendering
export function BadUserProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch('/api/user').then(r => r.json()).then(setUser); }, []);
  if (!user) return <Spinner />;
  return <div><h1>{user.name}</h1><button onClick={() => updateStatus(user.id)}>Active</button></div>;
}

// ✅ Good: Separation into Container & Presentational Components
export function UserProfileContainer({ userId }: { userId: string }) {
  const { user, updateStatus, isLoading } = useUser(userId);
  if (isLoading || !user) return <UserProfileSkeleton />;
  return <UserProfileCard user={user} onUpdateStatus={updateStatus} />;
}
```

## 2.2 Composition Over Inheritance

React components must favor composition via `children`, slots, and compound component interfaces over complex conditional flags or class inheritance.

## 2.3 Dumb (Presentational) vs. Smart (Container) Components

- **Presentational Components:** Pure UI functions. They rely exclusively on `props`, contain no direct API/server side-effects, and are highly reusable.
- **Container Components:** Responsible for hook invocations, server state management (TanStack Query), global stores (Zustand), and delegating props to presentational children.

---

# 3. Component Taxonomy & Hierarchy

OmniCommerce adapts the **Atomic Design Methodology** to structure frontend assets into six distinct layers:

```text
┌─────────────────────────────────────────────────────────┐
│                    Page Components                      │
├─────────────────────────────────────────────────────────┤
│                   Template Layouts                      │
├─────────────────────────────────────────────────────────┤
│                   Feature Organisms                     │
├─────────────────────────────────────────────────────────┤
│                   Domain Molecules                      │
├─────────────────────────────────────────────────────────┤
│                    UI Base Atoms                        │
├─────────────────────────────────────────────────────────┤
│                   Design Primitives                     │
└─────────────────────────────────────────────────────────┘
```

## 3.1 Taxonomy Classification Table

| Layer | Type | Responsibility | Example | Location |
|-------|------|----------------|---------|----------|
| 1 | **Primitives** | Low-level design tokens (CSS/Tailwind variables) | `colors`, `spacing`, `shadows` | `@omni/design-system/tokens` |
| 2 | **Atoms** | Unstyled/Base interactive UI building blocks | `Button`, `Input`, `Badge`, `Icon` | `@omni/design-system/atoms` |
| 3 | **Molecules** | Combinations of atoms forming functional units | `SearchInput`, `FormField`, `PriceDisplay` | `@omni/design-system/molecules` |
| 4 | **Organisms** | Complex self-contained domain UI sections | `ProductCard`, `MiniCart`, `Navbar` | `packages/ui` or `mfe-*/components` |
| 5 | **Templates** | Page layout structures without concrete data | `CheckoutLayout`, `CatalogGrid` | `apps/shell/layouts` |
| 6 | **Pages** | Next.js routes executing data fetch & composition | `ProductDetailPage`, `CartPage` | `apps/*/app/(routes)` |

---

# 4. Server Components vs Client Components

Next.js App Router enforces a clear boundary between Server Components (RSC) and Client Components.

## 4.1 Decision Matrix

| Requirement | Server Component (RSC) | Client Component (`'use client'`) |
|-------------|------------------------|-----------------------------------|
| Fetch data directly from DB/BFF | ✅ Yes | ❌ No |
| Access backend resources directly | ✅ Yes | ❌ No |
| Keep sensitive tokens on server | ✅ Yes | ❌ No |
| Interactivity (`onClick`, `onChange`) | ❌ No | ✅ Yes |
| State and Lifecycle (`useState`, `useEffect`) | ❌ No | ✅ Yes |
| Browser APIs (`window`, `localStorage`) | ❌ No | ✅ Yes |
| Custom React Hooks | ❌ No | ✅ Yes |

## 4.2 Serialization Boundary Pattern

When passing props from a Server Component to a Client Component, all prop values must be serializable to JSON.

```tsx
// app/product/[id]/page.tsx (Server Component)
import { fetchProduct } from '@/lib/api';
import { AddToCartButton } from '@/components/AddToCartButton'; // Client Component

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="text-gray-600">{product.description}</p>
      {/* Passing serializable primitive/object props to Client Component */}
      <AddToCartButton productId={product.id} price={product.price} stock={product.stock} />
    </main>
  );
}
```

---

# 5. Component Composition Patterns

## 5.1 Compound Components Pattern

Used for complex UI components with shared internal state (e.g., `Accordion`, `Select`, `Modal`, `Tabs`).

```tsx
// components/Accordion.tsx
import React, { createContext, useContext, useState } from 'react';

const AccordionContext = createContext<{ openId: string | null; toggle: (id: string) => void } | null>(null);

export function Accordion({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(current => (current === id ? null : id));

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div className="divide-y divide-border rounded-lg border">{children}</div>
    </AccordionContext.Provider>
  );
}

Accordion.Item = function AccordionItem({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionItem must be used within Accordion');
  const isOpen = ctx.openId === id;

  return (
    <div>
      <button onClick={() => ctx.toggle(id)} className="w-full py-3 px-4 text-left font-medium flex justify-between">
        {title} <span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="p-4 bg-muted/50">{children}</div>}
    </div>
  );
};
```

---

# 6. Component Interface & Prop Contracts

## 6.1 Strict TypeScript Definitions

Every component must export an explicit TypeScript `interface` or `type` for its props.

```tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant styling */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Size options */
  size?: 'sm' | 'md' | 'lg';
  /** Shows loading spinner and disables interaction */
  isLoading?: boolean;
  /** Optional icon prefix */
  leftIcon?: React.ReactNode;
}
```

## 6.2 Discriminated Unions for Conditional Props

Avoid ambiguous props where certain flags are only valid when other props exist.

```tsx
// ✅ Discriminated Union prevents invalid prop combinations
type AlertProps =
  | { variant: 'info' | 'warning'; dismissible?: boolean; onDismiss?: () => void }
  | { variant: 'error'; retryable: true; onRetry: () => void };

export function Alert(props: AlertProps) {
  // TypeScript guarantees onRetry is available when variant is 'error'
  return <div className={`alert alert-${props.variant}`}>...</div>;
}
```

---

# 7. Performance & Render Optimization

## 7.1 Memoization Guidelines

- Do **not** memoize blindly. Use `React.memo` only when a component renders frequently with identical props or resides in large lists.
- Wrap expensive callbacks in `useCallback` when passed as props to memoized children.
- Wrap heavy computations in `useMemo`.

```tsx
export const ProductListItem = React.memo(function ProductListItem({ product, onSelect }: ProductListItemProps) {
  return (
    <div onClick={() => onSelect(product.id)} className="hover:bg-accent p-4 rounded-md">
      <h3>{product.name}</h3>
      <span>${product.price}</span>
    </div>
  );
});
```

## 7.2 Dynamic Imports & Code Splitting

Heavy components (e.g., Rich Text Editors, Charting Libraries, Modals) must be lazy-loaded using `next/dynamic` or `React.lazy`.

```tsx
import dynamic from 'next/dynamic';

const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

---

# 8. Accessibility & Standards

All components must comply with **WCAG 2.1 AA** standards.

## 8.1 Key Requirements

1. **Semantic HTML:** Use `<button>`, `<nav>`, `<header>`, `<main>`, `<article>` instead of clickable `<div>` elements.
2. **Keyboard Navigation:** Ensure interactive elements receive visible focus indicators (`focus-visible:ring-2`) and respond to `Enter` and `Space`.
3. **ARIA Attributes:** Provide explicit `aria-label`, `aria-expanded`, and `aria-hidden` attributes where semantics are insufficient.
4. **Color Contrast:** Text must meet minimum 4.5:1 contrast against its background.

---

# 9. Component Testing & Quality Assurance

```text
                      ┌──────────────────────┐
                      │   E2E Tests (Cypress)│
                      ├──────────────────────┤
                      │ Integration (RTL)    │
                      ├──────────────────────┤
                      │ Component Unit Tests │
                      ├──────────────────────┤
                      │ Visual / Storybook   │
                      └──────────────────────┘
```

1. **Storybook:** All shared UI components in `@omni/design-system` must have a corresponding `.stories.tsx` file documenting variants and interactive controls.
2. **React Testing Library (RTL):** Focus on testing user behavior rather than internal component implementation details.

---

# 10. Component Lifecycle & Maintenance

1. **Deprecation:** When replacing a component, mark the old version with `@deprecated` in JSDoc and log a warning in non-production environments.
2. **Versioning:** Major design system component changes follow Semantic Versioning (`MAJOR.MINOR.PATCH`).

---

# 11. References

- `FRONTEND_ARCHITECTURE.md`
- `MICROFRONTEND_ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
- `MOTION_ARCHITECTURE.md`
