import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../../lib";
import { M, Rich, tex } from "../../components/ui/Math";
import { buttonClass } from "../../components/ui/Button";
import { DEFAULT_STEP, ParamSlider, STEPS, StepSelector, type Step } from "../../components/graph/ParamControls";
import { Check, Section, SwatchRow } from "./Controls";
import { COLORS } from "../../components/graph/jsx";
import { QuadraticBoard, type Show } from "./QuadraticBoard";
import {
  DEFAULT_QUAD,
  PARAMS,
  clean,
  derive,
  notes,
  paramValues,
  setParam,
  texOf,
  type Mode,
  type Quad,
} from "./model";

const Q_KEY = "1729.quadratic.q";
const SHOW_KEY = "1729.quadratic.show";
const STEP_KEY = "1729.quadratic.step";

const DEFAULT_SHOW: Show = {
  grid: true,
  axisNumbers: true,
  pointLabels: true,
  snap: true,
  curve: true,
  reference: true,
  symmetry: true,
  vertex: true,
  roots: true,
  intercept: true,
};

function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Urutan prioritas: alamat (tautan yang dibagikan), lalu penyimpanan peramban, lalu bawaan. */
function initialQuad(): Quad {
  try {
    const p = new URLSearchParams(window.location.search);
    const a = p.get("a"), b = p.get("b"), c = p.get("c");
    if (a !== null && b !== null && c !== null) {
      const q = { a: Number(a), b: Number(b), c: Number(c) };
      if (Object.values(q).every((v) => Number.isFinite(v) && Math.abs(v) <= 1000)) return clean(q);
    }
  } catch {
    /* abaikan */
  }
  const s = readStored<Quad>(Q_KEY);
  if (s && [s.a, s.b, s.c].every(Number.isFinite)) return clean(s);
  return DEFAULT_QUAD;
}

const shareUrl = (q: Quad) =>
  `${window.location.origin}${window.location.pathname}?a=${q.a}&b=${q.b}&c=${q.c}`;

const N = (v: number) => tex(fmt(v));

const MODES: { mode: Mode; name: string }[] = [
  { mode: "general", name: "Bentuk umum" },
  { mode: "vertex", name: "Bentuk puncak" },
  { mode: "factor", name: "Bentuk faktor" },
];

const barBtn =
  "inline-flex min-h-10 items-center justify-center bg-tint px-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-white short:min-h-8 md:px-4";

export default function QuadraticSimulation() {
  const [q, setQ] = useState<Quad>(initialQuad);
  const [wanted, setWanted] = useState<Mode>("general");
  const [show, setShow] = useState<Show>(() => ({ ...DEFAULT_SHOW, ...(readStored<Partial<Show>>(SHOW_KEY) ?? {}) }));
  const [step, setStep] = useState<Step>(() => {
    const s = readStored<number>(STEP_KEY);
    return (STEPS as readonly number[]).includes(s ?? -1) ? (s as Step) : DEFAULT_STEP;
  });
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);

  const d = useMemo(() => derive(q), [q]);
  // Bentuk puncak dan faktor hanya masuk akal bila parabola dan (untuk faktor) punya akar real.
  const available: Record<Mode, boolean> = {
    general: true,
    vertex: d.isQuad,
    factor: d.isQuad && d.roots.length > 0,
  };
  const mode: Mode = available[wanted] ? wanted : "general";
  const values = useMemo(() => paramValues(q, mode), [q, mode]);

  /* Simpan di peramban dan di alamat, supaya tautan membawa keadaan simulasi. */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(Q_KEY, JSON.stringify(q));
        localStorage.setItem(SHOW_KEY, JSON.stringify(show));
        localStorage.setItem(STEP_KEY, JSON.stringify(step));
        window.history.replaceState(window.history.state, "", `?a=${q.a}&b=${q.b}&c=${q.c}`);
      } catch {
        /* penyimpanan bisa saja ditolak */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, show, step]);

  const onParam = useCallback((key: string, v: number) => setQ((cur) => setParam(cur, mode, key, v)), [mode]);
  const toggle = (k: keyof Show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  /* Layar penuh: grafik memenuhi layar, kontrol berpindah ke bilah mengambang. */
  const rootRef = useRef<HTMLDivElement>(null);
  const native = useRef(false);
  const enterFull = async () => {
    setFull(true);
    try {
      await rootRef.current?.requestFullscreen?.();
      native.current = !!document.fullscreenElement;
    } catch {
      /* tanpa API layar penuh, tampilan tetap memenuhi jendela */
    }
  };
  const exitFull = async () => {
    setFull(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* abaikan */
    }
    native.current = false;
  };
  useEffect(() => {
    const onChange = () => {
      if (native.current && !document.fullscreenElement) {
        native.current = false;
        setFull(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !native.current) setFull(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(q));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin tautan ini", shareUrl(q));
    }
  };

  const reset = () => {
    setQ(DEFAULT_QUAD);
    setShow(DEFAULT_SHOW);
    setWanted("general");
  };

  const equation = `f(x) = ${texOf(q, mode)}`;
  const params = PARAMS[mode];

  return (
    <div ref={rootRef} className="flex h-dvh flex-col bg-white">
      {full ? null : (
        <header className="shrink-0">
          <div className="flex h-14 items-center justify-between gap-3 px-4 short:h-11 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" aria-label="1729, beranda" className="shrink-0">
                <svg viewBox="0 0 80 80" aria-hidden="true" className="size-9 short:size-7">
                  <rect width="80" height="80" className="fill-ink" />
                  <path d="M12 66 C 30 66, 32 14, 40 14 S 50 66, 68 66" fill="none" strokeWidth={5} className="stroke-curve" />
                </svg>
              </Link>
              <nav aria-label="Jejak" className="flex min-w-0 items-center gap-2 text-[15px]">
                <Link to="/simulasi" className="hidden text-muted transition-colors hover:text-ink sm:inline">
                  Simulasi
                </Link>
                <span aria-hidden="true" className="hidden text-muted sm:inline">/</span>
                <h1 className="truncate font-serif text-[17px] font-bold">Fungsi Kuadrat</h1>
              </nav>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={barBtn} onClick={share} aria-live="polite">
                {copied ? "Tautan disalin" : "Bagikan"}
              </button>
              <button type="button" className={barBtn} onClick={enterFull}>
                Layar penuh
              </button>
            </div>
          </div>
          <div aria-hidden="true" className="h-1 bg-ink short:h-0.5" />
        </header>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row short:flex-row">
        <div
          className={`relative min-h-0 md:order-2 short:order-2 ${
            full ? "flex-1" : "h-[46dvh] shrink-0 md:h-auto md:flex-1 short:h-auto short:flex-1"
          }`}
        >
          <QuadraticBoard q={q} show={show} step={step} onChange={setQ} onToggleGrid={() => toggle("grid")}>
            <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] bg-white/90 px-3 py-1.5 text-[19px] text-ink">
              <M t={equation} />
            </div>

            {full ? (
              <>
                <button type="button" onClick={exitFull} className={`${barBtn} absolute right-3 top-3`}>
                  Keluar layar penuh
                </button>
                <div className="absolute bottom-10 left-3 right-[68px] max-w-3xl bg-white/90 px-4 py-1.5 backdrop-blur-sm">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="shrink-0 text-[14px] text-muted">Langkah</span>
                    <div className="w-60 max-w-full">
                      <StepSelector small value={step} onChange={setStep} />
                    </div>
                  </div>
                  <div className="grid gap-x-5 sm:grid-cols-3">
                    {params.map((p) => (
                      <ParamSlider key={p.key} compact tex={p.tex} min={p.min} max={p.max} step={step} value={values[p.key]} onChange={(v) => onParam(p.key, v)} />
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </QuadraticBoard>
        </div>

        {full ? null : (
          <aside
            aria-label="Kontrol simulasi"
            className="min-h-0 flex-1 overflow-y-auto bg-tint md:order-1 md:w-[380px] md:flex-none short:order-1 short:w-[310px] short:flex-none"
          >
            <Section title="Bentuk persamaan" hint="Pilih bentuk yang ingin kamu ubah. Dua bentuk lainnya ikut berubah.">
              <div role="radiogroup" aria-label="Bentuk persamaan" className="flex flex-col gap-0.5">
                {MODES.map(({ mode: m, name }) => {
                  const on = mode === m;
                  const ok = available[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!ok}
                      onClick={() => setWanted(m)}
                      className={`w-full px-4 py-2.5 text-left transition-colors duration-150 ${
                        on ? "bg-ink text-white" : "bg-white text-ink enabled:hover:bg-brand enabled:hover:text-white"
                      } disabled:cursor-not-allowed disabled:text-muted`}
                    >
                      <span className="block text-[13px] opacity-75">
                        {name}
                        {ok ? "" : m === "factor" && d.isQuad ? " (tidak ada akar real)" : " (a = 0)"}
                      </span>
                      <span className="block text-[17px]">{ok ? <M t={`f(x) = ${texOf(q, m)}`} /> : "—"}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Parameter" hint="Ubah dengan tombol − dan +, geser slider, ketik nilainya, atau seret titik berwarna di grafik.">
              <p className="mb-1.5 text-[14px] text-muted">Besar perubahan per langkah</p>
              <StepSelector value={step} onChange={setStep} />
              <div className="mt-3 flex flex-col">
                {params.map((p) => (
                  <ParamSlider key={`${mode}-${p.key}`} tex={p.tex} min={p.min} max={p.max} step={step} value={values[p.key]} onChange={(v) => onParam(p.key, v)} />
                ))}
              </div>
            </Section>

            <Section title="Hasil" hint="Klik kotak warna untuk menampilkan atau menyembunyikan objek di grafik.">
              <ul className="flex flex-col gap-0.5">
                <SwatchRow color={COLORS.curve} on={show.curve} onToggle={() => toggle("curve")} label="Kurva">
                  <M t={equation} />
                </SwatchRow>
                <SwatchRow color={COLORS.reference} on={show.reference} onToggle={() => toggle("reference")} label="Kurva pembanding">
                  <M t="g(x) = x^2" />
                </SwatchRow>
                <SwatchRow color={COLORS.symmetry} on={show.symmetry} onToggle={() => toggle("symmetry")} label="Sumbu simetri">
                  {d.isQuad ? <M t={`x = ${N(d.h)}`} /> : "—"}
                </SwatchRow>
                <SwatchRow color={COLORS.vertex} on={show.vertex} onToggle={() => toggle("vertex")} label="Titik puncak">
                  {d.isQuad ? <M t={`P(${N(d.h)}, ${N(d.k)})`} /> : "—"}
                </SwatchRow>
                <SwatchRow color={COLORS.roots} on={show.roots} onToggle={() => toggle("roots")} label="Akar">
                  {d.roots.length === 0 ? (
                    <span className="text-[16px] text-muted">tidak ada akar real</span>
                  ) : d.roots.length === 1 ? (
                    <M t={d.isQuad ? `x_1 = x_2 = ${N(d.roots[0])}` : `x = ${N(d.roots[0])}`} />
                  ) : (
                    <M t={`x_1 = ${N(d.roots[0])},\\ x_2 = ${N(d.roots[1])}`} />
                  )}
                </SwatchRow>
                <SwatchRow color={COLORS.intercept} on={show.intercept} onToggle={() => toggle("intercept")} label="Titik potong sumbu y">
                  <M t={`C(0, ${N(q.c)})`} />
                </SwatchRow>
                <SwatchRow>
                  {d.isQuad ? <M t={`D = b^2 - 4ac = ${N(d.D)}`} /> : <M t="D = \text{—}" />}
                </SwatchRow>
              </ul>
            </Section>

            <Section title="Tampilan">
              <Check checked={show.grid} onChange={() => toggle("grid")}>Kisi</Check>
              <Check checked={show.axisNumbers} onChange={() => toggle("axisNumbers")}>Angka pada sumbu</Check>
              <Check checked={show.pointLabels} onChange={() => toggle("pointLabels")}>Koordinat titik</Check>
              <Check checked={show.snap} onChange={() => toggle("snap")}>Tempel ke kelipatan {step} saat menyeret</Check>
              <button type="button" onClick={reset} className={buttonClass("soft", "mt-3 w-full")}>
                Atur ulang
              </button>
            </Section>

            <Section title="Catatan">
              <div className="flex flex-col gap-3 text-[16px] leading-[1.6] text-body">
                {notes(q).map((t, i) => (
                  <p key={i}>
                    <Rich text={t} />
                  </p>
                ))}
              </div>
            </Section>
          </aside>
        )}
      </div>
    </div>
  );
}
