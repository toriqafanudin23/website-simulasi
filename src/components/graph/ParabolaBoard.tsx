import { useEffect, useRef, useState } from "react";
import { point } from "../../lib";
import { useJsxBoard, type BoundingBox, type SimBoard } from "../../hooks/useJsxBoard";
import { BoardControls } from "./BoardControls";
import { COLORS, COORDS_BY_USER, coordLabel, createFrame, handle, snapTo, type El } from "./jsx";

export interface Params {
  a: number;
  h: number;
  k: number;
}

interface Props extends Params {
  /** Titik puncak menempel ke kelipatan langkah saat diseret. */
  step: number;
  onVertexChange: (h: number, k: number) => void;
}

const BOX: BoundingBox = [-10, 7, 10, -7];

/** Papan JSXGraph untuk grafik di beranda: y = a(x − h)² + k dengan titik puncak yang bisa diseret. */
export function ParabolaBoard({ a, h, k, step, onVertexChange }: Props) {
  const live = useRef<Params>({ a, h, k });
  live.current = { a, h, k };
  const onVertex = useRef(onVertexChange);
  onVertex.current = onVertexChange;
  const stepRef = useRef(step);
  stepRef.current = step;
  const vertexRef = useRef<El | null>(null);
  const gridRef = useRef<El | null>(null);
  const [grid, setGrid] = useState(true);
  const frame = useRef(0);

  const setup = (board: SimBoard) => {
    const P = () => live.current;
    gridRef.current = createFrame(board, true).grid;

    board.create(
      "line",
      [
        [() => P().h, 0],
        [() => P().h, 1],
      ],
      {
        straightFirst: true,
        straightLast: true,
        strokeColor: COLORS.symmetry,
        strokeWidth: 1.2,
        dash: 2,
        highlight: false,
        fixed: true,
        point1: { visible: false },
        point2: { visible: false },
      },
    );

    board.create("functiongraph", [(x: number) => P().a * (x - P().h) ** 2 + P().k], {
      strokeColor: COLORS.curve,
      strokeWidth: 3,
      highlight: false,
    });

    const rootX = (sign: 1 | -1) => () => {
      const { a, h, k } = P();
      if (a === 0 || -k / a < 0) return Number.NaN;
      const d = Math.sqrt(-k / a);
      if (d === 0 && sign === -1) return Number.NaN;
      return h + sign * d;
    };
    for (const sign of [1, -1] as const) {
      board.create("point", [rootX(sign), () => (Number.isFinite(rootX(sign)()) ? 0 : Number.NaN)], {
        name: "",
        withLabel: false,
        size: 5,
        fillColor: "#ffffff",
        strokeColor: COLORS.roots,
        strokeWidth: 2,
        fixed: true,
        highlight: false,
        showInfobox: false,
      });
    }

    const vertex = handle(board, P().h, P().k, COLORS.vertex);
    vertexRef.current = vertex;
    coordLabel(board, () => vertex.X(), () => vertex.Y(), () => point(vertex.X(), vertex.Y()));

    vertex.on("drag", () => {
      const x = snapTo(vertex.X(), stepRef.current);
      const y = snapTo(vertex.Y(), stepRef.current);
      vertex.setPosition(COORDS_BY_USER, [x, y]);
      live.current = { ...live.current, h: x, k: y };
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        onVertex.current(live.current.h, live.current.k);
      });
    });
  };

  const { boardProps, boardRef, zoomIn, zoomOut, resetView } = useJsxBoard({ boundingBox: BOX, setup });

  // Slider atau tombol "Atur ulang" mengubah parameter: samakan titik puncak dan gambar ulang.
  useEffect(() => {
    gridRef.current?.setAttribute({ visible: grid });
    boardRef.current?.update();
  }, [grid, boardRef]);

  useEffect(() => {
    const v = vertexRef.current;
    if (v && (Math.abs(v.X() - h) > 1e-9 || Math.abs(v.Y() - k) > 1e-9)) v.setPosition(COORDS_BY_USER, [h, k]);
    boardRef.current?.update();
  }, [a, h, k, boardRef]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  return (
    <div className="relative size-full min-h-0 select-none overflow-hidden bg-white">
      <div {...boardProps} className={`${boardProps.className} absolute inset-0 size-full`} role="img" aria-label="Grafik parabola. Seret titik puncak untuk menggeser parabola." />
      <p className="pointer-events-none absolute left-3 top-3 z-10 max-w-[70%] bg-white/85 px-1 py-0.5 text-[14px] leading-snug text-muted">
        Seret titik oranye. Geser latar untuk menggeser grafik.
      </p>
      <BoardControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} grid={grid} onToggleGrid={() => setGrid((g) => !g)} />
    </div>
  );
}
