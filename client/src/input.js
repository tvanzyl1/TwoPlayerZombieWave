export function createInputManager() {
  const pressed = new Set();
  let seq = 0;

  window.addEventListener("keydown", (event) => {
    pressed.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    pressed.delete(event.code);
  });

  window.addEventListener("blur", () => {
    pressed.clear();
  });

  function axis(negative, positive) {
    let value = 0;
    if (pressed.has(negative)) {
      value -= 1;
    }
    if (pressed.has(positive)) {
      value += 1;
    }
    return value;
  }

  function normalize(dx, dy) {
    if (!dx && !dy) {
      return { x: 0, y: 0 };
    }

    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  return {
    getHostInput() {
      const vector = normalize(axis("KeyA", "KeyD"), axis("KeyW", "KeyS"));
      seq += 1;
      return { seq, dx: vector.x, dy: vector.y };
    },
    getGuestInput() {
      const vector = normalize(axis("ArrowLeft", "ArrowRight"), axis("ArrowUp", "ArrowDown"));
      seq += 1;
      return { seq, dx: vector.x, dy: vector.y };
    },
    getOnlineLocalInput() {
      const vector = normalize(axis("KeyA", "KeyD"), axis("KeyW", "KeyS"));
      seq += 1;
      return { seq, dx: vector.x, dy: vector.y };
    },
  };
}
