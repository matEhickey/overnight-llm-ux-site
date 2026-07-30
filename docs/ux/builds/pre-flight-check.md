---
sidebar_label: "Pre-Flight Check"
---

# Pre-Flight Check

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/pre-flight-check/index.html" height="520px" />

## What was built

A composer-stage safety gate that lives entirely on `main` in a new `src/pre-flight/` module — independent of the engine, the Zustand chat store, and the existing reply-receipt module. As the user types, `wirePreFlight()` re-runs `detect()` on every keystroke and updates a small pre-flight store with the list of hits. The strip above the input row renders one of three states:

- **All clear** (grey) — no sensitive patterns detected
- **Warnings only** (amber) — emails, phone numbers, IBANs, IPs, or Luhn-valid card numbers
- **Blocked** (red) — JWTs, AWS access keys, generic API keys, URL credentials, or PEM private-key blocks

When there are hits, the strip exposes a `Mask all` button (rewrites every hit with `[REDACTED:category]` placeholders right-to-left, preserving offsets) and a `Review` button that opens a modal sheet listing every hit with its category badge, severity, snippet, and per-row Mask control. The bottom of the sheet has `Mask all (n)`, `Send anyway`, and `Cancel`.

For block-severity hits the UX uses a confirm-on-send pattern: the first Enter presses arms a 4-second `pendingConfirm` window and the strip shakes + pulses; the second Enter within the window fires `onSubmit`. Esc cancels the confirm or closes the panel.

## Why this feature

Existing features on `main` are all post-generation observability — Reply Receipts, Reply Suggestions, Reply Diff, Token Mosaic, Prompt X-Ray. None of them touches what happens *before* inference. The composer is still a thin `<textarea>` with a Send button. That's the gap Pre-Flight Check fills: a guard rail for the moment the user types something they might regret.

It is intentionally orthogonal to the existing chain:
- New module path (`src/pre-flight/`) — no existing file in this directory.
- New lifecycle stage (pre-inference) — does not extend Reply Suggestions (post-inference surface) or Reply Receipt (post-inference provenance).
- New state shape (own micro-store, no Zustand dep) — does not import from `src/store.ts`.
- New dependency surface (none added) — pure React + regex.

## Implementation notes

- **Detectors** are a static array of `{category, severity, regex}` rows in `src/pre-flight/detect.ts`. Each detector has a small post-filter: IPv4 octets 0–255, IBAN mod-97 check, phone length bounds + ISBN/price reject, credit-card Luhn validation, JWT three-segment shape, AWS `AKIA[0-9A-Z]{16}`, generic `sk-` / `xox[bp]-` / `ghp_` prefixes, URL `user:pass@host`, and PEM header.
- **Mask order** is right-to-left so character offsets stay valid as placeholders replace real content.
- **Animation**: shake keyframes fire on each `pendingConfirm` flip; pulse on the strip dot when armed.
- **Wire**: `wirePreFlight({onSubmit, onReplace})` returns a `GuardedSubmit` with `submit / setDraft / openPanel / closePanel / maskAll / maskOne / cancelConfirm`. The chat composer routes its existing `submit` through `guard.submit()`.
- **No new dependencies** — uses React, the pre-existing `react-markdown` only for the existing bubble render (Pre-Flight does not use Markdown), and the existing CSS-keyframe injection pattern from `ReplyReceiptPanel`.
- **Tests**: 30 new Vitest cases (23 detection + 7 wire-flow), all passing alongside the 66 existing cases (96 total).

## Try it

Interact with the embedded demo above, or <a href="/ux/pre-flight-check/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Suggested prompts:

- `ping john.doe@acme.co.uk about the doc` — see the warning strip and Mask all
- `key: AKIAIOSFODNN7EXAMPLE` — see the red block strip and double-Enter flow
- `-----BEGIN RSA PRIVATE KEY-----` — see the most severe block

Reload the page or click Reset to clear the composer.
