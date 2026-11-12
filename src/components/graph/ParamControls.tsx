import { useEffect, useId, useState } from "react";
import { fmt } from "../../lib";
import { M } from "../ui/Math";
import { MinusIcon, PlusIcon } from "../ui/Icons";

/** Pilihan besar perubahan parameter. Di SMP biasanya 1 satuan. */
export const STEPS = [0.1, 0.2, 0.5, 1] as const;
export type Step = (typeof STEPS)[number];
export const DEFAULT_STEP: Step = 1;

const r6 = (n: number) => Math.round(n * 1e6) / 1e6 || 0;
const LIMIT = 1000;

/** Langkah ke kelipatan `step` berikutnya, bukan sekadar ditambah. Dari 1.37 dengan langkah 1: naik ke 2, turun ke 1. */
export function stepValue(value: number, step: number, dir: 1 | -1): number {
  const n = value / step;
  const target = dir > 0 ? Math.floor(n + 1e-9) + 1 : Math.ceil(n - 1e-9) - 1;
  return Math.max(-LIMIT, Math.min(LIMIT, r6(target * step)));
}

const plain = (v: number) => fmt(v, 4).replace("−", "-");

/** Kolom angka: bisa diketik langsung, nilai di luar rentang slider tetap diterima. */
export function NumberField({ value, onCommit, label }: { value: number; onCommit: (v: number) => void; label: string }) {
  const [text, setText] = useState(plain(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(plain(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const v = Number(raw.replace("−", "-").replace(",", "."));
        if (raw.trim() !== "" && Number.isFinite(v) && Math.abs(v) <= LIMIT) onCommit(v);
      }}
      className="min-h-10 w-full bg-white px-2 text-center font-math text-[17px] text-ink transition-colors hover:bg-line/50"
    />
  );
}

const stepBtn =
  "grid shrink-0 place-items-center bg-white text-ink transition-colors duration-150 hover:bg-brand hover:text-white active:bg-ink";

interface ParamSliderProps {
  tex: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** Satu baris ringkas untuk bilah layar penuh. */
  compact?: boolean;
}

export function ParamSlider({ tex, value, min, max, step, onChange, compact = false }: ParamSliderProps) {
  const id = useId();
  const name = tex.replace(/[_{}]/g, "");
  const v = Math.min(max, Math.max(min, value));
  const size = compact ? "size-9" : "size-10";

  const minus = (
    <button type="button" className={`${stepBtn} ${size}`} aria-label={`Kurangi ${name}`} onClick={() => onChange(stepValue(value, step, -1))}>
      <MinusIcon width={16} height={16} />
    </button>
  );
  const plus = (
    <button type="button" className={`${stepBtn} ${size}`} aria-label={`Tambah ${name}`} onClick={() => onChange(stepValue(value, step, 1))}>
      <PlusIcon width={16} height={16} />
    </button>
  );
  const range = (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      aria-label={`Slider ${name}`}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full accent-brand ${compact ? "min-h-9" : "min-h-9"}`}
    />
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[16px]">
        <span className="w-6 shrink-0 text-ink">
          <M t={tex} />
        </span>
        {minus}
        {range}
        {plus}
        <output htmlFor={id} className="w-11 shrink-0 text-right font-math text-ink">
          {fmt(value, 2)}
        </output>
      </div>
    );
  }
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="w-8 shrink-0 text-[19px] text-ink">
          <M t={tex} />
        </label>
        {minus}
        <div className="w-24">
          <NumberField value={value} onCommit={onChange} label={`Nilai ${name}`} />
        </div>
        {plus}
      </div>
      <div className="mt-0.5">{range}</div>
    </div>
  );
}

interface StepSelectorProps {
  value: number;
  onChange: (s: Step) => void;
  small?: boolean;
}

/** Pilihan besar langkah: ±0.1, ±0.2, ±0.5, ±1. */
export function StepSelector({ value, onChange, small = false }: StepSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Besar perubahan parameter" className="flex gap-0.5">
      {STEPS.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(s)}
            className={`flex-1 px-2 font-medium transition-colors duration-150 ${small ? "min-h-8 text-[14px]" : "min-h-10 text-[15px]"} ${
              on ? "bg-ink text-white" : "bg-white text-ink hover:bg-brand hover:text-white"
            }`}
          >
            ±{s}
          </button>
        );
      })}
    </div>
  );
}
