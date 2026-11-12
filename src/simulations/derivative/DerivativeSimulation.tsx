import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "../../lib";
import { M, Rich } from "../../components/ui/Math";
import { buttonClass } from "../../components/ui/Button";
import { SimulationShell } from "../../components/layout/SimulationShell";
import { FullscreenPanel } from "../../components/graph/FullscreenPanel";
import { TabPanel, type TabDef } from "../../components/graph/PanelTabs";
import { Check, Section, SizeStepper, SwatchRow } from "../../components/graph/Controls";
import { DEFAULT_STEP, ParamSlider, STEPS, StepSelector, type Step } from "../../components/graph/ParamControls";
import { defaultPointSize } from "../../components/graph/jsx";
import { DerivativeBoard, type Show, type Sizes } from "./DerivativeBoard";
import {
  DEFAULT_STATE,
  FN_KEYS,
  FUNCS,
  H_CHIPS,
  H_LIMIT,
  H_MIN,
  PALETTE,
  X0_LIMIT,
  clean,
  derive,
  isFnKey,
  texDF,
  texDelta,
  texF,
  texGap,
  texP,
  texQ,
  texSecant,
  texSummary,
  texTangent,
  texTangentLine,
  type State,
} from "./model";

const STATE_KEY = "1729.derivative.state";
const SHOW_KEY = "1729.derivative.show";
const STEP_KEY = "1729.derivative.step";
const SIZE_KEY = "1729.derivative.sizes";

const CURVE_RANGE = { min: 1, max: 8 } as const;
const POINT_RANGE = { min: 3, max: 14 } as const;
/** h dipangkas separuh setiap selang ini saat animasi. */
const HALF_LIFE_MS = 700;

const DEFAULT_SHOW: Show = {
  grid: true,
  axisNumbers: true,
  pointLabels: true,
  snap: true,
  curve: true,
  derivative: false,
  tangent: true,
  secant: true,
  helpers: true,
  p: true,
  q: true,
};

const defaultSizes = (): Sizes => ({ curve: 3, point: defaultPointSize() });
const clampInt = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;

type Tab = "param" | "result" | "limit" | "more";
const TABS: readonly TabDef<Tab>[] = [
  { id: "param", label: "Parameter" },
  { id: "result", label: "Hasil" },
  { id: "limit", label: "Limit" },
  { id: "more", label: "Lainnya" },
];

function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

const validState = (s: Partial<State> | null | undefined): State | null => {
  if (!s || !isFnKey(s.fn) || !Number.isFinite(s.x0) || !Number.isFinite(s.h)) return null;
  if (Math.abs(s.x0 as number) > 1000 || Math.abs(s.h as number) > 1000) return null;
  return clean({ fn: s.fn, x0: s.x0 as number, h: s.h as number });
};

/** Urutan prioritas: alamat (tautan yang dibagikan), lalu penyimpanan peramban, lalu bawaan. */
function initialState(): State {
  try {
    const p = new URLSearchParams(window.location.search);
    const fromUrl = validState({ fn: p.get("f") as State["fn"], x0: Number(p.get("x")), h: Number(p.get("h")) });
    if (p.get("f") && p.get("x") !== null && p.get("h") !== null && fromUrl) return fromUrl;
  } catch {
    /* abaikan */
  }
  return validState(readStored<State>(STATE_KEY)) ?? DEFAULT_STATE;
}

const query = (s: State) => `?f=${s.fn}&x=${s.x0}&h=${s.h}`;
const shareUrl = (s: State) => `${window.location.origin}${window.location.pathname}${query(s)}`;

/** Angka untuk teks biasa (titik desimal, minus sebenarnya). */
const N = (v: number, digits = 4) => fmt(v, digits);

const chipClass = (on: boolean) =>
  `inline-flex min-h-11 min-w-11 flex-1 items-center justify-center px-2 text-[15px] font-medium transition-colors duration-150 ${
    on ? "bg-ink text-white" : "bg-white text-ink hover:bg-brand hover:text-white"
  }`;

export default function DerivativeSimulation() {
  const [state, setState] = useState<State>(initialState);
  const [show, setShow] = useState<Show>(() => ({ ...DEFAULT_SHOW, ...(readStored<Partial<Show>>(SHOW_KEY) ?? {}) }));
  const [step, setStep] = useState<Step>(() => {
    const s = readStored<number>(STEP_KEY);
    return (STEPS as readonly number[]).includes(s ?? -1) ? (s as Step) : DEFAULT_STEP;
  });
  const [sizes, setSizes] = useState<Sizes>(() => {
    const d = defaultSizes();
    const s = readStored<Partial<Sizes>>(SIZE_KEY);
    return { curve: clampInt(s?.curve, CURVE_RANGE.min, CURVE_RANGE.max, d.curve), point: clampInt(s?.point, POINT_RANGE.min, POINT_RANGE.max, d.point) };
  });
  const [tab, setTab] = useState<Tab>("param");
  const [animating, setAnimating] = useState(false);

  const { fn: fnKey, x0, h } = state;
  const fn = FUNCS[fnKey];
  const d = useMemo(() => derive(state), [state]);

  /* Simpan di peramban dan di alamat, supaya tautan membawa keadaan simulasi. */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        localStorage.setItem(SHOW_KEY, JSON.stringify(show));
        localStorage.setItem(STEP_KEY, JSON.stringify(step));
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizes));
        window.history.replaceState(window.history.state, "", query(state));
      } catch {
        /* penyimpanan bisa saja ditolak */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [state, show, step, sizes]);

  const patch = useCallback((change: Partial<State>) => setState((cur) => clean({ ...cur, ...change })), []);
  const toggle = (k: keyof Show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  /* Animasi h → 0: h dipangkas separuh setiap HALF_LIFE_MS. */
  const raf = useRef<number | null>(null);
  const hRef = useRef(h);
  hRef.current = h;

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setAnimating(false);
  }, []);

  const toggleAnimation = () => {
    if (raf.current !== null) {
      stop();
      return;
    }
    let value = hRef.current;
    if (Math.abs(value) < 0.05) {
      value = value < 0 ? -H_LIMIT : H_LIMIT;
      patch({ h: value });
    }
    setAnimating(true);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      value *= Math.pow(0.5, dt / HALF_LIFE_MS);
      if (Math.abs(value) < H_MIN) {
        patch({ h: value < 0 ? -H_MIN : H_MIN });
        raf.current = null;
        setAnimating(false);
        return;
      }
      patch({ h: value });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  /** Perubahan dari pengguna (slider, ketik, seret). Mengubah h menghentikan animasi. */
  const onUser = useCallback(
    (change: Partial<State>) => {
      if (change.h !== undefined) stop();
      patch(change);
    },
    [patch, stop],
  );

  const reset = () => {
    stop();
    setState(DEFAULT_STATE);
    setShow(DEFAULT_SHOW);
    setSizes(defaultSizes());
  };

  const side = h < 0 ? -1 : 1;
  const setSide = (sign: 1 | -1) => onUser({ h: sign * Math.max(Math.abs(h), H_MIN) });
  const absH = Math.abs(h);

  const sliders = (compact: boolean) => (
    <>
      <ParamSlider compact={compact} tex="x_0" min={-X0_LIMIT} max={X0_LIMIT} step={step} value={x0} onChange={(v) => onUser({ x0: v })} />
      <ParamSlider compact={compact} tex="h" min={-H_LIMIT} max={H_LIMIT} step={0.1} value={h} onChange={(v) => onUser({ h: v })} />
    </>
  );

  const chips = (
    <div role="group" aria-label="Dekatkan Q ke P" className="flex flex-wrap gap-0.5">
      {H_CHIPS.map((c) => (
        <button key={c} type="button" aria-pressed={absH === c} className={chipClass(absH === c)} onClick={() => onUser({ h: side * c })}>
          {fmt(c, 3)}
        </button>
      ))}
    </div>
  );

  const animateButton = (extra = "") => (
    <button type="button" aria-pressed={animating} onClick={toggleAnimation} className={buttonClass("soft", extra)}>
      {animating ? "Hentikan" : "Animasikan h → 0"}
    </button>
  );

  return (
    <SimulationShell
      title="Turunan"
      shareUrl={() => shareUrl(state)}
      tabs={TABS}
      tab={tab}
      onTab={setTab}
      overlay={
        <>
          <M t={texF(fnKey)} />
          <div className="text-[16px]" aria-live="polite">
            <M t={texSummary(d)} />
          </div>
        </>
      }
      board={(full) => (
        <DerivativeBoard state={state} show={show} step={step} sizes={sizes} onChange={onUser} onToggleGrid={() => toggle("grid")} fullscreen={full} />
      )}
      fullscreenPanel={(barClass) => (
        <FullscreenPanel buttonClass={barClass}>
          <div className="flex flex-col gap-1">{sliders(true)}</div>
          <p className="mb-1 mt-2 text-[14px] text-muted">Dekatkan Q ke P</p>
          {chips}
          {animateButton("mt-2 w-full")}
        </FullscreenPanel>
      )}
      panel={
        <>
          <TabPanel id="param" active={tab === "param"}>
            <Section title="Fungsi" hint="Pilih kurva yang ingin kamu amati.">
              <div role="radiogroup" aria-label="Fungsi" className="grid grid-cols-2 gap-0.5">
                {FN_KEYS.map((k) => {
                  const on = fnKey === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => patch({ fn: k })}
                      className={`min-h-11 px-3 text-[17px] transition-colors duration-150 last:odd:col-span-2 ${
                        on ? "bg-ink text-white" : "bg-white text-ink hover:bg-brand hover:text-white"
                      }`}
                    >
                      <M t={FUNCS[k].tex} />
                    </button>
                  );
                })}
              </div>
              {fnKey === "abs" ? (
                <p className="mt-2 text-[14px] leading-snug text-muted">
                  Kurva ini runcing di <M t="x = 0" />. Geser P ke sana, lalu dekatkan Q dari kiri dan dari kanan.
                </p>
              ) : null}
            </Section>

            <Section title="Parameter" hint="Seret titik P atau Q di grafik, geser slider, atau ketik nilainya.">
              <p className="mb-1.5 text-[14px] text-muted">
                Besar perubahan <M t="x_0" /> per langkah
              </p>
              <StepSelector value={step} onChange={setStep} />
              <div className="mt-3 flex flex-col">{sliders(false)}</div>

              <p className="mb-1.5 mt-4 text-[14px] text-muted">Titik Q berada di</p>
              <div role="radiogroup" aria-label="Sisi titik Q" className="flex gap-0.5">
                <button type="button" role="radio" aria-checked={side === -1} className={chipClass(side === -1)} onClick={() => setSide(-1)}>
                  Kiri P (h &lt; 0)
                </button>
                <button type="button" role="radio" aria-checked={side === 1} className={chipClass(side === 1)} onClick={() => setSide(1)}>
                  Kanan P (h &gt; 0)
                </button>
              </div>

              <p className="mb-1.5 mt-4 text-[14px] text-muted">
                Dekatkan Q ke P: <M t="|h|" />
              </p>
              {chips}
              {animateButton("mt-3 w-full")}
            </Section>
          </TabPanel>

          <TabPanel id="result" active={tab === "result"}>
            <Section title="Hasil" hint="Klik kotak warna untuk menampilkan atau menyembunyikan objek di grafik.">
              <ul className="flex flex-col gap-0.5" aria-live="polite">
                <SwatchRow color={PALETTE.curve} on={show.curve} onToggle={() => toggle("curve")} label="Kurva f(x)">
                  <M t={texF(fnKey)} />
                </SwatchRow>
                <SwatchRow color={PALETTE.derivative} on={show.derivative} onToggle={() => toggle("derivative")} label="Kurva turunan f′(x)">
                  <M t={texDF(fnKey)} />
                </SwatchRow>
                <SwatchRow color={PALETTE.p} on={show.p} onToggle={() => toggle("p")} label="Titik P">
                  <M t={texP(state, d)} />
                </SwatchRow>
                <SwatchRow color={PALETTE.q} on={show.q} onToggle={() => toggle("q")} label="Titik Q">
                  <M t={texQ(d)} />
                </SwatchRow>
                <SwatchRow color={PALETTE.secant} on={show.secant} onToggle={() => toggle("secant")} label="Tali busur PQ">
                  <M t={texSecant(d)} />
                </SwatchRow>
                <SwatchRow color={PALETTE.tangent} on={show.tangent} onToggle={() => toggle("tangent")} label="Garis singgung di P">
                  <M t={texTangent(d)} />
                </SwatchRow>
                <SwatchRow color={PALETTE.helper} on={show.helpers} onToggle={() => toggle("helpers")} label="Segmen Δx dan Δy">
                  <M t={texDelta(state, d)} />
                </SwatchRow>
                <SwatchRow>
                  <M t={texGap(d)} />
                </SwatchRow>
                <SwatchRow>
                  <M t={texTangentLine(state, d)} />
                </SwatchRow>
              </ul>
              {d.hZero ? (
                <p role="status" className="mt-3 text-[15px] leading-snug text-ink">
                  Saat <M t="h = 0" />, titik Q berimpit dengan P sehingga kemiringan tali busur berbentuk <M t="\tfrac{0}{0}" /> (tak terdefinisi). Karena itu turunan
                  didefinisikan sebagai limit saat <M t="h" /> mendekati 0.
                </p>
              ) : null}
            </Section>
          </TabPanel>

          <TabPanel id="limit" active={tab === "limit"}>
            <Section title="Pendekatan limit" hint="Kemiringan tali busur untuk h yang makin kecil, dari kiri dan dari kanan P.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[300px] border-collapse bg-white text-[16px] tabular-nums">
                  <caption className="sr-only">Kemiringan tali busur di x₀ = {N(x0, 1)} untuk h yang makin kecil</caption>
                  <thead>
                    <tr className="text-left text-[14px] text-muted">
                      <th scope="col" className="px-3 py-2 font-medium">h</th>
                      <th scope="col" className="px-3 py-2 font-medium">dari kiri (−h)</th>
                      <th scope="col" className="px-3 py-2 font-medium">dari kanan (+h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.table.map((row) => (
                      <tr key={row.h} className="border-t border-line">
                        <th scope="row" className="px-3 py-2 text-left font-normal">{fmt(row.h, 3)}</th>
                        <td className="px-3 py-2">{N(row.left)}</td>
                        <td className="px-3 py-2">{N(row.right)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-ink bg-tint">
                      <th scope="row" className="px-3 py-2 text-left font-medium">h → 0</th>
                      <td colSpan={2} className="px-3 py-2 font-medium text-ink">
                        {d.limitExists && Number.isFinite(d.mTan) ? `f′(x₀) = ${N(d.mTan)}` : "limit kiri ≠ limit kanan"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {!d.limitExists ? (
                <p className="mt-3 text-[15px] leading-snug text-ink">
                  Dari kiri dan kanan kemiringannya menuju nilai yang berbeda, jadi limit tidak ada. Di titik ini <M t="f'(x_0)" /> tidak ada dan kurva tidak punya garis singgung.
                </p>
              ) : null}
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
                <p>
                  <Rich text="Kemiringan tali busur PQ adalah $\dfrac{f(x_0+h)-f(x_0)}{h}$. Saat $h$ mengecil, Q merapat ke P dan tali busur berputar menuju garis singgung." />
                </p>
                <p>
                  <Rich text="Turunan didefinisikan sebagai $f'(x_0)=\lim_{h\to 0}\dfrac{f(x_0+h)-f(x_0)}{h}$. Limit ini ada bila pendekatan dari kiri dan kanan menuju nilai yang sama (lihat tab Limit)." />
                </p>
                <p>
                  <Rich text="Aktifkan kurva turunan di tab Hasil: tinggi titik ungu sama dengan kemiringan garis singgung di P, jadi menggeser P menggambar kurva $f'(x)$." />
                </p>
              </div>
            </Section>
          </TabPanel>
        </>
      }
    />
  );
}
