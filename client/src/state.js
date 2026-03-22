import { CONFIG, PLAYER_THEMES } from "./config.js";

let nextEntityId = 1;

export function createGameState() {
  nextEntityId = 1;
  return {
    phase: "menu",
    mode: "menu",
    roomCode: "",
    sessionId: 0,
    startedAt: 0,
    elapsed: 0,
    score: 0,
    wave: 0,
    waveTimer: CONFIG.wave.startDelay,
    spawnTimer: 0,
    gameOver: false,
    players: [],
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],
    banners: [],
    stats: {
      totalKills: 0,
    },
  };
}

export function makePlayer({ id, name, role, x, y }) {
  const base = CONFIG.playerDefaults;
  const theme = PLAYER_THEMES[role] ?? PLAYER_THEMES.host;
  return {
    id,
    name,
    role,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: base.radius,
    maxHp: base.maxHp,
    hp: base.maxHp,
    moveSpeed: base.moveSpeed,
    baseFireCooldown: base.baseFireCooldown,
    fireCooldown: 0.15,
    damage: base.damage,
    pickupRadius: base.pickupRadius,
    projectileSpeed: base.projectileSpeed,
    projectileCount: base.projectileCount,
    critChance: base.critChance,
    critMultiplier: base.critMultiplier,
    xp: 0,
    level: 1,
    xpToNext: 70,
    alive: true,
    kills: 0,
    scoreContribution: 0,
    lastInputSeq: 0,
    upgradeHistory: [],
    theme,
    label: theme.label,
  };
}

export function makeEffect(effect) {
  return {
    id: allocateId("fx"),
    age: 0,
    ...effect,
  };
}

export function makeBanner(text, tone = "neutral") {
  return {
    id: allocateId("banner"),
    text,
    tone,
    age: 0,
  };
}

export function allocateId(prefix = "id") {
  const id = `${prefix}-${nextEntityId}`;
  nextEntityId += 1;
  return id;
}

export function clampToArena(entity) {
  const width = CONFIG.arena.width;
  const height = CONFIG.arena.height;
  entity.x = Math.max(entity.radius, Math.min(width - entity.radius, entity.x));
  entity.y = Math.max(entity.radius, Math.min(height - entity.radius, entity.y));
}

export function summarizeForHud(player) {
  return {
    id: player.id,
    role: player.role,
    name: player.name,
    label: player.label,
    hp: player.hp,
    maxHp: player.maxHp,
    xp: player.xp,
    xpToNext: player.xpToNext,
    level: player.level,
    alive: player.alive,
    kills: player.kills,
    scoreContribution: player.scoreContribution,
    theme: player.theme,
  };
}

export function serializeSnapshot(state) {
  return {
    type: "snapshot",
    sessionId: state.sessionId,
    elapsed: state.elapsed,
    score: state.score,
    wave: state.wave,
    waveTimer: state.waveTimer,
    phase: state.phase,
    gameOver: state.gameOver,
    stats: state.stats,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      role: player.role,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      hp: player.hp,
      maxHp: player.maxHp,
      xp: player.xp,
      xpToNext: player.xpToNext,
      level: player.level,
      alive: player.alive,
      kills: player.kills,
      scoreContribution: player.scoreContribution,
      label: player.label,
      theme: player.theme,
      moveSpeed: player.moveSpeed,
    })),
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      radius: enemy.radius,
      color: enemy.color,
      accent: enemy.accent,
    })),
    projectiles: state.projectiles.map((projectile) => ({
      id: projectile.id,
      x: projectile.x,
      y: projectile.y,
      radius: projectile.radius,
      color: projectile.color,
    })),
    pickups: state.pickups.map((pickup) => ({
      id: pickup.id,
      kind: pickup.kind,
      x: pickup.x,
      y: pickup.y,
      radius: pickup.radius,
      value: pickup.value,
    })),
    effects: state.effects.slice(-24),
    banners: state.banners.slice(-3),
  };
}
