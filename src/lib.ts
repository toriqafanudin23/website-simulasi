const MINUS = "−";

/**
 * Angka berformat internasional: titik desimal, tanda minus sungguhan, tanpa nol di belakang koma.
 * fmt(1.5) → "1.5", fmt(2) → "2", fmt(-0.004) → "0".
 */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const v = Math.round(n * 10 ** digits) / 10 ** digits;
  if (v === 0) return "0";
  let s = Math.abs(v).toFixed(digits);
  if (s.includes(".")) s = s.replace(/\.?0+$/, "");
  return v < 0 ? MINUS + s : s;
}

/** Titik koordinat: (1.5, 5.5). */
export const point = (x: number, y: number, digits = 2) => `(${fmt(x, digits)}, ${fmt(y, digits)})`;

/** Label sumbu. */
export const fmtTick = (n: number) => fmt(n, 8);
