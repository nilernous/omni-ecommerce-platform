# Design System Specification

**Document Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-07-27  
**Owner:** Frontend Team & UX Design

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [Design Philosophy & Visual Aesthetics](#2-design-philosophy--visual-aesthetics)
3. [Design Tokens Architecture](#3-design-tokens-architecture)
4. [Tailwind CSS Configuration](#4-tailwind-css-configuration)
5. [Accessible Component Foundations (Radix UI)](#5-accessible-component-foundations-radix-ui)
6. [Iconography System](#6-iconography-system)
7. [Theme Engine & Dark Mode](#7-theme-engine--dark-mode)
8. [Package Distribution (`@omni/design-system`)](#8-package-distribution-omnidesign-system)
9. [References](#9-references)

---

# 1. Introduction

## 1.1 Purpose

This document defines the Design System Specification for OmniCommerce. It establishes the visual guidelines, design tokens, color systems, typography scales, accessibility foundations, and Tailwind CSS integration patterns that ensure a unified, high-performance, and visually stunning user experience across all web applications and Microfrontends.

## 1.2 Scope

This document governs all visual user interface assets developed in the `@omni/design-system` package and consumed by the Shell application and Microfrontends.

## 1.3 Objectives

- **Visual Excellence:** Deliver a state-of-the-art ecommerce UI featuring HSL tailored colors, glassmorphism effects, crisp typography, and fluid micro-animations.
- **Systematic Consistency:** Standardize design tokens across independent developer teams.
- **Accessibility:** Built-in WCAG 2.1 AA compliance powered by unstyled Radix UI primitives.
- **Developer Velocity:** Provide pre-built Tailwind utility mappings and re-usable compound components.

---

# 2. Design Philosophy & Visual Aesthetics

OmniCommerce adheres to a **Modern Premium E-Commerce** design aesthetic:

1. **Rich Harmonious Color Palettes:** Avoiding plain defaults (pure `#000000` or `#ffffff`). Utilizing subtle HSL colors, warm neutrals, and vibrant indigo-violet accents.
2. **Elevation & Glassmorphism:** Employing layered backdrop blurs (`backdrop-blur-md`), translucent cards (`bg-background/80`), and dynamic micro-shadows.
3. **Typography Scaling:** Powered by modern variable fonts (Inter / Outfit) for optimal legibility across desktop, tablet, and mobile displays.

---

# 3. Design Tokens Architecture

Design tokens are defined as CSS Custom Properties in HSL format, enabling seamless runtime theme switches between Light and Dark modes.

## 3.1 Color Token Table

| Token Name | Light Mode (HSL) | Dark Mode (HSL) | Purpose |
|------------|------------------|-----------------|---------|
| `--background` | `220 14% 97%` | `224 71% 4%` | App background |
| `--foreground` | `224 71% 4%` | `210 20% 98%` | Primary text |
| `--card` | `0 0% 100%` | `224 71% 7%` | Surface container cards |
| `--primary` | `239 84% 67%` | `239 84% 67%` | Primary action buttons & highlights |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | Text on primary buttons |
| `--secondary` | `220 14% 92%` | `215 27.9% 16.9%` | Secondary buttons & tags |
| `--muted` | `220 14% 92%` | `215 27.9% 16.9%` | Muted backgrounds & dividers |
| `--muted-foreground` | `220 8.9% 46.1%` | `217.9 10.6% 64.9%` | Subtitles and secondary captions |
| `--accent` | `262 83% 58%` | `262 83% 58%` | Special promo badges & accents |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Danger alerts & destructive actions |
| `--border` | `220 13% 91%` | `215 27.9% 16.9%` | Card & input borders |

## 3.2 Spacing & Radius Tokens

```css
:root {
  --radius: 0.75rem; /* 12px default border radius */
  --radius-sm: 0.5rem;
  --radius-lg: 1.0rem;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 20px -3px rgba(99, 102, 241, 0.35);
}
```

---

# 4. Tailwind CSS Configuration

The `@omni/design-system` package exports a standardized `tailwind.config.ts` consumed by all workspace applications.

```typescript
// packages/design-system/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

## 4.1 Class Merging Helper Utility (`cn`)

All components must use the `cn()` helper (combining `clsx` and `tailwind-merge`) to allow downstream prop overrides without utility class conflicts.

```typescript
// packages/design-system/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

# 5. Accessible Component Foundations (Radix UI)

Interactive complex components are built on top of **Radix UI Primitives** to ensure keyboard navigation, screen reader support, and ARIA state management out of the box.

```tsx
// packages/ui/src/components/Dialog.tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@omni/design-system/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'rounded-xl border bg-card p-6 shadow-lg backdrop-blur-md transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;
```

---

# 6. Iconography System

OmniCommerce uses **Lucide React** as its official icon library.

- **Standard Icon Sizes:**
  - `sm`: `16px` (`h-4 w-4`) — Badges, inline text buttons
  - `md`: `20px` (`h-5 w-5`) — Standard input prefixes, navigation links
  - `lg`: `24px` (`h-6 w-6`) — Header action triggers, modal titles
  - `xl`: `32px` (`h-8 w-8`) — Feature callouts, empty state illustrations

---

# 7. Theme Engine & Dark Mode

Theme management uses `next-themes` wrapped in a client provider to prevent hydration mismatches.

```tsx
// components/ThemeProvider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}
```

---

# 8. Package Distribution (`@omni/design-system`)

The design system is managed within the pnpm workspace monorepo under `packages/design-system`. Each Microfrontend lists `@omni/design-system` as a workspace dependency (`workspace:*`), allowing instantaneous hot-reloading during development and atomic bundle optimization.

---

# 9. References

- `FRONTEND_ARCHITECTURE.md`
- `MICROFRONTEND_ARCHITECTURE.md`
- `COMPONENT_ARCHITECTURE.md`
- `MOTION_ARCHITECTURE.md`
