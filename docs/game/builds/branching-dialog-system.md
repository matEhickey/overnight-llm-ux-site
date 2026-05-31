---
sidebar_label: "Branching Orb Dialog Demo"
---

# Branching Orb Dialog Demo

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/branching-dialog-system/index.html" height="500px" />

## What was built

Every generated orb now opens a multi-turn conversation with player-selected replies. The player can inspect the orb, follow a second dialog turn, awaken it through a world action, and revisit it afterward to receive a different conversation.

The reply UI also demonstrates conditional visibility states. Dormant orbs show a disabled reply for unavailable information, while the underlying dialog engine can also hide replies entirely until their conditions pass.

## Why this feature

The original orb interaction displayed static text and one **OK** button. That worked as a prototype, but it could not express choices, persistent world changes, or different conversations after an action.

This demo establishes a reusable narrative foundation for future NPCs, gates, quests, and world reactions without coupling authored dialog content directly to scene code.

## Implementation notes

Dialog definitions are declarative graphs. Each actor owns an ordered list of candidate graphs; the first graph whose synchronous condition passes is selected. Replies may advance to another node, close the dialog, or publish typed commands with serializable payloads.

The demo publishes `orb.activate` commands. A world-system handler updates Zustand state and emits an `orb.activated` fact event. The next interaction selects the orb's higher-priority awakened graph. Commands allow one authoritative handler, while follow-up events may have multiple listeners for future audio, particles, or progression tracking.

The implementation includes focused tests for graph selection, conditional replies, command ownership, hot-reload cleanup, UI rendering, world-state updates, and the generated catalog for all six orbs.

## Try it

Play the embedded game above, or <a href="/game/branching-dialog-system/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Find any glowing orb and press **E**.
2. Choose **Listen closer** to follow its second dialog turn.
3. Choose **Awaken the orb**.
4. Close the activation response and interact with the same orb again.
5. Confirm that its awakened conversation appears.
