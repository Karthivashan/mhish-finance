/** Collision-safe unique ids, e.g. `tx_3f2b…`. */
export function uid(prefix = 'id') {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}
