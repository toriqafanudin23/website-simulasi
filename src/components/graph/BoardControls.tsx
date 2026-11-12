import { GridIcon, MinusIcon, PlusIcon, ResetIcon } from "../ui/Icons";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Status kisi saat ini; tombol kisi hanya tampil bila `onToggleGrid` diberikan. */
  grid?: boolean;
  onToggleGrid?: () => void;
  /** Deret mendatar (layar penuh). Tanpa ini: mendatar di layar sempit, menurun mulai md atau saat ponsel diputar. */
  horizontal?: boolean;
}

const btn = "grid size-11 place-items-center bg-white text-ink transition-colors duration-150 hover:bg-brand hover:text-white";

/** Tombol perbesar, perkecil, dan kembalikan tampilan di pojok kanan bawah papan. */
export function BoardControls({ onZoomIn, onZoomOut, onReset, grid = true, onToggleGrid, horizontal = false }: Props) {
  return (
    <div className={`absolute bottom-3 right-3 z-10 flex gap-px border border-line bg-line ${horizontal ? "flex-row" : "flex-row md:flex-col short:flex-col"}`}>
      <button type="button" className={btn} aria-label="Perbesar" onClick={onZoomIn}>
        <PlusIcon />
      </button>
      <button type="button" className={btn} aria-label="Perkecil" onClick={onZoomOut}>
        <MinusIcon />
      </button>
      <button type="button" className={btn} aria-label="Kembalikan tampilan" onClick={onReset}>
        <ResetIcon />
      </button>
      {onToggleGrid && (
        <button
          type="button"
          className={`grid size-11 place-items-center transition-colors duration-150 ${
            grid ? "bg-brand text-white hover:bg-ink" : "bg-white text-ink hover:bg-brand hover:text-white"
          }`}
          aria-label={grid ? "Sembunyikan kisi" : "Tampilkan kisi"}
          aria-pressed={grid}
          title={grid ? "Sembunyikan kisi" : "Tampilkan kisi"}
          onClick={onToggleGrid}
        >
          <GridIcon />
        </button>
      )}
    </div>
  );
}
