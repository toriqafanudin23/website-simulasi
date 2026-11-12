import JXG from "jsxgraph";
import type { SimBoard } from "../../hooks/useJsxBoard";

/** Bagian API elemen JSXGraph yang dipakai di sini. */
export interface El {
  setAttribute(attributes: Record<string, unknown>): unknown;
  on(event: string, handler: () => void): unknown;
  X(): number;
  Y(): number;
  setPosition(method: number, coords: number[]): unknown;
}
export interface AxisEl extends El {
  defaultTicks: El;
}

export const COORDS_BY_USER: number = (JXG as unknown as { COORDS_BY_USER?: number }).COORDS_BY_USER ?? 1;

export const COLORS = {
  curve: "#0ea5e9",
  reference: "#9a9a9a",
  symmetry: "#94a3b8",
  vertex: "#d97706",
  roots: "#e11d48",
  intercept: "#16a34a",
} as const;

const GRID = "#dcdcdc";
const AXIS = "#5a5a5a";

/** Kisi dan dua sumbu bergaya blog. */
export function createFrame(board: SimBoard, axisNumbers: boolean) {
  const grid = board.create("grid", [], {
    strokeColor: GRID,
    strokeOpacity: 1,
    strokeWidth: 1,
    highlight: false,
  }) as unknown as El;

  const axisStyle = { strokeColor: AXIS, strokeWidth: 1.4, highlight: false, withLabel: true };
  const ticks = {
    insertTicks: true,
    minTicksDistance: 36,
    minorTicks: 1,
    majorHeight: 7,
    drawLabels: axisNumbers,
    label: { fontSize: 12, strokeColor: AXIS },
  };
  const xAxis = board.create("axis", [[0, 0], [1, 0]], {
    ...axisStyle,
    name: "x",
    label: { position: "rt", offset: [-14, 14], fontSize: 15, strokeColor: AXIS },
    ticks,
  }) as unknown as AxisEl;
  const yAxis = board.create("axis", [[0, 0], [0, 1]], {
    ...axisStyle,
    name: "y",
    label: { position: "rt", offset: [12, -14], fontSize: 15, strokeColor: AXIS },
    ticks,
  }) as unknown as AxisEl;
  return { grid, axes: [xAxis, yAxis] as AxisEl[] };
}

/** Bulatkan ke kelipatan `step` tanpa sisa desimal. */
export const snapTo = (v: number, step: number) => Math.round((Math.round(v / step) * step) * 1e6) / 1e6 || 0;

/** Titik yang bisa diseret. */
export function handle(board: SimBoard, x: number, y: number, color: string): El {
  return board.create("point", [x, y], {
    name: "",
    withLabel: false,
    size: 6,
    fillColor: color,
    strokeColor: "#ffffff",
    strokeWidth: 2,
    highlightFillColor: color,
    highlightStrokeColor: "#ffffff",
    highlightStrokeWidth: 2,
    // Pembulatan dilakukan sendiri di handler seret. snapToGrid bawaan ikut membulatkan setPosition dari kode,
    // sehingga titik bisa bergeser dari kurva.
    snapToGrid: false,
    showInfobox: false,
    layer: 9,
  }) as unknown as El;
}

/** Teks koordinat di samping titik, dengan tepi putih supaya terbaca di atas garis. */
export function coordLabel(board: SimBoard, x: () => number, y: () => number, text: () => string): El {
  return board.create(
    "text",
    [() => x() + 9 / board.unitX, () => y() + 7 / board.unitY, text],
    {
      anchorX: "left",
      anchorY: "bottom",
      fontSize: 14,
      strokeColor: "#000000",
      highlight: false,
      fixed: true,
      layer: 8,
      cssStyle: "white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;",
    },
  ) as unknown as El;
}
