import { fmt } from "../../lib";

export type FnKey = "quad" | "downQuad" | "cubic" | "sine" | "abs";

export interface FnDef {
  key: FnKey;
  /** f(x) dalam LaTeX, tanpa "f(x) =". */
  tex: string;
  /** f'(x) dalam LaTeX. */
  dTex: string;
  f: (x: number) => number;
  /** Turunan. NaN di titik yang tidak punya turunan. */
  df: (x: number) => number;
}

export const FUNCS: Record<FnKey, FnDef> = {
  quad: { key: "quad", tex: "\\tfrac{1}{4}x^2", dTex: "\\tfrac{1}{2}x", f: (x) => (x * x) / 4, df: (x) => x / 2 },
  downQuad: { key: "downQuad", tex: "-\\tfrac{1}{4}x^2 + 4", dTex: "-\\tfrac{1}{2}x", f: (x) => 4 - (x * x) / 4, df: (x) => -x / 2 },
  cubic: {
    key: "cubic",
    tex: "\\tfrac{1}{4}x^3 - x",
    dTex: "\\tfrac{3}{4}x^2 - 1",
    f: (x) => (x * x * x) / 4 - x,
    df: (x) => (3 * x * x) / 4 - 1,
  },
  sine: { key: "sine", tex: "2\\sin x", dTex: "2\\cos x", f: (x) => 2 * Math.sin(x), df: (x) => 2 * Math.cos(x) },
  // Tajam di x = 0: kemiringan kiri −1, kanan +1, jadi turunannya tidak ada di sana.
  abs: { key: "abs", tex: "|x|", dTex: "\\dfrac{x}{|x|}\\ (x \\neq 0)", f: (x) => Math.abs(x), df: (x) => (x === 0 ? Number.NaN : Math.sign(x)) },
};

export const FN_KEYS = Object.keys(FUNCS) as FnKey[];
export const isFnKey = (v: unknown): v is FnKey => typeof v === "string" && v in FUNCS;

/** Keadaan simulasi: fungsi, posisi P (x₀), dan jarak Q dari P (h). */
export interface State {
  fn: FnKey;
  x0: number;
  h: number;
}

export const DEFAULT_STATE: State = { fn: "quad", x0: 1, h: 2 };

export const X0_LIMIT = 6;
export const H_LIMIT = 3;
/** h terkecil yang dicapai animasi. */
export const H_MIN = 0.0005;
/** Pilihan cepat |h| untuk mendekatkan Q ke P. */
export const H_CHIPS = [3, 1, 0.1, 0.01, 0.001] as const;

const r6 = (n: number) => Math.round(n * 1e6) / 1e6 || 0;
export const clean = (s: State): State => ({ fn: s.fn, x0: r6(s.x0), h: r6(s.h) });

export const isZero = (h: number) => Math.abs(h) < 1e-9;

export interface Derived {
  fx0: number;
  qx: number;
  qy: number;
  /** Kemiringan tali busur PQ. NaN saat h = 0. */
  mSec: number;
  /** f'(x₀). NaN bila tidak ada. */
  mTan: number;
  /** |m_PQ − f'(x₀)|. */
  gap: number;
  hZero: boolean;
  /** Pendekatan dari kiri dan kanan untuk h = 1, 0.1, 0.01, 0.001. */
  table: { h: number; left: number; right: number }[];
  /** Limit dari kiri dan kanan sama (selisih kecil pada h terkecil). */
  limitExists: boolean;
}

const slope = (fn: FnDef, x0: number, h: number) => (fn.f(x0 + h) - fn.f(x0)) / h;

export function derive({ fn: key, x0, h }: State): Derived {
  const fn = FUNCS[key];
  const fx0 = fn.f(x0);
  const hZero = isZero(h);
  const mSec = hZero ? Number.NaN : slope(fn, x0, h);
  const mTan = fn.df(x0);
  const table = [1, 0.1, 0.01, 0.001].map((hh) => ({ h: hh, left: slope(fn, x0, -hh), right: slope(fn, x0, hh) }));
  const last = table[table.length - 1];
  return {
    fx0,
    qx: x0 + h,
    qy: fn.f(x0 + h),
    mSec,
    mTan,
    gap: Number.isFinite(mSec) && Number.isFinite(mTan) ? Math.abs(mSec - mTan) : Number.NaN,
    hZero,
    table,
    limitExists: Math.abs(last.left - last.right) < 0.05,
  };
}

/* ---------- LaTeX ---------- */

const n = (v: number, digits = 2) => fmt(v, digits).replace(/−/g, "-");
const paren = (v: number, digits = 2) => (v < 0 ? `(${n(v, digits)})` : n(v, digits));

export const texF = (key: FnKey) => `f(x) = ${FUNCS[key].tex}`;
export const texDF = (key: FnKey) => `f'(x) = ${FUNCS[key].dTex}`;

/** Ringkasan di pojok grafik: kemiringan tali busur dan garis singgung. */
export function texSummary(d: Derived): string {
  const tan = Number.isFinite(d.mTan) ? n(d.mTan, 3) : "\\text{tidak ada}";
  return d.hZero ? `m_{PQ} = \\tfrac{0}{0}\\ \\to\\ f'(x_0) = ${tan}` : `m_{PQ} = ${n(d.mSec, 3)}\\ \\to\\ f'(x_0) = ${tan}`;
}

export const texP = (s: State, d: Derived) => `P(${n(s.x0, 1)},\\ ${n(d.fx0)})`;
export const texQ = (d: Derived) => (d.hZero ? "Q\\ \\text{berimpit dengan}\\ P" : `Q(${n(d.qx, 3)},\\ ${n(d.qy, 3)})`);
export const texSecant = (d: Derived) => (d.hZero ? "m_{PQ} = \\tfrac{0}{0}" : `m_{PQ} = \\dfrac{\\Delta y}{\\Delta x} = ${n(d.mSec, 4)}`);
export const texTangent = (d: Derived) => (Number.isFinite(d.mTan) ? `f'(x_0) = ${n(d.mTan, 4)}` : "f'(x_0)\\ \\text{tidak ada}");
export const texDelta = (s: State, d: Derived) => (d.hZero ? "\\Delta x = 0,\\ \\Delta y = 0" : `\\Delta x = ${n(s.h, 3)},\\ \\Delta y = ${n(d.qy - d.fx0, 3)}`);
export const texGap = (d: Derived) => `|m_{PQ} - f'(x_0)| = ${Number.isFinite(d.gap) ? n(d.gap, 4) : "\\text{—}"}`;
export const texTangentLine = (s: State, d: Derived) =>
  Number.isFinite(d.mTan) ? `y = ${n(d.mTan)}\\,(x - ${paren(s.x0, 1)}) + ${paren(d.fx0)}` : "\\text{tidak ada garis singgung}";

/** Warna objek: titik P jingga, Q dan tali busur mawar, garis singgung hijau, kurva turunan ungu. */
export const PALETTE = {
  curve: "#0ea5e9",
  p: "#d97706",
  q: "#e11d48",
  secant: "#e11d48",
  tangent: "#16a34a",
  helper: "#94a3b8",
  derivative: "#7c3aed",
} as const;
