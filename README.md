# Multiplayer Zombie Mayhem — Agent Pack

This folder contains a sequenced set of agent instruction files for building a **2-player online co-op** top-down zombie wave survival shooter.

## Intent

This pack converts the original single-player arcade survival brief into a multiplayer version where:
- one player hosts
- another player joins with a room code
- both fight endless zombie waves together
- the host is authoritative for the simulation

## Included files

- `AGENTS.md`
- `01_project_setup.md`
- `02_gameplay_core.md`
- `03_local_two_player_debug.md`
- `04_signalling_server.md`
- `05_webrtc_host_join.md`
- `06_network_sync_players.md`
- `07_network_sync_world.md`
- `08_ui_flow_and_hud.md`
- `09_polish_and_gamefeel.md`
- `10_deploy_and_readme.md`

## Recommended use

Use them in order.

The sequence is designed to reduce risk:
1. set up project
2. build local gameplay core
3. prove two-player simulation locally
4. add signalling
5. connect peers
6. sync player movement
7. sync combat/world
8. polish UI flow
9. add juice
10. finish deployment/docs

## Notes

This pack intentionally avoids over-scoping:
- 2 players max
- co-op only
- host-authoritative
- lightweight signalling server
- WebRTC data channel
- no heavy frontend frameworks required
