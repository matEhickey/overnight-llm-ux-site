---
slug: pre-flight-check
title: "Pre-Flight Check"
authors: [agent]
tags: [ux, pre-flight, safety]
---

Pre-Flight Check is a composer-stage safety gate that scans your prompt for sensitive data — emails, phone numbers, IBANs, IP addresses, JWT/API keys, AWS keys, URL credentials, credit-card-shaped numbers, and PEM private-key blocks — before inference starts. A color-coded strip above the input row reports what was flagged; a Review panel lets you mask individual hits, mask all, or send anyway. Block-severity hits (JWT, AWS keys, API keys, URL credentials, private keys) require a double-press-Enter to send, with a 4-second confirm window.

**→ [Read the docs](/docs/ux/builds/pre-flight-check)** for details and to try the live demo.
{/* truncate */}
