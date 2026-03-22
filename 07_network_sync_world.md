# 07 — Network Sync: World, Combat, Waves

Now make the actual co-op zombie survival work online.

## Goal

Host simulates the world and both players fight together against synced zombie waves.

## Host must simulate

- zombie spawning
- zombie movement and targeting
- bullet/projectile spawning
- auto-aim target selection
- hit detection
- enemy death
- XP drops
- health pickups
- wave progression
- score progression
- levelling and upgrades
- game over state

## Guest must do

- send input only
- render host snapshots smoothly
- optionally predict own movement only
- never invent world truth

## Snapshot content

Send only what is needed, for example:
- match timer
- wave
- player states
- enemy states
- projectile states
- pickups
- score/kills
- level-up or event notifications

Use IDs for entities so interpolation/reconciliation is manageable.

## Gameplay rules

- both players cooperate
- both can receive damage
- zombies may target nearest or most sensible player
- if both players die, game over
- shared survival session

## Upgrade handling

To keep scope manageable:
- host decides all upgrade results
- if a player levels up, host sends the offered choices and final result
- keep the UI simple and reliable

## Important

Prefer:
- stable sync
- readable combat
- fewer entities if needed

Over:
- extreme projectile counts with bad performance

## Deliverables

- real online co-op survival playable
- synced enemies/combat/pickups/waves
- host-authoritative world state
- guest can play a full run with host
