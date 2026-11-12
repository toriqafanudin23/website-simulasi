import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

export const tabId = (id: string) => `tab-${id}`;
export const panelId = (id: string) => `panel-${id}`;

interface TabsProps<T extends string> {
  tabs: readonly TabDef<T>[];
  value: T;
  onChange: (tab: T) => void;
}

/** Tab bagian kontrol untuk layar sempit: satu bagian sekali tampil, jadi tidak perlu menggulir panjang. Tersembunyi mulai md. */
export function PanelTabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  const refs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === value);
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div role="tablist" aria-label="Bagian kontrol" onKeyDown={onKeyDown} className="sticky top-0 z-10 flex border-b border-line bg-white md:hidden">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={tabId(t.id)}
            aria-selected={on}
            aria-controls={panelId(t.id)}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`min-h-11 flex-1 border-b-4 px-1 text-[15px] font-medium transition-colors duration-150 ${
              on ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Isi satu tab. Di layar sempit hanya tab aktif yang tampil; mulai md semua bagian tampil berurutan. */
export function TabPanel({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  return (
    <div id={panelId(id)} role="tabpanel" aria-labelledby={tabId(id)} className={active ? "" : "max-md:hidden"}>
      {children}
    </div>
  );
}
