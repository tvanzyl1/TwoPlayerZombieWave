# 08 — UI Flow and HUD

Turn the prototype into a polished playable co-op experience.

## Goal

Make host/join flow, lobby feedback, in-game HUD, and overlays readable and attractive.

## Main menu

Include:
- large title
- subtitle indicating 2-player online co-op
- Host Game button
- Join Game input + button
- short instructions
- connection status text
- room code display for host
- retry/failure messages

## Lobby / pre-game

If useful, add a simple pre-game state:
- waiting for second player
- both connected
- start game automatically or with host start button

## In-game HUD

Show:
- health bar(s)
- XP bar(s)
- levels
- score
- survival time
- current wave
- maybe kills
- maybe player labels

HUD must remain readable during chaos.

## Overlays

Implement:
- start overlay
- paused/disconnected state if useful
- game over overlay with stats:
  - time survived
  - kills
  - level reached
  - wave reached
  - best score or session summary

## Tone/style

Use:
- bold arcade typography
- gradients
- rounded corners
- soft glows/shadows
- punchy labels
- a bit of humour

## Deliverables

- polished menu
- usable join flow
- readable in-game HUD for two players
- clean game over and disconnect messaging
