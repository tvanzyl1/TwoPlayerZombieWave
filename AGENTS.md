# Multiplayer AGENTS Pack — Zombie Mayhem Co-op

Use this pack to build a **2-player online co-op** top-down zombie wave survival shooter with a **host + join** flow.

## Vision

Keep the same design philosophy as the original brief:
- juicy emoji-arcade browser game feel
- playful, polished, readable, colourful, and full of animated feedback
- slightly neon aesthetic on a darker background
- humorous tone with chaos and personality
- simple shapes and emoji-like readability rather than realism
- lots of game juice: particles, floating text, flashes, pickups, hit effects, level-up celebration

## Multiplayer direction

This version is **not single-file only**.

Build a small web project with:
- static browser client
- small Node.js signalling server
- WebRTC data channel networking
- host-authoritative simulation
- exactly **2 players max**
- one player hosts
- one player joins via room code
- both players fight together against zombie waves

## Important architecture rules

- The **host** is authoritative for gameplay state.
- The **guest** sends inputs, not world truth.
- The host simulates:
  - player positions as final authority
  - zombies
  - projectiles
  - pickups
  - XP and levelling
  - wave progression
  - damage and deaths
  - score and game over state
- The guest may use light local prediction for its own movement feel, but host snapshots are final.
- Keep networking simple and robust. Prefer correctness over cleverness.

## Tech stack

- Frontend: HTML, CSS, JavaScript
- Rendering: Canvas
- Networking: WebRTC data channel
- Signalling: Node.js + WebSocket
- No heavy frameworks
- Keep files clean and readable
- Separate:
  - config/constants
  - state
  - networking
  - entities/systems
  - rendering
  - UI

## Scope

Target a polished **v1 multiplayer prototype**:
- 2 players
- one arena
- endless waves
- auto-aim and auto-fire
- pickups and upgrades
- room host/join flow
- desktop first
- mobile can be deferred unless easy

## Build order

Run the agents in this order:

1. `01_project_setup.md`
2. `02_gameplay_core.md`
3. `03_local_two_player_debug.md`
4. `04_signalling_server.md`
5. `05_webrtc_host_join.md`
6. `06_network_sync_players.md`
7. `07_network_sync_world.md`
8. `08_ui_flow_and_hud.md`
9. `09_polish_and_gamefeel.md`
10. `10_deploy_and_readme.md`

## Quality bar

The result should feel like a small premium browser arcade game:
- readable
- punchy
- responsive
- funny
- colourful
- easy to join with a friend
- stable enough for repeated host/join sessions

## Repo shape target

Suggested structure:

- `/client`
  - `index.html`
  - `style.css`
  - `src/`
- `/server`
  - `server.js`
- `README.md`

## Final note

Prioritise:
1. host/join working
2. synced movement/combat
3. wave survival fun
4. UI polish
5. extra effects after stability
