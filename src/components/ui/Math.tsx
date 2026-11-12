import katex from "katex";
import { Fragment, useMemo, type ReactNode } from "react";

interface MathProps {
  /** Sumber LaTeX. */
  t: string;
  display?: boolean;
  className?: string;
}

// Hasil render di-cache per rumus.
const cache = new Map<string, string>();

function render(t: string, display: boolean): string {
  const key = `${display ? "d" : "i"}:${t}`;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(t, { throwOnError: false, displayMode: display, output: "htmlAndMathml", trust: false });
    cache.set(key, html);
  }
  return html;
}

/** Rumus dengan font LaTeX asli (Computer Modern). */
export function M({ t, display = false, className = "" }: MathProps) {
  const html = useMemo(() => render(t, display), [t, display]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Angka berformat untuk LaTeX: tanda minus ASCII, titik desimal apa adanya. */
export const tex = (s: string) => s.replace(/−/g, "-");

/** Teks dengan rumus di antara tanda dolar: "Karena $a>0$, parabola terbuka ke atas." */
export function Rich({ text }: { text: string }): ReactNode {
  return text.split("$").map((part, i) => (i % 2 ? <M key={i} t={part} /> : <Fragment key={i}>{part}</Fragment>));
}
