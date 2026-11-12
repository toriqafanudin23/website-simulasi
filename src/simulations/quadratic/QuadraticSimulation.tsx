import { useCallback, useEffect, useMemo, useState } from "react";
import { fmt } from "../../lib";
import { M, Rich, tex } from "../../components/ui/Math";
import { buttonClass } from "../../components/ui/Button";
import { SimulationShell } from "../../components/layout/SimulationShell";
import { FullscreenPanel } from "../../components/graph/FullscreenPanel";
import { TabPanel, type TabDef } from "../../components/graph/PanelTabs";
import { DEFAULT_STEP, ParamSlider, STEPS, StepSelector, type Step } from "../../components/graph/ParamControls";
import { Check, Section, SizeStepper, SwatchRow } from "../../components/graph/Controls";
import { COLORS, defaultPointSize } from "../../components/graph/jsx";
import { QuadraticBoard, type Show, type Sizes } from "./QuadraticBoard";
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
const SIZE_KEY = "1729.quadratic.sizes";

const CURVE_RANGE = { min: 1, max: 8 } as const;
const POINT_RANGE = { min: 3, max: 14 } as const;
const defaultSizes = (): Sizes => ({ curve: 3, point: defaultPointSize() });
const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;

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

type Tab = "param" | "mode" | "result" | "more";
const TABS: readonly TabDef<Tab>[] = [
  { id: "param", label: "Parameter" },
  { id: "mode", label: "Bentuk" },
  { id: "result", label: "Hasil" },
  { id: "more", label: "Lainnya" },
];

export default function QuadraticSimulation() {
  const [q, setQ] = useState<Quad>(initialQuad);
  const [wanted, setWanted] = useState<Mode>("general");
  const [show, setShow] = useState<Show>(() => ({ ...DEFAULT_SHOW, ...(readStored<Partial<Show>>(SHOW_KEY) ?? {}) }));
  const [step, setStep] = useState<Step>(() => {
    const s = readStored<number>(STEP_KEY);
    return (STEPS as readonly number[]).includes(s ?? -1) ? (s as Step) : DEFAULT_STEP;
  });
  const [sizes, setSizes] = useState<Sizes>(() => {
    const d = defaultSizes();
    const s = readStored<Partial<Sizes>>(SIZE_KEY);
    return { curve: clamp(s?.curve, CURVE_RANGE.min, CURVE_RANGE.max, d.curve), point: clamp(s?.point, POINT_RANGE.min, POINT_RANGE.max, d.point) };
  });
  const [tab, setTab] = useState<Tab>("param");

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
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizes));
        window.history.replaceState(window.history.state, "", `?a=${q.a}&b=${q.b}&c=${q.c}`);
      } catch {
        /* penyimpanan bisa saja ditolak */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, show, step, sizes]);

  const onParam = useCallback((key: string, v: number) => setQ((cur) => setParam(cur, mode, key, v)), [mode]);
  const toggle = (k: keyof Show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const reset = () => {
    setQ(DEFAULT_QUAD);
    setShow(DEFAULT_SHOW);
    setSizes(defaultSizes());
    setWanted("general");
  };

  const equation = `f(x) = ${texOf(q, mode)}`;
  const params = PARAMS[mode];

  return (
    <SimulationShell
      title="Fungsi Kuadrat"
      shareUrl={() => shareUrl(q)}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      overlay={<M t={equation} />}
      board={(full) => (
        <QuadraticBoard q={q} show={show} step={step} sizes={sizes} onChange={setQ} onToggleGrid={() => toggle("grid")} fullscreen={full} />
      )}
      fullscreenPanel={(barClass) => (
        <FullscreenPanel buttonClass={barClass}>
          <div className="mb-2 flex items-center gap-3">
            <span className="shrink-0 text-[14px] text-muted">Langkah</span>
            <div className="min-w-0 flex-1">
              <StepSelector small value={step} onChange={setStep} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {params.map((p) => (
              <ParamSlider key={p.key} compact tex={p.tex} min={p.min} max={p.max} step={step} value={values[p.key]} onChange={(v) => onParam(p.key, v)} />
            ))}
          </div>
        </FullscreenPanel>
      )}
      panel={
        <>
          <TabPanel id="mode" active={tab === "mode"}>
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
                    onClick={() => {
                      setWanted(m);
                      setTab("param");
                    }}
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
          </TabPanel>
          <TabPanel id="param" active={tab === "param"}>
          <Section title="Parameter" hint="Ubah dengan tombol − dan +, geser slider, ketik nilainya, atau seret titik berwarna di grafik.">
            <p className="mb-1.5 text-[14px] text-muted">Besar perubahan per langkah</p>
            <StepSelector value={step} onChange={setStep} />
            <div className="mt-3 flex flex-col">
              {params.map((p) => (
                <ParamSlider key={`${mode}-${p.key}`} tex={p.tex} min={p.min} max={p.max} step={step} value={values[p.key]} onChange={(v) => onParam(p.key, v)} />
              ))}
            </div>
          </Section>
          </TabPanel>
          <TabPanel id="result" active={tab === "result"}>
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
          </TabPanel>
          <TabPanel id="more" active={tab === "more"}>
          <Section title="Tampilan">
            <Check checked={show.grid} onChange={() => toggle("grid")}>Kisi</Check>
            <Check checked={show.axisNumbers} onChange={() => toggle("axisNumbers")}>Angka pada sumbu</Check>
            <Check checked={show.pointLabels} onChange={() => toggle("pointLabels")}>Koordinat titik</Check>
            <Check checked={show.snap} onChange={() => toggle("snap")}>Tempel ke kelipatan {step} saat menyeret</Check>
            <div className="mt-2 flex flex-col">
              <SizeStepper label="Tebal kurva" value={sizes.curve} {...CURVE_RANGE} onChange={(curve) => setSizes((z) => ({ ...z, curve }))} />
              <SizeStepper label="Ukuran titik" value={sizes.point} {...POINT_RANGE} onChange={(point) => setSizes((z) => ({ ...z, point }))} />
            </div>
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
          </TabPanel>
        </>
      }
    />
  );
}
