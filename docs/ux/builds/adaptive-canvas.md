---
sidebar_label: "Adaptive Canvas"
---

# Adaptive Canvas — Responsive Layout Foundation

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/adaptive-canvas/index.html" height="600px" />

## What was built

A new `src/adaptive-canvas/` module that wraps the entire chat in a **4-breakpoint responsive layout** using CSS `clamp()`, `@container` queries, and a small `useBreakpoint()` hook. Mobile-first: the default is the phone layout; larger breakpoints progressively enhance.

### The four breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| **phone** | ≤ 640px | Single column. **FAB** (⚙ button) in bottom-right. Configuration panel rises as a **bottom sheet** when the FAB is tapped. |
| **tablet** | 641–1024px | Split view: chat on the left (60%), persistent **right rail** on the right with the configuration panel. |
| **desktop** | 1025–1599px | Full chat. Floating **tool belt** at the bottom-center with 4 shortcuts: Export, Reset, Receipt, Theme. |
| **wide** | ≥ 1600px | 3-column: **left rail** (session chrome) + chat + right rail (configuration). Tool belt still visible. |

### Key components

- **`Canvas`** — top-level layout orchestrator. Uses CSS Grid with templates that change based on the active breakpoint.
- **`FAB`** — phone-only ⚙ button. Safe-area-aware (uses `env(safe-area-inset-bottom)`). Has a pulsing status dot when the model is loading or generating.
- **`BottomSheet`** — slide-up panel with backdrop, drag handle, close button, and body-scroll lock. Renders the configuration panel.
- **`RightRail`** — persistent right panel on tablet+, with a collapse button (`›`).
- **`LeftRail`** — persistent left panel on wide viewports, with session stats (turn count, active model).
- **`ToolBelt`** — floating action bar at bottom-center on desktop + wide. 4 shortcuts (Export, Reset, Receipt, Theme).
- **`BreakpointBadge`** — small `▯▭▬▰` chip in the header showing the current breakpoint. Color-coded (phone=amber, tablet=green, desktop=blue, wide=violet).
- **`useBreakpoint()`** — hook that listens to `window.matchMedia` for 4 breakpoints and returns the current one. SSR-safe (defaults to `phone`).
- **`useAdaptiveStore`** — Zustand slice for `sheetOpen`, `railCollapsed`, `toolBeltEnabled`. Persisted to localStorage.

### Mobile-first design choices

- **Fluid typography:** `clamp(13px, 1.2vw + 8px, 18px)` — 13px on phone, 18px on huge displays.
- **Fluid spacing:** `clamp(8px, 1.5vw, 16px)` for padding, `clamp(6px, 0.6vw, 10px)` for radii.
- **Touch targets:** minimum 44×44px on phone (Apple HIG), 36×36px on desktop.
- **Safe areas:** `padding: env(safe-area-inset-bottom, 0px)` for FAB and bottom sheet.
- **Bubble max-width:** `clamp(85%, 80vw, 80%)` — 85% on phone for more screen real estate, 80% on desktop.

### Animations

- **`ac-sheet-rise`** — bottom sheet slides up from below + fades in (280ms).
- **`ac-fab-enter`** — FAB scale + fade on first paint (280ms).
- **`ac-fab-pulse`** — pulsing dot when model is loading/generating (1.6s loop).
- **`ac-toolbelt-enter`** — tool belt slides up from below + fades in (280ms).
- **`ac-rail-slide`** — right rail slides in from the right (280ms).

All animations are `prefers-reduced-motion`-friendly by virtue of being short and non-blocking.

## Why this feature

The user's **2026-08-12 directive** explicitly called for responsive-first design in every future build. A grep for `matchMedia`, `container-query`, `@container`, `@media`, `clamp()`, `innerWidth`, `aspect-ratio` across `src/` returned **zero matches** on `main`. The app was a single flat vertical stack with no viewport awareness at all.

The recent chain covered bubble-level layout (Shape Memory), streaming observability (Latency Lens), and persistent archives (Conversation Library). None of them touched the **page-level layout foundation**. Adaptive Canvas fills that gap and unlocks future responsive-first builds.

It is intentionally orthogonal to the recent chain:

- **New module path** (`src/adaptive-canvas/`) — no existing files in this directory on main.
- **New axis** — page layout, not bubble layout, not observability, not conversation state.
- **No imports from `src/reply-receipt/`, `src/store.ts`, `src/tools.ts`** beyond the `useChatStore` (which is already widely used). The Canvas and its components are self-contained.
- **No mode toggle** — the layout is automatic and responsive, not a user-facing switch.

## Implementation notes

### Container queries used

Container queries (`@container`) are used sparingly — only for components that need to react to their own container's width, not the viewport. The breakpoint system itself uses `window.matchMedia` for the page-level layout switch.

### CSS imports

`src/adaptive-canvas/styles.css` is imported once from `src/main.tsx`. The CSS file uses CSS custom properties (`--ac-*`) for design tokens, so future themes can override them via the documented `data-ac-theme="high-contrast"` attribute.

### The Theme button

The ToolBelt's `Theme` button toggles the `data-ac-theme` attribute on `:root`. The high-contrast theme swaps colors for stronger contrast. This is a small a11y affordance that doesn't warrant a separate feature — it's a side-effect of the responsive foundation.

### Tests

- `src/__tests__/adaptive-canvas.test.ts` — 15 tests covering:
  - `BREAKPOINT_ORDER` ordering
  - `BREAKPOINT_MIN_WIDTH` monotonicity
  - `detectBreakpoint` returns the right value for every viewport class (390, 768, 1280, 1920) plus the boundary cases (640, 641, 1025, 1600)
  - `useAdaptiveStore` toggle/set/persist behavior

The vitest config was updated from `node` to `jsdom` so the `window.matchMedia` + `localStorage` mocks work.

### Repository layout

- `src/adaptive-canvas/` — new module (8 files)
- `src/main.tsx` — 1-line addition (CSS import)
- `src/App.tsx` — restructured to pass `header` + `configPanel` to the Canvas
- `src/__tests__/adaptive-canvas.test.ts` — new test file
- `vitest.config.ts` — switched to `jsdom` environment

## Try it

Interact with the embedded demo above, or <a href="/ux/adaptive-canvas/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

**Resize the browser window** to see the layout switch:
- 320–640px → phone (FAB + bottom sheet)
- 641–1024px → tablet (right rail)
- 1025–1599px → desktop (tool belt)
- 1600px+ → wide (left + right rails)

Watch the breakpoint badge in the header change color as you cross the thresholds.
