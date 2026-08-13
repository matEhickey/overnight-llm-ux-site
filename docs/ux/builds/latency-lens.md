---
sidebar_label: "Latency Lens"
---

# Latency Lens

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/latency-lens/index.html" height="600px" />

## What was built

A **streaming observability HUD** that visualizes the inference itself, not the output. The cycle covers:

- **Per-token latency capture** — `useWebLLM` wraps every `chunk` event with `performance.now()` and appends a delta (ms since last chunk) to a per-stream array. The first chunk seeds `streamStartMs`; successive chunks record timing.
- **Header mini-sparkline** — an always-on widget (200×24) showing the last 60 token-deltas. Color-coded by latency bucket. Green pulses when streaming. Click to toggle the full panel.
- **Full LatencyLens panel** — a 380px right-side drawer with:
  - Live state badge (STREAMING / IDLE) and profile-count footer
  - 4-stat grid: tokens, throughput (tok/s), elapsed, last-delta
  - Full-width sparkline (352×80) of all current-stream samples
  - Histogram (5 buckets: flash / fast / medium / slow / stall) with percent-of-total bars
  - Per-turn LatencyProfileCard when idle (last captured profile)
- **Per-turn LatencyProfile** — on `done`, the in-flight array is snapshotted under the assistant messageId into `turnLatencyProfiles[messageId]`. The store keeps the full per-token array, not just the summary. The card shows: total / mean / median / p95 / max / min / throughput, plus a compressed sparkline.
- **Palette** — slate-900 background, traffic-light bucket colors. Distinct from the receipt-ledger warm-paper palette (slate sky vs. amber black).

## Why this feature

The chat UX has been exhaustively explored — receipts, annotations, suggestions, audit, diffs, styles. The *inference itself* remains a black box: tokens appear, the user reads text, and the rhythm of generation is invisible. The Latency Lens makes the streaming process visible, surfacing facts that no other feature exposes:

- **Is the model bottlenecked on compute, or on a single slow first decode?** The histogram catches this: a fat "stall" bar at index 1 means TTFT was huge but the rest was fine.
- **Is the tail of the response slowing down?** The sparkline shows it directly — bars trend up as the KV cache fills.
- **How does the model budget its budget?** Throughput (tok/s) over time is the actual user-perceived "speed".

Token Mosaic (Jul 6) did something adjacent — colored tiles per character class — but it was *visual rhythm by content type*. Latency Lens is *visual rhythm by inference cost*. Different signal, different color mapping, different chart type, no shared store slice.

## Implementation notes

- **New files** in `src/latency-lens/`:
  - `index.ts` — barrel
  - `types.ts` — `LatencyProfile`, `LatencyStats`, `LatencyBucket`
  - `stats.ts` — pure: `computeStats`, `bucketize`, `bucketOf`, `latencyColor`, `formatMs`, `formatTokPerSec`, `BUCKET_BOUNDS`
  - `styles.ts` — palette + `useInjectLatencyAnimations` + shared style fragments
  - `Sparkline.tsx` — pure SVG, sliding-window bars with median grid line
  - `Histogram.tsx` — 5-row bucketed bar chart with count column
  - `MiniSparkline.tsx` — header widget, tail-of-60, disabled state when no data
  - `LatencyProfileCard.tsx` — per-turn stats grid + compressed sparkline
  - `LatencyLens.tsx` — full panel, live ticker for elapsed counter
- **Touched files**:
  - `src/store.ts` — adds `streamStartMs`, `lastChunkMs`, `currentStreamLatencies`, `turnLatencyProfiles`, plus `setStreamStart`, `setLastChunkMs`, `appendLatencySample`, `commitLatencyProfile`, `clearCurrentLatencies`, `clearLatencyProfile`
  - `src/useWebLLM.ts` — `chunk` event now records timing; `done` event snapshots the profile under the assistant messageId; `send` / `reset` / `unload` clear in-flight state
  - `src/WebLLMChat.tsx` — renders `MiniSparkline` in the header and `LatencyLens` overlay; lens state is local to the component
  - `src/index.ts` — unchanged (Latency Lens is internal to the chat UI, not part of the public API)
- **No new dependencies** — pure SVG/CSS + existing Zustand store.
- **Bucket boundaries** — flash (≤30 ms), fast (30–80), medium (80–150), slow (150–300), stall (>300). These are heuristic — a 1B model on a fast GPU lives in flash/fast; a 3B on a laptop often clubs in medium/slow.
- **MiniSparkline window** — last 60 samples. Older samples drop off in a sliding window so the chart always reflects the "current" rhythm.
- **LatencyPanel lives in the chat root** — uses `position: absolute` so it doesn't push the chat layout. Z-index 50 keeps it above messages.

## Tests

37 new tests in `src/__tests__/latency-lens.test.ts` covering:

- `bucketOf` — every boundary, including float edge cases
- `bucketColor` / `bucketLabel` / `latencyColor` — all five buckets have a hex color and a ms-range label
- `bucketize` — empty input, correct counts, sum equals input length
- `computeStats` — empty, single, mean, median (odd/even), max, min, throughput formula, p95 via linear interpolation, immutability of input
- `formatMs` — sub-1ms, sub-10ms, sub-1000ms, seconds, minutes+seconds, NaN/Infinity/-1
- `formatTokPerSec` — low/high, zero/negative
- `formatCount` — thousands separators
- Store slice — initial state, append in order, setLastChunkMs / setStreamStart, commitLatencyProfile snapshots, no-op on empty, clearCurrentLatencies keeps profiles, clearLatencyProfile removes a single profile, snapshot independence from the in-flight array

Total: 103 tests across 5 files, all passing.

## Try it

Interact with the embedded demo above, or <a href="/ux/latency-lens/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Send a prompt and watch the green pulse animate in the header. Click the 📡 button to open the full panel — the histogram updates live, the sparkline fills bar by bar, and on completion the LatencyProfileCard surfaces below with the per-turn stats. Default 1B model is enough to see the rhythm; the panel is most fun with a larger model where stalls are visible.
