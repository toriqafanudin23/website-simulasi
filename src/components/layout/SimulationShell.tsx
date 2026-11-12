import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckIcon, CollapseIcon, ExpandIcon, ShareIcon } from "../ui/Icons";
import { PanelTabs, type TabDef } from "../graph/PanelTabs";
import { useFullscreen } from "../../hooks/useFullscreen";

/** Kelas tombol bilah (header dan layar penuh). Tinggi 44px sesuai batas area ketuk. */
export const barButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 bg-tint px-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-white md:px-4";

/** Aman dari takik dan bilah bawah ponsel saat tampilan memenuhi layar. */
const SAFE_AREA =
  "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]";

interface Props<T extends string> {
  title: string;
  /** Alamat yang dibagikan; membawa keadaan simulasi. */
  shareUrl: () => string;
  tabs: readonly TabDef<T>[];
  tab: T;
  onTab: (tab: T) => void;
  /** Papan grafik. Menerima status layar penuh. */
  board: (full: boolean) => ReactNode;
  /** Tulisan di pojok kiri atas grafik (biasanya persamaan). */
  overlay: ReactNode;
  /** Isi panel kontrol; bungkus tiap bagian dengan <TabPanel>. */
  panel: ReactNode;
  /** Isi panel kontrol di layar penuh. */
  fullscreenPanel: (buttonClass: string) => ReactNode;
}

/**
 * Kerangka halaman simulasi: header, papan di atas (ponsel) atau di kanan (md ke atas), panel kontrol
 * dengan tab di layar sempit, dan layar penuh. Tiap simulasi hanya mengisi papan dan kontrolnya.
 */
export function SimulationShell<T extends string>({ title, shareUrl, tabs, tab, onTab, board, overlay, panel, fullscreenPanel }: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { full, enter, exit } = useFullscreen(rootRef);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin tautan ini", shareUrl());
    }
  };

  return (
    <div ref={rootRef} className={`flex flex-col bg-white ${SAFE_AREA} ${full ? "fixed inset-0 z-50" : "h-dvh"}`}>
      {full ? null : (
        <header className="shrink-0">
          <div className="flex h-14 items-center justify-between gap-3 px-4 short:h-12 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" aria-label="1729, beranda" className="grid size-11 shrink-0 place-items-center">
                <svg viewBox="0 0 80 80" aria-hidden="true" className="size-9 short:size-8">
                  <rect width="80" height="80" className="fill-ink" />
                  <path d="M12 66 C 30 66, 32 14, 40 14 S 50 66, 68 66" fill="none" strokeWidth={5} className="stroke-curve" />
                </svg>
              </Link>
              <nav aria-label="Jejak" className="flex min-w-0 items-center gap-2 text-[15px]">
                <Link to="/simulasi" className="hidden text-muted transition-colors hover:text-ink sm:inline">
                  Simulasi
                </Link>
                <span aria-hidden="true" className="hidden text-muted sm:inline">/</span>
                <h1 className="truncate font-serif text-[17px] font-bold">{title}</h1>
              </nav>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={barButtonClass} onClick={share} aria-label="Bagikan tautan simulasi">
                {copied ? <CheckIcon /> : <ShareIcon />}
                <span className="hidden sm:inline">{copied ? "Tautan disalin" : "Bagikan"}</span>
              </button>
              <span role="status" className="sr-only">
                {copied ? "Tautan disalin" : ""}
              </span>
              <button type="button" className={barButtonClass} onClick={enter} aria-label="Layar penuh">
                <ExpandIcon />
                <span className="hidden sm:inline">Layar penuh</span>
              </button>
            </div>
          </div>
          <div aria-hidden="true" className="h-1 bg-ink short:h-0.5" />
        </header>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row short:flex-row">
        <div
          className={`relative min-h-0 md:order-2 short:order-2 ${
            full ? "flex-1" : "h-[40dvh] min-h-[240px] shrink-0 md:h-auto md:min-h-0 md:flex-1 short:h-auto short:min-h-0 short:flex-1"
          }`}
        >
          {board(full)}
          <div
            className={`pointer-events-none absolute left-3 top-3 overflow-hidden bg-white/90 px-3 py-1.5 text-[19px] text-ink ${
              full ? "max-w-[calc(100%-5rem)] sm:max-w-[calc(100%-14rem)]" : "max-w-[calc(100%-1.5rem)]"
            }`}
          >
            {overlay}
          </div>
          {full ? (
            <>
              <button type="button" onClick={exit} aria-label="Keluar dari layar penuh" className={`${barButtonClass} absolute right-3 top-3 z-10`}>
                <CollapseIcon />
                <span className="hidden sm:inline">Keluar layar penuh</span>
              </button>
              {fullscreenPanel(barButtonClass)}
            </>
          ) : null}
        </div>

        {full ? null : (
          <aside
            aria-label="Kontrol simulasi"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-tint md:order-1 md:w-[380px] md:flex-none short:order-1 short:w-[310px] short:flex-none"
          >
            <PanelTabs tabs={tabs} value={tab} onChange={onTab} />
            {panel}
          </aside>
        )}
      </div>
    </div>
  );
}
