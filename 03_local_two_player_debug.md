# 03 — Local Two-Player Debug Mode

Before real online networking, add a local debug mode with 2 players in the same simulation.

## Goal

Prove that the gameplay works with two player entities.

## Requirements

Add a debug mode where:
- Player 1 uses WASD
- Player 2 uses arrow keys
- Both exist in the same arena
- Both auto-aim and auto-fire independently
- Both collect XP and pickups
- Zombies can target nearest or a sensible player target
- HUD can show both players' health and level clearly

## Purpose

This is a temporary development step to validate:
- multi-player entity support
- two-player chaos readability
- enemy targeting
- shared combat density
- score/wave balance with two players present

## Visual clarity

Make players visually distinct:
- different colour palettes
- different rings / outlines / labels
- optional nameplates such as HOST and GUEST in debug mode

## Balance guidance

Tune early game so:
- 2 players do not instantly trivialise waves
- but the game feels more chaotic and fun with two players

## Deliverables

- keyboard-debug local co-op mode
- stable 2-player simulation
- no online code required here beyond keeping architecture ready
- leave clear comments that this mode is for development/testing
