---
sidebar_label: "Reading Comfort"
---

# Reading Comfort

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reading-comfort/index.html" height="500px" title="Reading Comfort demo" />

## What was built

Reading Comfort adds a small presentation-preference module to the WebLLM chat. In Configuration, choose Compact, Comfortable, or Large text; then choose whether chat movement follows the operating-system setting, is reduced, or remains fully animated. The selection is saved locally, so it returns without a model request or account.

The choice changes message and composer spacing as well as type scale. Large-text mode also gives the Send control a touch-friendly 44-pixel minimum height. Reduced motion changes automatic conversation scrolling from smooth animation to an immediate jump.

## Why this feature

Local inference has a conspicuous waiting period before a first model can answer. The interface should be useful and comfortable in that period, especially on a phone, rather than treating accessibility as an afterthought once inference begins. This is deliberately separate from reply receipts and prior response-analysis work: it is a reader-owned visual setting, not a model-output feature.

## Implementation notes

`src/comfort-controls/` owns the serializable settings, safe localStorage access, system motion detection, and the presentation resolver. The resolver is pure and covered by tests; the chat receives only its resolved font size, padding, and scroll policy. No dependency was added and the default 1B model remains sufficient.

## Try it

Interact with the embedded demo above, or <a href="/ux/reading-comfort/index.html" target="_blank" rel="noopener noreferrer">open it in a new tab</a>. Open Configuration, select a reading scale and motion policy, then reload to confirm that the device-local setting remains.
