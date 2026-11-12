import type { ReactNode } from "react";
import { MinusIcon, PlusIcon } from "../ui/Icons";

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="px-5 py-5 md:px-6">
      <h2 className="text-[15px] font-medium text-ink">{title}</h2>
      {hint ? <p className="mt-1 text-[14px] leading-snug text-muted">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

interface SwatchRowProps {
  color?: string;
  on?: boolean;
  onToggle?: () => void;
  label?: string;
  children: ReactNode;
}

/** Baris hasil. Kotak warna di kiri menampilkan atau menyembunyikan objeknya di grafik. */
export function SwatchRow({ color, on = true, onToggle, label, children }: SwatchRowProps) {
  return (
    <li className="flex min-h-11 items-center gap-1 bg-white pr-3 text-[17px] text-ink">
      {onToggle ? (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          onClick={onToggle}
          className="grid size-11 shrink-0 place-items-center"
        >
          <span className="size-4 transition-colors duration-150" style={{ background: on ? color : "#d6d6d6" }} />
        </button>
      ) : (
        <span className="size-11 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1 py-2">{children}</div>
    </li>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[16px] text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-brand" />
      {children}
    </label>
  );
}

interface SizeStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

/** Atur ukuran dengan tombol − dan +; pratinjau garis atau titik ikut berubah di grafik. */
export function SizeStepper({ label, value, min, max, onChange }: SizeStepperProps) {
  const btn =
    "grid size-11 place-items-center bg-white text-ink transition-colors duration-150 hover:bg-brand hover:text-white disabled:text-muted disabled:hover:bg-white disabled:hover:text-muted";
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-[16px] text-ink" id={`ukuran-${label}`}>
        {label}
      </span>
      <div role="group" aria-labelledby={`ukuran-${label}`} className="flex items-center gap-0.5">
        <button type="button" className={btn} aria-label={`Kurangi ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          <MinusIcon width={16} height={16} />
        </button>
        <output className="w-9 bg-white py-2.5 text-center font-math text-[17px] text-ink" aria-live="polite">
          {value}
        </output>
        <button type="button" className={btn} aria-label={`Tambah ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
          <PlusIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
