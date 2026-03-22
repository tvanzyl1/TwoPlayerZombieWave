# Zombie Mayhem Co-op

A 2-player online co-op top-down zombie wave survival prototype built with plain JavaScript, Canvas, WebRTC data channels, and a tiny Node.js signalling server.

## Features

- Host creates a short room code, guest joins with that code
- Host-authoritative simulation for player movement, enemies, bullets, pickups, waves, and score
- Local 2-player debug mode for validating shared simulation before online play
- Auto-aim, auto-fire, XP pickups, health pickups, level-ups, and endless wave escalation
- Canvas HUD, overlays, floating combat text, glows, and arcade-style presentation

## Tech Stack

- Client: HTML, CSS, JavaScript ES modules, Canvas
- Networking: WebRTC data channel
- Signalling: Node.js + WebSocket (`ws`)

## Project Structure

- `client/`
  - `index.html`
  - `style.css`
  - `src/main.js`
  - `src/config.js`
  - `src/state.js`
  - `src/input.js`
  - `src/render.js`
  - `src/game.js`
  - `src/net.js`
- `server/server.js`

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in two tabs or two devices on the same reachable host.

## Host / Join Flow

- Host clicks `Host Game`
- Server creates a 4-character room code
- Guest enters the code and clicks `Join Game`
- The signalling server relays WebRTC SDP/ICE handshake traffic
- Once the data channel opens, the host simulates the match and sends snapshots
- The guest sends input only and renders the host-authoritative state

## Deployment Guidance

- The browser client is static and can be hosted on GitHub Pages, Netlify, or any static host
- Multiplayer still needs a signalling service running somewhere reachable by both players
- The signalling server can be deployed to Render, Railway, Fly.io, or a VPS
- WebRTC carries gameplay traffic peer-to-peer after signalling completes

## Known Limitations

- Guest prediction is intentionally light and may still show correction under latency
- Upgrade choices are auto-selected by the host simulation for prototype scope
- Audio is not implemented yet
- Mobile controls are not implemented
- For internet play, HTTPS hosting is recommended so browsers allow WebRTC cleanly

## Architecture Summary

- `server/server.js` only handles room creation, room joins, and signalling relay
- The host browser owns final gameplay truth
- The guest browser sends movement input only
- Rendering is separated from simulation so the host loop can remain authoritative
