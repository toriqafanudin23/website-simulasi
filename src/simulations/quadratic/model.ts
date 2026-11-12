import { fmt } from "../../lib";

/** f(x) = ax² + bx + c. Semua bentuk lain diturunkan dari tiga angka ini. */
export interface Quad {
  a: number;
  b: number;
  c: number;
}

export type Mode = "general" | "vertex" | "factor";

export const DEFAULT_QUAD: Quad = { a: 1, b: -2, c: -3 };

const r6 = (n: number) => Math.round(n * 1e6) / 1e6 || 0;
export const clean = (q: Quad): Quad => ({ a: r6(q.a), b: r6(q.b), c: r6(q.c) });

export const evalQuad = (q: Quad, x: number) => (q.a * x + q.b) * x + q.c;

export const fromVertex = (a: number, h: number, k: number): Quad => clean({ a, b: -2 * a * h, c: a * h * h + k });
export const fromFactor = (a: number, p: number, r: number): Quad => clean({ a, b: -a * (p + r), c: a * p * r });

export interface Derived {
  isQuad: boolean;
  /** Diskriminan b² − 4ac. */
  D: number;
  h: number;
  k: number;
  /** Akar real, urut naik. Satu elemen bila akar kembar. */
  roots: number[];
}

export function derive(q: Quad): Derived {
  const { a, b, c } = q;
  let D = b * b - 4 * a * c;
  if (Math.abs(D) < 1e-9) D = 0;
  if (Math.abs(a) < 1e-9) {
    return { isQuad: false, D, h: NaN, k: NaN, roots: b !== 0 ? [-c / b] : [] };
  }
  const h = -b / (2 * a);
  const k = evalQuad(q, h);
  if (D < 0) return { isQuad: true, D, h, k, roots: [] };
  if (D === 0) return { isQuad: true, D, h, k, roots: [h] };
  const s = Math.sqrt(D);
  const r = [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((x, y) => x - y);
  return { isQuad: true, D, h, k, roots: r };
}

/** Parameter yang diatur slider pada tiap bentuk. */
export const PARAMS: Record<Mode, { key: string; tex: string; min: number; max: number }[]> = {
  general: [
    { key: "a", tex: "a", min: -5, max: 5 },
    { key: "b", tex: "b", min: -10, max: 10 },
    { key: "c", tex: "c", min: -10, max: 10 },
  ],
  vertex: [
    { key: "a", tex: "a", min: -5, max: 5 },
    { key: "h", tex: "h", min: -10, max: 10 },
    { key: "k", tex: "k", min: -10, max: 10 },
  ],
  factor: [
    { key: "a", tex: "a", min: -5, max: 5 },
    { key: "x1", tex: "x_1", min: -10, max: 10 },
    { key: "x2", tex: "x_2", min: -10, max: 10 },
  ],
};

/** Nilai parameter untuk bentuk tertentu, dibaca dari Quad. */
export function paramValues(q: Quad, mode: Mode): Record<string, number> {
  const d = derive(q);
  if (mode === "general") return { a: q.a, b: q.b, c: q.c };
  if (mode === "vertex") return { a: q.a, h: d.h, k: d.k };
  return { a: q.a, x1: d.roots[0] ?? 0, x2: d.roots[d.roots.length - 1] ?? 0 };
}

/** Ubah satu parameter pada bentuk tertentu. Parameter lain pada bentuk itu dipertahankan. */
export function setParam(q: Quad, mode: Mode, key: string, value: number): Quad {
  if (mode === "general") return clean({ ...q, [key]: value });
  // Bentuk puncak dan faktor tidak terdefinisi saat a = 0.
  const a = key === "a" ? (value === 0 ? (q.a < 0 ? -0.1 : 0.1) : value) : q.a;
  const v = paramValues(q, mode);
  v[key] = key === "a" ? a : value;
  if (mode === "vertex") return fromVertex(v.a, v.h, v.k);
  return fromFactor(v.a, v.x1, v.x2);
}

/* ---------- Penulisan persamaan (LaTeX) ---------- */

const n = (v: number) => fmt(v).replace(/−/g, "-");
const lead = (a: number) => (a === 1 ? "" : a === -1 ? "-" : n(a));
const shift = (v: number) => (v === 0 ? "x" : v > 0 ? `(x - ${n(v)})` : `(x + ${n(-v)})`);

export function texGeneral({ a, b, c }: Quad): string {
  const out: string[] = [];
  const push = (coef: number, term: string) => {
    if (coef === 0) return;
    const abs = Math.abs(coef);
    const body = term && abs === 1 ? term : `${n(abs)}${term}`;
    out.push(out.length === 0 ? (coef < 0 ? `-${body}` : body) : `${coef < 0 ? "-" : "+"} ${body}`);
  };
  push(a, "x^2");
  push(b, "x");
  push(c, "");
  return out.length ? out.join(" ") : "0";
}

export function texVertex(q: Quad): string {
  const { h, k } = derive(q);
  const sq = h === 0 ? "x^2" : `${shift(h)}^2`;
  const tail = k === 0 ? "" : ` ${k < 0 ? "-" : "+"} ${n(Math.abs(k))}`;
  return `${lead(q.a)}${sq}${tail}`;
}

export function texFactor(q: Quad): string {
  const { roots } = derive(q);
  if (roots.length === 1) return `${lead(q.a)}${shift(roots[0])}^2`;
  return `${lead(q.a)}${shift(roots[0])}${shift(roots[1])}`;
}

export const texOf = (q: Quad, mode: Mode) =>
  mode === "general" ? texGeneral(q) : mode === "vertex" ? texVertex(q) : texFactor(q);

/** Teks catatan; rumus di antara tanda dolar. */
export function notes(q: Quad): string[] {
  const d = derive(q);
  const { a, c } = q;
  const out: string[] = [];
  if (!d.isQuad) {
    out.push("Karena $a = 0$, grafik berupa garis lurus, bukan parabola.");
  } else {
    const width =
      Math.abs(a) > 1 ? "lebih sempit" : Math.abs(a) < 1 ? "lebih lebar" : "selebar";
    out.push(
      `Karena $a ${a > 0 ? ">" : "<"} 0$, parabola terbuka ke ${a > 0 ? "atas" : "bawah"} dan titik puncaknya adalah titik ${a > 0 ? "terendah" : "tertinggi"}. Dengan $|a| = ${n(Math.abs(a))}$, parabola ${width} dibanding $y = x^2$.`,
    );
    out.push(`Sumbu simetri berada di $x = -\\dfrac{b}{2a} = ${n(d.h)}$. Mengubah $b$ menggeser puncak ke samping sekaligus ke atas atau bawah.`);
  }
  out.push(`Grafik selalu memotong sumbu y di $(0, ${n(c)})$. Mengubah $c$ menggeser seluruh parabola ke atas atau bawah.`);
  if (d.isQuad) {
    out.push(
      d.D > 0
        ? `$D = b^2 - 4ac = ${n(d.D)} > 0$: ada dua akar real yang berbeda.`
        : d.D === 0
          ? `$D = b^2 - 4ac = 0$: ada satu akar kembar, grafik menyentuh sumbu x.`
          : `$D = b^2 - 4ac = ${n(d.D)} < 0$: tidak ada akar real, grafik tidak memotong sumbu x.`,
    );
  }
  return out;
}
