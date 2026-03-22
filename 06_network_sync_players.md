# 06 — Network Sync: Players

Implement player movement/input networking with host authority.

## Goal

Get two remote players moving correctly in the same arena.

## Authority model

- Host owns simulation truth
- Guest sends input packets only
- Host simulates final player movement for both
- Host sends periodic world/player snapshots
- Guest renders remote host and own corrected local state

## Required networking

Guest sends:
- input direction
- maybe input sequence number / timestamp

Host sends:
- player positions
- velocities if needed
- HP/alive state
- any other minimal player snapshot data

## Feel requirement

Guest movement should feel responsive.
A light local prediction/interpolation approach is allowed, but:
- host remains final authority
- correction should be gentle, not harsh teleport spam

## Rendering clarity

Show clear role labels during development:
- HOST
- GUEST

## Out of scope for this step

You do not need to fully sync:
- zombies
- bullets
- pickups
- upgrades

You may stub those if needed.

## Deliverables

- host and guest both appear in same arena
- guest can move from another client
- host sees guest movement
- guest sees host movement
- correction is stable enough for prototype play
