export const CONFIG = {
  arena: {
    width: 1280,
    height: 720,
    padding: 48,
  },
  sim: {
    tickRate: 60,
    snapshotRate: 18,
    inputRate: 24,
    maxDelta: 1 / 20,
  },
  ui: {
    damageTextLifetime: 0.75,
    pickupTextLifetime: 1.1,
    bannerLifetime: 2,
  },
  playerDefaults: {
    radius: 18,
    maxHp: 100,
    moveSpeed: 260,
    baseFireCooldown: 0.32,
    damage: 16,
    pickupRadius: 88,
    projectileSpeed: 620,
    critChance: 0.12,
    critMultiplier: 1.8,
    projectileCount: 1,
  },
  wave: {
    startEnemies: 6,
    addPerWave: 2,
    spawnIntervalBase: 1.7,
    spawnIntervalFloor: 0.45,
    startDelay: 2.2,
  },
  pickups: {
    healthValue: 28,
    healthDropChance: 0.14,
  },
  networking: {
    signalPath: "/ws",
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  },
};

export const UPGRADES = [
  {
    id: "fireRate",
    label: "Turbo Trigger",
    description: "Shoots faster.",
    apply: (player) => {
      player.baseFireCooldown = Math.max(0.11, player.baseFireCooldown * 0.86);
    },
  },
  {
    id: "damage",
    label: "Meaner Bullets",
    description: "More damage per hit.",
    apply: (player) => {
      player.damage += 5;
    },
  },
  {
    id: "projectile",
    label: "Forked Burst",
    description: "Adds another projectile.",
    apply: (player) => {
      player.projectileCount = Math.min(4, player.projectileCount + 1);
    },
  },
  {
    id: "speed",
    label: "Panic Sneakers",
    description: "Move faster.",
    apply: (player) => {
      player.moveSpeed += 26;
    },
  },
  {
    id: "pickupRadius",
    label: "Snack Magnet",
    description: "Vacuum up XP wider.",
    apply: (player) => {
      player.pickupRadius += 22;
    },
  },
];

export const ENEMY_ARCHETYPES = {
  tank: {
    type: "tank",
    radius: 24,
    speed: 74,
    maxHp: 64,
    damage: 18,
    touchCooldown: 0.8,
    color: "#8dff63",
    accent: "#d8ff98",
    score: 18,
    xp: 16,
  },
  runner: {
    type: "runner",
    radius: 15,
    speed: 118,
    maxHp: 32,
    damage: 10,
    touchCooldown: 0.65,
    color: "#ff7e67",
    accent: "#ffc29f",
    score: 10,
    xp: 12,
  },
};

export const PLAYER_THEMES = {
  host: {
    fill: "#59f3ff",
    accent: "#a7fbff",
    glow: "rgba(89, 243, 255, 0.45)",
    label: "HOST",
  },
  guest: {
    fill: "#ff5cb8",
    accent: "#ffbfdc",
    glow: "rgba(255, 92, 184, 0.42)",
    label: "GUEST",
  },
};
