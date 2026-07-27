# Motion Architecture

**Document Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-07-27  
**Owner:** Frontend Team & Motion Design

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [Motion Philosophy & Principles](#2-motion-philosophy--principles)
3. [Technology Architecture](#3-technology-architecture)
4. [Motion Token System](#4-motion-token-system)
5. [Page & Route Transitions](#5-page--route-transitions)
6. [Micro-Interactions & Component Animations](#6-micro-interactions--component-animations)
7. [Accessibility & Reduced Motion](#7-accessibility--reduced-motion)
8. [Performance & Compositing Strategy](#8-performance--compositing-strategy)
9. [References](#9-references)

---

# 1. Introduction

## 1.1 Purpose

This document specifies the Motion Architecture for the OmniCommerce frontend platform. It establishes the animation system, micro-interaction guidelines, physics presets, accessibility fallbacks, and rendering performance rules for fluid user interface animations across the platform.

## 1.2 Scope

This document applies to all interactive motion elements, page layout transitions, component micro-interactions, modal animations, loading states, and gesture responses.

## 1.3 Objectives

- **Enhance UX:** Guide user focus, communicate interface hierarchy, and provide tactile touch/click feedback.
- **Natural Feel:** Utilize spring-physics modeling for organic, responsive movement rather than robotic linear motion.
- **Accessibility:** Respect user preferences for reduced motion (`prefers-reduced-motion`) without breaking functional UI feedback.
- **High Frame-Rate:** Maintain a constant 60 FPS / 120 FPS by animating strictly composited CSS properties (`transform`, `opacity`).

---

# 2. Motion Philosophy & Principles

OmniCommerce motion design is governed by three core tenets:

1. **Purposeful:** Every animation must serve a clear purpose (e.g., confirming an action, drawing attention to a shopping cart update, or smoothing page context switching).
2. **Subtle & Fast:** Animations should feel nimble. Interactive feedback must complete under `200ms`, while major structural transitions conclude under `350ms`.
3. **Physics-Based:** Movement follows natural momentum. Elements accelerate quickly and decelerate smoothly using spring physics.

---

# 3. Technology Architecture

OmniCommerce uses a dual-layer motion stack:

```text
┌─────────────────────────────────────────────────────────┐
│                    Framer Motion                        │  Dynamic physics, layout animations, page transitions
├─────────────────────────────────────────────────────────┤
│                Tailwind CSS Animate                     │  Static CSS keyframes, simple hover/fade utilities
└─────────────────────────────────────────────────────────┘
```

1. **Framer Motion (`framer-motion`):** Applied for dynamic component states, page enter/exit choreography (`AnimatePresence`), shared layout element transitions (`layoutId`), and drag/gesture interactions.
2. **Tailwind CSS Animate (`tailwindcss-animate`):** Used for lightweight CSS-only transitions (e.g., hover color shifts, simple dropdown fade-ins, border pulses).

---

# 4. Motion Token System

Motion tokens standardize durations, easing curves, and spring presets across all applications.

## 4.1 Duration Tokens

| Token | Duration | Usage |
|-------|----------|-------|
| `duration-instant` | `100ms` | Micro-taps, checkbox toggles |
| `duration-fast` | `150ms` | Hover states, tooltips, dropdown triggers |
| `duration-normal` | `250ms` | Modals, drawers, accordion expansions |
| `duration-slow` | `350ms` | Full page transitions, complex layout shifts |

## 4.2 Spring Physics Presets

```typescript
// packages/design-system/motion/springs.ts
export const motionSprings = {
  /** Snappy feedback for button taps & keypresses */
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  /** Smooth momentum for modals and side drawers */
  gentle: { type: 'spring', stiffness: 250, damping: 25 },
  /** Bouncy highlight for badge notifications and cart drop indicator */
  bouncy: { type: 'spring', stiffness: 500, damping: 15 },
} as const;
```

---

# 5. Page & Route Transitions

Page transitions use Framer Motion's `AnimatePresence` to coordinate smooth exit and entrance sequences.

## 5.1 Route Wrapper Component

```tsx
// components/motion/PageTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## 5.2 Shared Element Transitions (`layoutId`)

When expanding a product card from a grid into a modal or detail view, components share a `layoutId` to morph seamlessly without abrupt context switches.

```tsx
// In ProductCard.tsx
<motion.img layoutId={`product-image-${product.id}`} src={product.imageUrl} alt={product.title} />

// In ProductModal.tsx
<motion.img layoutId={`product-image-${product.id}`} src={product.imageUrl} alt={product.title} />
```

---

# 6. Micro-Interactions & Component Animations

## 6.1 Tactile Button Interactivity

```tsx
import { motion } from 'framer-motion';
import { motionSprings } from '@omni/design-system/motion/springs';

export function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={motionSprings.snappy}
      onClick={onClick}
      className="btn btn-primary shadow-md hover:shadow-glow"
    >
      {children}
    </motion.button>
  );
}
```

## 6.2 Shimmer Loading Skeletons

Skeleton screens utilize a gradient shimmer keyframe to indicate dynamic data fetching.

```tsx
export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted p-4 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent">
      <div className="h-48 rounded-lg bg-muted-foreground/10" />
      <div className="mt-4 h-4 w-3/4 rounded bg-muted-foreground/20" />
      <div className="mt-2 h-4 w-1/2 rounded bg-muted-foreground/20" />
    </div>
  );
}
```

---

# 7. Accessibility & Reduced Motion

All motion elements **must** honor the operating system's `prefers-reduced-motion` setting.

## 7.1 Framer Motion `useReducedMotion` Hook

```tsx
import { motion, useReducedMotion } from 'framer-motion';

export function AccessibleModal({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  // If reduced motion is requested, replace spatial translation with simple opacity fade
  const animationVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={animationVariants}>
      {children}
    </motion.div>
  );
}
```

---

# 8. Performance & Compositing Strategy

To prevent layout thrashing and maintain 60/120 FPS performance:

1. **Composite Properties Only:** Only animate `transform` (`scale`, `translate3d`, `rotate`) and `opacity`. Never animate `width`, `height`, `margin`, or `padding` directly.
2. **GPU Layer Promotion:** Use `will-change: transform` or `transform: translateZ(0)` sparingly on persistent heavy animated elements (e.g. sliding drawers).
3. **Unmount Offscreen Motion:** Ensure invisible or exited components are unmounted from the React DOM tree using `AnimatePresence`.

---

# 9. References

- `FRONTEND_ARCHITECTURE.md`
- `MICROFRONTEND_ARCHITECTURE.md`
- `COMPONENT_ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
