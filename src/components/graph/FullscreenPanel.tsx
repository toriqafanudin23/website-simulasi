import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, SlidersIcon } from "../ui/Icons";

interface Props {
  children: ReactNode;
  /** Kelas tombol bilah, supaya tampilannya sama dengan tombol lain di halaman. */
  buttonClass: string;
  label?: string;
}

/** Layar lega membuka panel; ponsel (sempit atau diputar) memulai dengan grafik penuh dan panel tertutup. */
const startsOpen = () => window.matchMedia("(min-width: 768px) and (min-height: 501px)").matches;

/**
 * Kontrol di layar penuh. Tombolnya di kiri bawah (sejajar tombol zoom di kanan bawah),
 * panelnya muncul tepat di atas baris itu dan menggulir sendiri bila layar pendek.
 */
export function FullscreenPanel({ children, buttonClass, label = "Parameter" }: Props) {
  const [open, setOpen] = useState(startsOpen);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="panel-layar-penuh"
        onClick={() => setOpen((o) => !o)}
        className={`${buttonClass} absolute bottom-3 left-3 z-10 gap-2`}
      >
        <SlidersIcon width={18} height={18} />
        {label}
        {open ? <ChevronDown width={16} height={16} /> : <ChevronUp width={16} height={16} />}
      </button>

      {open ? (
        <div
          id="panel-layar-penuh"
          className="absolute bottom-16 left-3 z-10 max-h-[calc(100%-8.5rem)] w-[calc(100%-1.5rem)] max-w-[420px] overflow-y-auto overscroll-contain border border-line bg-white p-3"
        >
          {children}
        </div>
      ) : null}
    </>
  );
}
