# 01 — Project Setup

Create the initial project skeleton for a **2-player online co-op top-down zombie survival shooter**.

## Goal

Set up a clean repo with a browser client and a small signalling server.

## Required output

Create this structure:

- `client/index.html`
- `client/style.css`
- `client/src/main.js`
- `client/src/config.js`
- `client/src/state.js`
- `client/src/input.js`
- `client/src/render.js`
- `client/src/game.js`
- `client/src/net.js`
- `server/server.js`
- `package.json`
- `.gitignore`
- `README.md`

## Client requirements

- Canvas-based top-down game
- Dark arcade background
- Bright punchy UI
- A simple placeholder menu screen with:
  - title
  - Host Game button
  - Join Game button
  - room code input
  - status text area
- Main canvas area
- Basic HUD placeholders

## Server requirements

- Node.js signalling server
- WebSocket-based
- Minimal dependencies only
- Can create room codes and relay signalling messages between 2 peers
- No gameplay simulation on server

## Technical rules

- Use plain JavaScript, not TypeScript
- No frontend framework
- Keep modules small and readable
- Use ES modules in browser where appropriate
- Add npm scripts:
  - `start`
  - `server`
  - `dev` if useful
- Add comments describing which files are responsible for:
  - rendering
  - gameplay state
  - networking
  - host/join flow

## UX requirements

Menu should immediately communicate:
- this is a 2-player co-op game
- one player hosts
- another joins by code
- game is wave survival chaos

## Deliverables

- Create all files with starter content
- Ensure app loads without crashing
- Ensure signalling server starts
- Update `README.md` with how to run client and server locally
