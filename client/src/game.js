import { CONFIG, ENEMY_ARCHETYPES, UPGRADES } from "./config.js";
import {
  allocateId,
  clampToArena,
  createGameState,
  makeBanner,
  makeEffect,
  makePlayer,
  serializeSnapshot,
  summarizeForHud,
} from "./state.js";

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickEnemyType() {
  return Math.random() < 0.35 ? ENEMY_ARCHETYPES.tank : ENEMY_ARCHETYPES.runner;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class GameController {
  constructor() {
    this.state = createGameState();
    this.pendingInputs = new Map();
    this.snapshotListeners = new Set();
    this.latestLocalInput = { seq: 0, dx: 0, dy: 0 };
  }

  onSnapshot(listener) {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  emitSnapshot() {
    const snapshot = serializeSnapshot(this.state);
    this.snapshotListeners.forEach((listener) => listener(snapshot));
  }

  startLocalDebug() {
    this.state = createGameState();
    this.state.phase = "playing";
    this.state.mode = "local";
    this.state.sessionId += 1;
    this.state.startedAt = performance.now();
    this.state.wave = 1;
    this.state.waveTimer = CONFIG.wave.startDelay;
    this.state.players = [
      makePlayer({ id: "host", name: "Player One", role: "host", x: 420, y: 360 }),
      makePlayer({ id: "guest", name: "Player Two", role: "guest", x: 860, y: 360 }),
    ];
    this.state.banners.push(makeBanner("DEBUG DUO ONLINE-ish", "good"));
  }

  startHostedSession(roomCode = "") {
    this.state = createGameState();
    this.state.phase = "lobby";
    this.state.mode = "host";
    this.state.roomCode = roomCode;
    this.state.sessionId += 1;
    this.state.startedAt = performance.now();
    this.state.wave = 1;
    this.state.waveTimer = CONFIG.wave.startDelay;
    this.state.players = [
      makePlayer({ id: "host", name: "Host", role: "host", x: 420, y: 360 }),
      makePlayer({ id: "guest", name: "Guest", role: "guest", x: 860, y: 360 }),
    ];
    this.state.players[1].alive = false;
    this.state.players[1].hp = 0;
    this.state.banners.push(makeBanner("ROOM HOT. WAITING FOR PAL.", "neutral"));
  }

  enableGuestPlayer() {
    const guest = this.state.players.find((player) => player.id === "guest");
    if (!guest) {
      return;
    }
    guest.alive = true;
    guest.hp = guest.maxHp;
    this.state.phase = "playing";
    guest.x = 860;
    guest.y = 360;
    this.state.banners.push(makeBanner("GUEST DROPPED IN", "good"));
  }

  startGuestView() {
    this.state = createGameState();
    this.state.phase = "connecting";
    this.state.mode = "guest";
    this.state.players = [
      makePlayer({ id: "host", name: "Host", role: "host", x: 420, y: 360 }),
      makePlayer({ id: "guest", name: "Guest", role: "guest", x: 860, y: 360 }),
    ];
  }

  setPendingInput(playerId, input) {
    this.pendingInputs.set(playerId, input);
  }

  setLatestLocalInput(input) {
    this.latestLocalInput = input;
  }

  applySnapshot(snapshot, localPlayerId = "guest") {
    if (snapshot.sessionId && snapshot.sessionId < this.state.sessionId) {
      return;
    }

    const currentPlayers = new Map(this.state.players.map((player) => [player.id, player]));
    this.state.sessionId = snapshot.sessionId ?? this.state.sessionId;
    this.state.phase = snapshot.phase;
    this.state.mode = "guest";
    this.state.elapsed = snapshot.elapsed;
    this.state.score = snapshot.score;
    this.state.wave = snapshot.wave;
    this.state.waveTimer = snapshot.waveTimer;
    this.state.gameOver = snapshot.gameOver;
    this.state.stats = snapshot.stats;
    this.state.players = snapshot.players.map((playerSnapshot) => {
      const existing = currentPlayers.get(playerSnapshot.id);
      if (!existing) {
        return { ...playerSnapshot };
      }

      const isLocal = playerSnapshot.id === localPlayerId;
      return {
        ...existing,
        ...playerSnapshot,
        x: isLocal ? lerp(existing.x, playerSnapshot.x, 0.42) : lerp(existing.x, playerSnapshot.x, 0.7),
        y: isLocal ? lerp(existing.y, playerSnapshot.y, 0.42) : lerp(existing.y, playerSnapshot.y, 0.7),
      };
    });
    this.state.enemies = snapshot.enemies;
    this.state.projectiles = snapshot.projectiles;
    this.state.pickups = snapshot.pickups;
    this.state.effects = snapshot.effects ?? [];
    this.state.banners = snapshot.banners ?? [];
  }

  predictGuest(dt) {
    if (this.state.mode !== "guest" || this.state.phase !== "playing") {
      return;
    }
    const guest = this.state.players.find((player) => player.id === "guest");
    if (!guest || !guest.alive) {
      return;
    }

    guest.vx = this.latestLocalInput.dx * guest.moveSpeed;
    guest.vy = this.latestLocalInput.dy * guest.moveSpeed;
    guest.x += guest.vx * dt;
    guest.y += guest.vy * dt;
    clampToArena(guest);
  }

  updateHost(dt, hostInput, guestInput) {
    if (this.state.phase !== "playing") {
      return;
    }

    this.state.elapsed += dt;
    this.updateWaveFlow(dt);
    this.updatePlayers(dt, hostInput, guestInput);
    this.spawnEnemiesIfNeeded(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateEffects(dt);
    this.cleanupDead();
    this.checkGameOver();
  }

  updateWaveFlow(dt) {
    this.state.waveTimer -= dt;
    if (this.state.waveTimer <= 0) {
      this.state.wave += 1;
      this.state.waveTimer = 18;
      this.state.banners.push(makeBanner(`WAVE ${this.state.wave} HAS BITE`, "warning"));
      const spawnBurst = CONFIG.wave.startEnemies + this.state.wave * CONFIG.wave.addPerWave;
      for (let index = 0; index < spawnBurst; index += 1) {
        this.spawnEnemy();
      }
    }
  }

  updatePlayers(dt, hostInput, guestInput) {
    this.state.players.forEach((player) => {
      const input = player.id === "host" ? hostInput : guestInput;
      const activeInput = input ?? { dx: 0, dy: 0, seq: player.lastInputSeq };
      player.lastInputSeq = activeInput.seq ?? player.lastInputSeq;

      if (!player.alive) {
        player.vx = 0;
        player.vy = 0;
        return;
      }

      player.vx = activeInput.dx * player.moveSpeed;
      player.vy = activeInput.dy * player.moveSpeed;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      clampToArena(player);

      player.fireCooldown -= dt;
      if (player.fireCooldown <= 0) {
        this.tryAutoFire(player);
      }
    });
  }

  tryAutoFire(player) {
    const targets = this.state.enemies
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - player.x, enemy.y - player.y) }))
      .sort((left, right) => left.distance - right.distance);

    if (!targets.length || targets[0].distance > 360) {
      player.fireCooldown = 0.08;
      return;
    }

    const target = targets[0].enemy;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const total = player.projectileCount;
    for (let index = 0; index < total; index += 1) {
      const spread = total === 1 ? 0 : (index - (total - 1) / 2) * 0.16;
      const angle = baseAngle + spread;
      this.state.projectiles.push({
        id: allocateId("proj"),
        ownerId: player.id,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * player.projectileSpeed,
        vy: Math.sin(angle) * player.projectileSpeed,
        radius: 6,
        life: 1.3,
        damage: player.damage,
        critChance: player.critChance,
        critMultiplier: player.critMultiplier,
        color: player.theme.fill,
      });
    }

    player.fireCooldown = player.baseFireCooldown;
    this.state.effects.push(
      makeEffect({
        type: "muzzle",
        x: player.x,
        y: player.y,
        lifetime: 0.14,
        color: player.theme.fill,
      }),
    );
  }

  spawnEnemiesIfNeeded(dt) {
    const alivePlayers = this.state.players.filter((player) => player.alive);
    if (!alivePlayers.length) {
      return;
    }

    this.state.spawnTimer -= dt;
    if (this.state.spawnTimer > 0) {
      return;
    }

    const desired = Math.min(32, 5 + this.state.wave * 2 + alivePlayers.length * 3);
    if (this.state.enemies.length < desired) {
      this.spawnEnemy();
    }

    const next = Math.max(
      CONFIG.wave.spawnIntervalFloor,
      CONFIG.wave.spawnIntervalBase - this.state.wave * 0.08,
    );
    this.state.spawnTimer = next;
  }

  spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    const archetype = pickEnemyType();
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = randomRange(0, CONFIG.arena.width);
      y = -30;
    } else if (edge === 1) {
      x = CONFIG.arena.width + 30;
      y = randomRange(0, CONFIG.arena.height);
    } else if (edge === 2) {
      x = randomRange(0, CONFIG.arena.width);
      y = CONFIG.arena.height + 30;
    } else {
      x = -30;
      y = randomRange(0, CONFIG.arena.height);
    }

    this.state.enemies.push({
      id: allocateId("enemy"),
      x,
      y,
      vx: 0,
      vy: 0,
      hp: archetype.maxHp,
      maxHp: archetype.maxHp,
      radius: archetype.radius,
      speed: archetype.speed,
      damage: archetype.damage,
      touchCooldown: archetype.touchCooldown,
      touchTimer: 0,
      score: archetype.score,
      xp: archetype.xp,
      type: archetype.type,
      color: archetype.color,
      accent: archetype.accent,
    });
  }

  updateEnemies(dt) {
    this.state.enemies.forEach((enemy) => {
      enemy.touchTimer -= dt;
      const targets = this.state.players
        .filter((player) => player.alive)
        .map((player) => ({ player, distance: Math.hypot(player.x - enemy.x, player.y - enemy.y) }))
        .sort((left, right) => left.distance - right.distance);

      if (!targets.length) {
        return;
      }

      const target = targets[0].player;
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.vx = Math.cos(angle) * enemy.speed;
      enemy.vy = Math.sin(angle) * enemy.speed;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      const hitDistance = target.radius + enemy.radius - 4;
      if (targets[0].distance <= hitDistance && enemy.touchTimer <= 0) {
        target.hp = Math.max(0, target.hp - enemy.damage);
        enemy.touchTimer = enemy.touchCooldown;
        this.state.effects.push(
          makeEffect({
            type: "damage",
            x: target.x,
            y: target.y - 10,
            text: `-${enemy.damage}`,
            color: "#ff8da1",
            lifetime: CONFIG.ui.damageTextLifetime,
          }),
        );
        if (target.hp <= 0) {
          target.alive = false;
          this.state.banners.push(makeBanner(`${target.label} face-planted`, "danger"));
        }
      }
    });
  }

  updateProjectiles(dt) {
    this.state.projectiles.forEach((projectile) => {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      if (projectile.life <= 0) {
        projectile.dead = true;
        return;
      }

      const hit = this.state.enemies.find(
        (enemy) =>
          !enemy.dead && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <= enemy.radius + projectile.radius,
      );

      if (!hit) {
        return;
      }

      const owner = this.state.players.find((player) => player.id === projectile.ownerId);
      const crit = Math.random() < projectile.critChance;
      const damage = Math.round(projectile.damage * (crit ? projectile.critMultiplier : 1));
      hit.hp -= damage;
      projectile.dead = true;
      this.state.effects.push(
        makeEffect({
          type: "damage",
          x: hit.x,
          y: hit.y - 14,
          text: crit ? `CRIT ${damage}` : `${damage}`,
          color: crit ? "#ffe173" : "#ffffff",
          lifetime: CONFIG.ui.damageTextLifetime,
        }),
      );
      this.state.effects.push(
        makeEffect({
          type: "burst",
          x: hit.x,
          y: hit.y,
          color: crit ? "#ffe173" : projectile.color,
          lifetime: 0.2,
        }),
      );

      if (hit.hp <= 0) {
        hit.dead = true;
        if (owner) {
          owner.kills += 1;
          owner.scoreContribution += hit.score;
        }
        this.state.score += hit.score;
        this.state.stats.totalKills += 1;
        this.dropRewards(hit);
      }
    });
  }

  dropRewards(enemy) {
    this.state.pickups.push({
      id: allocateId("pickup"),
      kind: "xp",
      x: enemy.x,
      y: enemy.y,
      radius: 8,
      value: enemy.xp,
    });

    if (Math.random() < CONFIG.pickups.healthDropChance) {
      this.state.pickups.push({
        id: allocateId("pickup"),
        kind: "health",
        x: enemy.x + randomRange(-14, 14),
        y: enemy.y + randomRange(-14, 14),
        radius: 10,
        value: CONFIG.pickups.healthValue,
      });
    }

    this.state.effects.push(
      makeEffect({
        type: "burst",
        x: enemy.x,
        y: enemy.y,
        color: enemy.color,
        lifetime: 0.45,
      }),
    );
  }

  updatePickups(dt) {
    this.state.pickups.forEach((pickup) => {
      this.state.players.forEach((player) => {
        if (!player.alive) {
          return;
        }
        const distance = Math.hypot(player.x - pickup.x, player.y - pickup.y);
        if (distance < player.pickupRadius) {
          const angle = Math.atan2(player.y - pickup.y, player.x - pickup.x);
          const speed = 180 + (player.pickupRadius - distance) * 2.1;
          pickup.x += Math.cos(angle) * speed * dt;
          pickup.y += Math.sin(angle) * speed * dt;
        }

        if (distance <= player.radius + pickup.radius + 3) {
          pickup.dead = true;
          if (pickup.kind === "xp") {
            player.xp += pickup.value;
            this.state.effects.push(
              makeEffect({
                type: "pickup",
                x: player.x,
                y: player.y - 24,
                text: `+${pickup.value} XP`,
                color: "#9eff9d",
                lifetime: CONFIG.ui.pickupTextLifetime,
              }),
            );
            this.handleLevelUps(player);
          } else if (pickup.kind === "health") {
            player.hp = Math.min(player.maxHp, player.hp + pickup.value);
            this.state.effects.push(
              makeEffect({
                type: "pickup",
                x: player.x,
                y: player.y - 24,
                text: `+${pickup.value} HP`,
                color: "#73ffcc",
                lifetime: CONFIG.ui.pickupTextLifetime,
              }),
            );
          }
        }
      });
    });
  }

  handleLevelUps(player) {
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      player.xpToNext = Math.round(player.xpToNext * 1.22);
      const choices = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
      const selected = choices[Math.floor(Math.random() * choices.length)];
      selected.apply(player);
      player.upgradeHistory.push(selected.id);
      this.state.banners.push(makeBanner(`${player.label} nabbed ${selected.label}`, "good"));
      this.state.effects.push(
        makeEffect({
          type: "pickup",
          x: player.x,
          y: player.y - 40,
          text: `LEVEL ${player.level}! ${selected.label}`,
          color: "#ffe173",
          lifetime: 1.35,
        }),
      );
    }
  }

  updateEffects(dt) {
    this.state.effects.forEach((effect) => {
      effect.age += dt;
    });
    this.state.effects = this.state.effects.filter((effect) => effect.age < effect.lifetime);

    this.state.banners.forEach((banner) => {
      banner.age += dt;
    });
    this.state.banners = this.state.banners.filter((banner) => banner.age < CONFIG.ui.bannerLifetime);
  }

  cleanupDead() {
    this.state.enemies = this.state.enemies.filter((enemy) => !enemy.dead);
    this.state.projectiles = this.state.projectiles.filter(
      (projectile) =>
        !projectile.dead &&
        projectile.x >= -50 &&
        projectile.x <= CONFIG.arena.width + 50 &&
        projectile.y >= -50 &&
        projectile.y <= CONFIG.arena.height + 50,
    );
    this.state.pickups = this.state.pickups.filter((pickup) => !pickup.dead);
  }

  checkGameOver() {
    const anyoneAlive = this.state.players.some((player) => player.alive);
    this.state.gameOver = !anyoneAlive;
    if (this.state.gameOver) {
      this.state.phase = "game_over";
    }
  }

  getHudData() {
    return {
      phase: this.state.phase,
      mode: this.state.mode,
      wave: this.state.wave,
      elapsed: this.state.elapsed,
      score: this.state.score,
      roomCode: this.state.roomCode,
      players: this.state.players.map(summarizeForHud),
      banners: this.state.banners,
      totalKills: this.state.stats.totalKills,
    };
  }
}



