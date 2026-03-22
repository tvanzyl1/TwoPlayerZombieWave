# 04 — Signalling Server

Implement the lightweight signalling server needed for host/join multiplayer.

## Goal

Create a tiny Node.js signalling service that helps two browser peers connect.

## Important constraint

The signalling server does **not** simulate gameplay.
It only handles:
- room creation
- room joining
- peer discovery
- relaying WebRTC SDP/ICE messages
- basic room lifecycle cleanup

## Requirements

Support:
- host creates room
- server returns short room code
- guest joins existing room code
- max 2 peers per room
- reject invalid or full room joins gracefully
- relay signalling messages only to relevant room peer
- clean up disconnected rooms/peers safely

## Message model

Use a simple JSON protocol with message types like:
- `create_room`
- `room_created`
- `join_room`
- `join_accepted`
- `join_rejected`
- `peer_ready`
- `signal`
- `peer_left`
- `error`

You may adjust names, but keep them clean and documented.

## Reliability

Add:
- basic validation
- clear logging
- safe cleanup on disconnect
- no crash if peer disconnects mid-handshake

## Developer experience

Document:
- how to run the server
- default port
- how client points to it

## Deliverables

- working `server/server.js`
- room management
- signalling relay
- basic documentation comments
