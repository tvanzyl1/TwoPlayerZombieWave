const fs = require("fs");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const CLIENT_ROOT = path.resolve(__dirname, "..", "client");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const rooms = new Map();

function log(message, extra = "") {
  console.log(`[signal] ${message}${extra ? ` ${extra}` : ""}`);
}

function randomRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

function createUniqueRoomCode() {
  let code = randomRoomCode();
  while (rooms.has(code)) {
    code = randomRoomCode();
  }
  return code;
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function attachPeerState(socket) {
  socket.peerState = {
    roomCode: "",
    role: "",
  };
}

function removeFromRoom(socket) {
  const roomCode = socket.peerState?.roomCode;
  if (!roomCode || !rooms.has(roomCode)) {
    return;
  }

  const room = rooms.get(roomCode);
  if (room.host === socket) {
    room.host = null;
    if (room.guest) {
      send(room.guest, { type: "peer_left" });
      room.guest.peerState.roomCode = "";
    }
  }

  if (room.guest === socket) {
    room.guest = null;
    if (room.host) {
      send(room.host, { type: "peer_left" });
    }
  }

  if (!room.host && !room.guest) {
    rooms.delete(roomCode);
    log("room deleted", roomCode);
  }

  socket.peerState.roomCode = "";
  socket.peerState.role = "";
}

function handleCreateRoom(socket) {
  removeFromRoom(socket);
  const roomCode = createUniqueRoomCode();
  rooms.set(roomCode, { code: roomCode, host: socket, guest: null });
  socket.peerState.roomCode = roomCode;
  socket.peerState.role = "host";
  send(socket, { type: "room_created", roomCode });
  log("room created", roomCode);
}

function handleJoinRoom(socket, roomCodeRaw) {
  const roomCode = String(roomCodeRaw || "").trim().toUpperCase();
  if (!roomCode || !rooms.has(roomCode)) {
    send(socket, { type: "join_rejected", reason: "Room code not found." });
    return;
  }

  const room = rooms.get(roomCode);
  if (!room.host) {
    send(socket, { type: "join_rejected", reason: "Host disconnected." });
    rooms.delete(roomCode);
    return;
  }

  if (room.guest) {
    send(socket, { type: "join_rejected", reason: "Room is already full." });
    return;
  }

  removeFromRoom(socket);
  room.guest = socket;
  socket.peerState.roomCode = roomCode;
  socket.peerState.role = "guest";
  send(socket, { type: "join_accepted", roomCode });
  send(room.host, { type: "peer_ready", roomCode });
  log("guest joined", roomCode);
}

function relayToPeer(socket, payload) {
  const roomCode = socket.peerState?.roomCode;
  if (!roomCode || !rooms.has(roomCode)) {
    send(socket, { type: "error", message: "Not in a room." });
    return;
  }

  const room = rooms.get(roomCode);
  const target = socket.peerState.role === "host" ? room.guest : room.host;
  if (!target) {
    send(socket, { type: "error", message: "Peer not connected." });
    return;
  }

  send(target, { type: "signal", roomCode, payload });
}

function handleMessage(socket, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch (error) {
    send(socket, { type: "error", message: "Invalid JSON payload." });
    return;
  }

  switch (message.type) {
    case "create_room":
      handleCreateRoom(socket);
      break;
    case "join_room":
      handleJoinRoom(socket, message.roomCode);
      break;
    case "peer_ready":
      if (socket.peerState.roomCode) {
        relayToPeer(socket, { ready: true });
      }
      break;
    case "signal":
      if (!message.payload || typeof message.payload !== "object") {
        send(socket, { type: "error", message: "Missing signal payload." });
        return;
      }
      relayToPeer(socket, message.payload);
      break;
    default:
      send(socket, { type: "error", message: `Unknown message type: ${message.type}` });
  }
}

const server = http.createServer((request, response) => {
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(CLIENT_ROOT, requestedPath.split("?")[0]);

  if (!filePath.startsWith(CLIENT_ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, { "Content-Type": MIME_TYPES[extension] || "application/octet-stream" });
    response.end(data);
  });
});

const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (socket) => {
  attachPeerState(socket);
  log("socket connected");

  socket.on("message", (raw) => {
    handleMessage(socket, raw);
  });

  socket.on("close", () => {
    removeFromRoom(socket);
    log("socket disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Zombie Mayhem server listening on http://localhost:${PORT}`);
});
