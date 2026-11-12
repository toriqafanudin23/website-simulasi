import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../../lib";
import { M, tex } from "../ui/Math";
import { DEFAULT_STEP, ParamSlider, StepSelector, type Step } from "./ParamControls";
import { ParabolaBoard, type Params } from "./ParabolaBoard";

const START: Params = { a: 1, h: 2, k: -3 };

/** Suku (x - h) dengan tanda yang benar, dalam LaTeX. */
function shifted(h: number): string {
  if (Math.abs(h) < 0.05) return "x";
  return h > 0 ? `(x - ${tex(fmt(h))})` : `(x + ${tex(fmt(-h))})`;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-[15px] text-muted">{label}</dt>
      <dd className="text-right text-[15px] text-ink">{children}</dd>
    </div>
  );
}

export function ParabolaWorkspace() {
  const [p, setP] = useState<Params>(START);
  const [step, setStep] = useState<Step>(DEFAULT_STEP);
  const { a, h, k } = p;

  const disc = a === 0 ? NaN : -k / a;
  const roots = a === 0 ? null : disc < 0 ? [] : disc === 0 ? [h] : [h - Math.sqrt(disc), h + Math.sqrt(disc)];
  const changed = a !== START.a || h !== START.h || k !== START.k;
  const equation = `y = ${a === 1 ? "" : a === -1 ? "-" : tex(fmt(a))}${shifted(h)}^2 ${k < 0 ? "-" : "+"} ${tex(fmt(Math.abs(k)))}`;

  return (
    <div id="ruang-kerja" className="scroll-mt-6">
      <div aria-hidden="true" className="h-1 bg-ink" />
      <div className="grid border border-t-0 border-line bg-tint lg:grid-cols-[minmax(300px,340px)_1fr]">
      {/* Grafik di atas pada ponsel, di kanan pada layar lebar. */}
      <div className="h-[380px] sm:h-[480px] lg:order-2 lg:h-auto lg:min-h-[580px]">
        <ParabolaBoard step={step} a={a} h={h} k={k} onVertexChange={(nh, nk) => setP((s) => ({ ...s, h: nh, k: nk }))} />
      </div>

      <aside className="p-6 lg:order-1 lg:p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-medium text-ink">Ekspresi</h2>
          <button
            type="button"
            onClick={() => setP(START)}
            disabled={!changed}
            className="px-2 py-1 text-[13px] text-link underline underline-offset-2 transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-0"
          >
            Atur ulang
          </button>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span aria-hidden="true" className="mt-3 size-3 shrink-0 bg-curve" />
          <p className="text-xl text-ink" aria-live="polite">
            <M t={equation} />
          </p>
        </div>

        <p className="mb-1.5 mt-6 text-[14px] text-muted">Besar perubahan per langkah</p>
        <StepSelector value={step} onChange={setStep} />
        <div className="mt-3 flex flex-col">
          <ParamSlider tex="a" value={a} min={-4} max={4} step={step} onChange={(v) => setP((s) => ({ ...s, a: v }))} />
          <ParamSlider tex="h" value={h} min={-8} max={8} step={step} onChange={(v) => setP((s) => ({ ...s, h: v }))} />
          <ParamSlider tex="k" value={k} min={-8} max={8} step={step} onChange={(v) => setP((s) => ({ ...s, k: v }))} />
        </div>

        <h2 className="mt-8 font-sans text-[15px] font-medium text-ink">Dihitung otomatis</h2>
        <dl className="mt-2">
          <Row label="Titik puncak">
            <M t={`(${tex(fmt(h))}, ${tex(fmt(k))})`} />
          </Row>
          <Row label="Sumbu simetri">
            <M t={`x = ${tex(fmt(h))}`} />
          </Row>
          <Row label="Memotong sumbu y">
            <M t={`(0, ${tex(fmt(a * h * h + k))})`} />
          </Row>
          <Row label="Akar">
            {roots === null ? (
              "bukan parabola"
            ) : roots.length === 0 ? (
              "tidak ada akar real"
            ) : (
              <M t={roots.map((r) => tex(fmt(r, 2))).join(", ")} />
            )}
          </Row>
          <Row label="Terbuka ke">{a === 0 ? "-" : a > 0 ? "atas" : "bawah"}</Row>
        </dl>
        <Link to="/simulasi/fungsi-kuadrat" className="link mt-6 inline-block text-[17px]">
          Buka simulasi lengkap
        </Link>
      </aside>
      </div>
    </div>
  );
}
