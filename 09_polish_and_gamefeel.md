# 09 — Polish and Game Feel

Push the multiplayer game toward a premium-feeling browser arcade prototype.

## Goal

Add juice without destabilising multiplayer.

## Priorities

Add polish to:
- hits
- enemy deaths
- levelling
- pickups
- explosions
- UI reactions
- wave starts
- damage feedback

## Effects ideas

- particles for bullets, hits, pickups, deaths
- floating damage numbers
- crit text
- level-up flash
- pulse/glow on valuable pickups
- screen shake on heavy impacts
- zombie splats
- subtle background motion
- celebratory banner for new wave

## Audio

If adding audio is easy and lightweight:
- shoot sound
- hit sound
- pickup sound
- level-up sound
- game over sting

But do not let audio block shipping.

## Performance rules

- keep effect counts reasonable
- avoid memory leaks
- clean dead entities/effects properly
- keep networking packets lean
- reduce visual spam if it hurts readability

## Multiplayer rule

All juice should either:
- be deterministic enough from host events
- or be safe client-side presentation based on authoritative events

Do not let visual polish break sync clarity.

## Deliverables

- significantly juicier feel
- still stable online co-op
- improved readability during mayhem
