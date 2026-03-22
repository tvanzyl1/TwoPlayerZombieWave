import { CONFIG } from "./config.js";

function round(value) {
  return Math.max(0, Math.round(value));
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function createRenderer(canvas, hudTop, hudBottom, overlay) {
  const ctx = canvas.getContext("2d");
  canvas.width = CONFIG.arena.width;
  canvas.height = CONFIG.arena.height;

  function drawArena(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(640, 360, 120, 640, 360, 720);
    gradient.addColorStop(0, "rgba(41, 78, 120, 0.34)");
    gradient.addColorStop(1, "rgba(3, 7, 14, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    state.pickups.forEach((pickup) => {
      ctx.save();
      const pulse = 1 + Math.sin(performance.now() / 180 + pickup.x * 0.02) * 0.15;
      ctx.translate(pickup.x, pickup.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = pickup.kind === "xp" ? "#a8ff71" : "#72ffe6";
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "15px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pickup.kind === "xp" ? "✦" : "+", 0, 0);
      ctx.restore();
    });

    state.projectiles.forEach((projectile) => {
      ctx.save();
      ctx.fillStyle = projectile.color;
      ctx.shadowBlur = 18;
      ctx.shadowColor = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    state.enemies.forEach((enemy) => {
      ctx.save();
      ctx.fillStyle = enemy.color;
      ctx.shadowBlur = 16;
      ctx.shadowColor = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = enemy.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      const hpWidth = enemy.radius * 2.2;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - enemy.radius - 14, hpWidth, 5);
      ctx.fillStyle = enemy.accent;
      ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - enemy.radius - 14, hpWidth * (enemy.hp / enemy.maxHp), 5);
      ctx.restore();
    });

    state.players.forEach((player) => {
      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = player.theme.glow;
      ctx.strokeStyle = player.theme.accent;
      ctx.lineWidth = 4;
      ctx.fillStyle = player.alive ? player.theme.fill : "rgba(138, 147, 165, 0.45)";
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 9, 0, Math.PI * 2);
      ctx.strokeStyle = player.theme.fill;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(player.label, player.x, player.y - player.radius - 18);
      ctx.restore();
    });

    state.effects.forEach((effect) => {
      const progress = effect.age / effect.lifetime;
      if (effect.type === "damage" || effect.type === "pickup") {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = effect.color;
        ctx.font = effect.type === "damage" ? "700 18px 'Space Grotesk'" : "700 16px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText(effect.text, effect.x, effect.y - progress * 20);
        ctx.restore();
      }

      if (effect.type === "burst" || effect.type === "muzzle") {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = effect.type === "burst" ? 5 : 3;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 8 + progress * (effect.type === "burst" ? 24 : 14), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  function renderHud(hud) {
    hudTop.innerHTML = "";
    hudBottom.innerHTML = "";

    const pills = [
      { label: `Wave ${hud.wave}`, tone: "#c8ff6a" },
      { label: `Score ${round(hud.score)}`, tone: "#59f3ff" },
      { label: `Time ${formatTime(hud.elapsed)}`, tone: "#ff9d54" },
      { label: `Kills ${round(hud.totalKills)}`, tone: "#ff5cb8" },
    ];

    if (hud.roomCode) {
      pills.push({ label: `Room ${hud.roomCode}`, tone: "#ffffff" });
    }

    pills.forEach((pill) => {
      const element = document.createElement("div");
      element.className = "hud-pill";
      element.innerHTML = `<span style="color:${pill.tone}">●</span><span>${pill.label}</span>`;
      hudTop.appendChild(element);
    });

    hud.players.forEach((player) => {
      const healthPercent = player.maxHp ? player.hp / player.maxHp : 0;
      const xpPercent = player.xpToNext ? player.xp / player.xpToNext : 0;
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `
        <div>
          <strong>${player.label}</strong>
          <div style="font-size:12px;color:#9fb7d3;">LV ${player.level} · ${player.kills} kills</div>
        </div>
        <div style="display:grid;gap:6px;min-width:120px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;color:#9fb7d3;">HP</span>
            <div class="meter"><span style="width:${healthPercent * 100}%;background:${player.theme.fill};"></span></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;color:#9fb7d3;">XP</span>
            <div class="meter"><span style="width:${xpPercent * 100}%;background:#c8ff6a;"></span></div>
          </div>
        </div>
      `;
      hudBottom.appendChild(card);
    });

    overlay.innerHTML = "";
    const freshBanner = hud.banners[hud.banners.length - 1];
    if (hud.phase === "menu") {
      overlay.innerHTML = `<div class="overlay-card"><h2>Host the Horde</h2><p>Spin up a room, share the code, and turn the arena into a glow-stick disaster scene.</p></div>`;
    } else if (hud.phase === "connecting") {
      overlay.innerHTML = `<div class="overlay-card"><h2>Connecting...</h2><p>Negotiating peer mayhem. Keep this tab open while the room handshake finishes.</p></div>`;
    } else if (hud.phase === "lobby") {
      overlay.innerHTML = `<div class="overlay-card"><h2>Room Primed</h2><p>Share the room code with your co-op partner. The host starts simulating when the guest lands.</p></div>`;
    } else if (hud.phase === "game_over") {
      overlay.innerHTML = `<div class="overlay-card"><h2>Everybody Died</h2><p>Wave ${hud.wave}, ${formatTime(hud.elapsed)} survived. Hit Host or Debug to start another mess.</p></div>`;
    } else if (freshBanner) {
      overlay.innerHTML = `<div class="overlay-card" style="padding:18px 22px;"><h2>${freshBanner.text}</h2></div>`;
    }
  }

  return {
    render(state, hud) {
      drawArena(state);
      renderHud(hud);
    },
  };
}


