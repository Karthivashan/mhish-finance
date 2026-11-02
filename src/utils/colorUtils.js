/** "#RRGGBB" + alpha (0–1) → "#RRGGBBAA". */
export function withAlpha(hex, alpha) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** Pick a readable foreground (dark green / white) for a given background colour. */
export function readableOn(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#041F16';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.36 ? '#041F16' : '#FFFFFF';
}
