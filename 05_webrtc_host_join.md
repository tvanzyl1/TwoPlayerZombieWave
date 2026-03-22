# 05 — WebRTC Host / Join Flow

Connect the browser client to the signalling server and establish peer-to-peer gameplay connection.

## Goal

Implement the full host/join handshake.

## Required flow

### Host
- clicks Host Game
- client asks signalling server to create room
- room code is shown clearly
- host waits for guest
- host creates/accepts WebRTC connection
- once connected, host can start match

### Guest
- enters room code
- clicks Join Game
- client asks signalling server to join room
- if accepted, guest performs WebRTC handshake
- once connected, guest joins lobby/game

## UI requirements

Menu should clearly show:
- room code for host
- joining status
- connected / waiting / failed states
- retry-friendly messaging

## Networking requirements

- Use WebRTC data channel for gameplay data
- Use signalling server only for handshake
- Handle disconnects cleanly
- Show peer disconnected message if remote leaves

## Scope rule

Do not yet fully sync the whole game here if that complicates things.
First make sure:
- host can host
- guest can join
- connection state is visible
- a minimal data message can be sent both directions

## Test milestone

At the end of this step:
- host and guest can connect from separate browser tabs/devices
- they can exchange a small test payload over the data channel
- UI reflects success/failure clearly
