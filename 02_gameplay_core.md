# 02 — Gameplay Core

Build the offline gameplay core first, before real networking.

## Goal

Create a polished **single-process gameplay simulation** that can later be host-authoritative online.

## Core gameplay

- Top-down arena survival
- Player moves with WASD / arrow keys
- Auto-aim at nearest zombie
- Auto-fire on cooldown
- Zombies spawn at arena edges and chase players
- XP drops from enemies
- Levelling/upgrades
- Health pickups occasionally
- Score, time, wave progression

## Players

Design the code so it already supports **two players in the same simulation**, even if both are not online yet.

Each player needs:
- id
- name or label
- x/y
- velocity
- HP/max HP
- level
- XP
- fire rate
- damage
- move speed
- pickup radius
- alive/dead state
- colour/theme
- kills
- score contribution

## Enemy types

Implement at least:
- slow tank zombie
- fast weak zombie

## Combat

- projectiles target nearest enemy in range
- bright readable bullet visuals
- satisfying hit flashes
- floating damage text
- death splats/particles
- occasional crit text or bonus pop text

## Upgrades

At minimum support:
- faster fire rate
- more damage
- extra projectile
- move speed
- larger pickup radius

## Architecture requirement

The simulation logic must be separated from rendering so the host can later own the truth.

Recommended separation:
- game state
- systems update
- render
- UI

## Important

Build this with a future host-authoritative loop in mind:
- deterministic-ish update order
- central spawn logic
- central combat resolution
- central wave timer
- central pickup generation

## Deliverables

- gameplay loop runs locally
- supports two players in same simulation data model
- only one local keyboard-controlled player is necessary for now
- code is ready for networking integration
