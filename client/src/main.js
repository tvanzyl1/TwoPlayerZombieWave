import { CONFIG } from "./config.js";
import { GameController } from "./game.js";
import { createInputManager } from "./input.js";
import { NetClient } from "./net.js";
import { createRenderer } from "./render.js";

const canvas = document.getElementById("gameCanvas");
const hudTop = document.getElementById("hudTop");
const hudBottom = document.getElementById("hudBottom");
const overlay = document.getElementById("overlay");

const hostButton = document.getElementById("hostButton");
const joinButton = document.getElementById("joinButton");
const debugButton = document.getElementById("debugButton");
const roomCodeInput = document.getElementById("roomCodeInput");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const connectionState = document.getElementById("connectionState");
const statusText = document.getElementById("statusText");

const controller = new GameController();
const renderer = createRenderer(canvas, hudTop, hudBottom, overlay);
const inputs = createInputManager();

let net;
let lastFrame = performance.now();
let snapshotAccumulator = 0;
let inputAccumulator = 0;

function setStatus(text, stateLabel = "Busy") {
  statusText.textContent = text;
  connectionState.textContent = stateLabel;
}

function ensureNet() {
  if (net) {
    return net;
  }

  net = new NetClient({
    onStatus: (text) => setStatus(text, controller.state.mode === "host" ? "Hosting" : "Connected"),
    onRoomCode: (code) => {
      roomCodeDisplay.textContent = code;
      controller.state.roomCode = code;
    },
    onData: (message) => {
      if (message.type === "input" && controller.state.mode === "host") {
        controller.setPendingInput("guest", message.payload);
      }
      if (message.type === "snapshot" && controller.state.mode !== "host") {
        controller.applySnapshot(message.payload, "guest");
      }
      if (message.type === "hello") {
        setStatus("Peer connected. Starting match.", "Connected");
        if (controller.state.mode === "guest") {
          controller.state.phase = "playing";
        }
      }
    },
    onGuestJoined: () => {
      controller.enableGuestPlayer();
      setStatus("Guest joined. WebRTC handshake in progress.", "Hosting");
    },
    onDisconnected: () => {
      setStatus("Remote player disconnected. Host again or retry the join.", "Disconnected");
    },
  });

  return net;
}

hostButton.addEventListener("click", async () => {
  controller.startHostedSession();
  roomCodeDisplay.textContent = "....";
  setStatus("Creating room on signalling server...", "Hosting");
  try {
    await ensureNet().hostGame();
  } catch (error) {
    setStatus(error.message, "Error");
  }
});

joinButton.addEventListener("click", async () => {
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  if (!roomCode) {
    setStatus("Enter a room code first.", "Idle");
    return;
  }

  controller.startGuestView();
  roomCodeDisplay.textContent = roomCode;
  setStatus(`Joining room ${roomCode}...`, "Joining");
  try {
    await ensureNet().joinGame(roomCode);
  } catch (error) {
    setStatus(error.message, "Error");
  }
});

debugButton.addEventListener("click", () => {
  controller.startLocalDebug();
  roomCodeDisplay.textContent = "LOCAL";
  setStatus("Debug co-op active. WASD + Arrow Keys.", "Debug");
});

controller.onSnapshot((snapshot) => {
  ensureNet().sendData({ type: "snapshot", payload: snapshot });
});

function tick(now) {
  const dt = Math.min(CONFIG.sim.maxDelta, (now - lastFrame) / 1000);
  lastFrame = now;

  if (controller.state.mode === "local") {
    controller.updateHost(dt, inputs.getHostInput(), inputs.getGuestInput());
  } else if (controller.state.mode === "host") {
    const hostInput = inputs.getOnlineLocalInput();
    const guestInput = controller.pendingInputs.get("guest") ?? { seq: 0, dx: 0, dy: 0 };
    controller.updateHost(dt, hostInput, guestInput);

    snapshotAccumulator += dt;
    if (snapshotAccumulator >= 1 / CONFIG.sim.snapshotRate) {
      snapshotAccumulator = 0;
      controller.emitSnapshot();
    }
  } else if (controller.state.mode === "guest") {
    const input = inputs.getOnlineLocalInput();
    controller.setLatestLocalInput(input);
    controller.predictGuest(dt);
    inputAccumulator += dt;
    if (inputAccumulator >= 1 / CONFIG.sim.inputRate) {
      inputAccumulator = 0;
      ensureNet().sendData({ type: "input", payload: input });
    }
  }

  renderer.render(controller.state, controller.getHudData());
  requestAnimationFrame(tick);
}

renderer.render(controller.state, controller.getHudData());
requestAnimationFrame(tick);
