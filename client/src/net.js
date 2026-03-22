import { CONFIG } from "./config.js";

function makeSignalUrl(customBaseUrl) {
  if (customBaseUrl) {
    const url = new URL(customBaseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = CONFIG.networking.signalPath;
    return url.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${CONFIG.networking.signalPath}`;
}

export class NetClient {
  constructor({ onStatus, onRoomCode, onData, onGuestJoined, onDisconnected }) {
    this.onStatus = onStatus;
    this.onRoomCode = onRoomCode;
    this.onData = onData;
    this.onGuestJoined = onGuestJoined;
    this.onDisconnected = onDisconnected;
    this.socket = null;
    this.peer = null;
    this.channel = null;
    this.role = "idle";
    this.roomCode = "";
  }

  async connectSignal(baseUrl) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise((resolve, reject) => {
      const socket = new WebSocket(makeSignalUrl(baseUrl));
      this.socket = socket;
      socket.addEventListener("open", () => {
        this.onStatus("Signal server connected.");
        resolve();
      });
      socket.addEventListener("error", () => {
        reject(new Error("Failed to connect to signalling server."));
      });
      socket.addEventListener("close", () => {
        this.onStatus("Signal server disconnected.");
        this.onDisconnected();
      });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        this.handleSignalMessage(message);
      });
    });
  }

  sendSignal(message) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  async hostGame(baseUrl) {
    this.role = "host";
    await this.connectSignal(baseUrl);
    this.sendSignal({ type: "create_room" });
  }

  async joinGame(roomCode, baseUrl) {
    this.role = "guest";
    await this.connectSignal(baseUrl);
    this.sendSignal({ type: "join_room", roomCode });
  }

  async handleSignalMessage(message) {
    if (message.type === "room_created") {
      this.roomCode = message.roomCode;
      this.onRoomCode(this.roomCode);
      this.onStatus(`Room ${message.roomCode} created. Waiting for guest.`);
      await this.createPeerConnection(true);
      return;
    }

    if (message.type === "join_accepted") {
      this.roomCode = message.roomCode;
      this.onRoomCode(this.roomCode);
      this.onStatus(`Joined room ${message.roomCode}. Waiting for host handshake.`);
      await this.createPeerConnection(false);
      this.sendSignal({ type: "peer_ready", roomCode: this.roomCode });
      return;
    }

    if (message.type === "join_rejected") {
      this.onStatus(message.reason || "Join rejected.");
      return;
    }

    if (message.type === "peer_ready" && this.role === "host") {
      this.onStatus("Guest connected to room. Building data channel.");
      this.onGuestJoined();
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      this.sendSignal({ type: "signal", roomCode: this.roomCode, payload: { sdp: this.peer.localDescription } });
      return;
    }

    if (message.type === "signal") {
      await this.handlePeerSignal(message.payload);
      return;
    }

    if (message.type === "peer_left") {
      this.onStatus("Remote player disconnected.");
      this.onDisconnected();
      return;
    }

    if (message.type === "error") {
      this.onStatus(message.message || "Server error.");
    }
  }

  async createPeerConnection(isHost) {
    this.peer?.close();
    this.peer = new RTCPeerConnection({ iceServers: CONFIG.networking.iceServers });

    this.peer.addEventListener("icecandidate", (event) => {
      if (!event.candidate) {
        return;
      }
      this.sendSignal({
        type: "signal",
        roomCode: this.roomCode,
        payload: { candidate: event.candidate },
      });
    });

    this.peer.addEventListener("connectionstatechange", () => {
      const state = this.peer?.connectionState ?? "closed";
      if (state === "connected") {
        this.onStatus("Peer linked. Zombie business is live.");
      } else if (["disconnected", "failed", "closed"].includes(state)) {
        this.onStatus(`Peer ${state}.`);
        this.onDisconnected();
      }
    });

    if (isHost) {
      this.channel = this.peer.createDataChannel("gameplay", { ordered: true });
      this.bindChannel();
    } else {
      this.peer.addEventListener("datachannel", (event) => {
        this.channel = event.channel;
        this.bindChannel();
      });
    }
  }

  bindChannel() {
    if (!this.channel) {
      return;
    }

    this.channel.addEventListener("open", () => {
      this.onStatus("Gameplay data channel open.");
      this.sendData({ type: "hello", payload: { role: this.role } });
    });
    this.channel.addEventListener("close", () => {
      this.onStatus("Gameplay data channel closed.");
      this.onDisconnected();
    });
    this.channel.addEventListener("message", (event) => {
      this.onData(JSON.parse(event.data));
    });
  }

  async handlePeerSignal(payload) {
    if (payload.ready) {
      return;
    }

    if (payload.sdp) {
      await this.peer.setRemoteDescription(payload.sdp);
      if (payload.sdp.type === "offer") {
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        this.sendSignal({ type: "signal", roomCode: this.roomCode, payload: { sdp: this.peer.localDescription } });
      }
    }

    if (payload.candidate) {
      try {
        await this.peer.addIceCandidate(payload.candidate);
      } catch (error) {
        this.onStatus(`ICE candidate skipped: ${error.message}`);
      }
    }
  }

  sendData(message) {
    if (this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify(message));
    }
  }
}
