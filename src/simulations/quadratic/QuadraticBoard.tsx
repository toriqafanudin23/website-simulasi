import { useEffect, useRef, type ReactNode } from "react";
import { point } from "../../lib";
import { BoardControls } from "../../components/graph/BoardControls";
import { COLORS, COORDS_BY_USER, coordLabel, createFrame, handle, snapTo, type AxisEl, type El } from "../../components/graph/jsx";
import { useJsxBoard, type BoundingBox, type SimBoard } from "../../hooks/useJsxBoard";
import { clean, derive, evalQuad, fromFactor, fromVertex, type Quad } from "./model";

export interface Show {
  grid: boolean;
  axisNumbers: boolean;
  pointLabels: boolean;
  snap: boolean;
  curve: boolean;
  reference: boolean;
  symmetry: boolean;
  vertex: boolean;
  roots: boolean;
  intercept: boolean;
}

interface Scene {
  grid: El;
  axes: AxisEl[];
  curve: El;
  reference: El;
  symmetry: El;
  vertex: El;
  roots: [El, El];
  intercept: El;
  labels: { vertex: El; roots: [El, El]; intercept: El };
}

const INITIAL_BOX: BoundingBox = [-11, 8, 11, -8];
const round2 = (v: number) => Math.round(v * 100) / 100;

interface Props {
  q: Quad;
  show: Show;
  /** Besar langkah parameter; titik yang diseret menempel ke kelipatannya bila "tempel" aktif. */
  step: number;
  onChange: (q: Quad) => void;
  onToggleGrid: () => void;
  /** Elemen melayang di atas grafik (persamaan, tombol layar penuh). */
  children?: ReactNode;
}

export function QuadraticBoard({ q, show, step, onChange, onToggleGrid, children }: Props) {
  // Papan membaca keadaan terbaru lewat ref, jadi elemen JSXGraph cukup dibuat sekali.
  const live = useRef({ q, show, step });
  live.current = { q, show, step };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const scene = useRef<Scene | null>(null);
  const dragging = useRef<El | null>(null);
  const frame = useRef(0);

  /** Teruskan hasil seretan ke React paling sering sekali per frame. */
  const push = (next: Quad) => {
    live.current = { ...live.current, q: next };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      onChangeRef.current(live.current.q);
    });
  };

  /** Pindahkan titik yang tidak sedang diseret ke posisi sesuai parameter. */
  const syncPoints = () => {
    const s = scene.current;
    if (!s) return;
    const cur = live.current.q;
    const d = derive(cur);
    const move = (el: El, x: number, y: number) => {
      if (el !== dragging.current && Number.isFinite(x) && Number.isFinite(y)) el.setPosition(COORDS_BY_USER, [x, y]);
    };
    if (d.isQuad) move(s.vertex, d.h, d.k);
    move(s.roots[0], d.roots[0] ?? Number.NaN, 0);
    move(s.roots[1], d.roots[1] ?? Number.NaN, 0);
    move(s.intercept, 0, cur.c);
  };

  /** Terapkan tampilan (centang, hasil, titik yang valid) ke papan. */
  const applyView = () => {
    const s = scene.current;
    if (!s) return;
    const { q: cur, show: v } = live.current;
    const d = derive(cur);
    s.grid.setAttribute({ visible: v.grid });
    s.axes.forEach((axis) => axis.defaultTicks.setAttribute({ visible: v.axisNumbers, drawLabels: v.axisNumbers }));
    s.curve.setAttribute({ visible: v.curve });
    s.reference.setAttribute({ visible: v.reference });
    s.symmetry.setAttribute({ visible: v.symmetry && d.isQuad });
    const item = (el: El, label: El, on: boolean) => {
      el.setAttribute({ visible: on });
      label.setAttribute({ visible: on && v.pointLabels });
    };
    item(s.vertex, s.labels.vertex, v.vertex && d.isQuad);
    item(s.roots[0], s.labels.roots[0], v.roots && d.isQuad && d.roots.length > 0);
    item(s.roots[1], s.labels.roots[1], v.roots && d.isQuad && d.roots.length > 1);
    item(s.intercept, s.labels.intercept, v.intercept);
  };

  const setup = (board: SimBoard) => {
    const L = () => live.current;
    const D = () => derive(L().q);
    const { grid, axes } = createFrame(board, L().show.axisNumbers);

    const reference = board.create("functiongraph", [(x: number) => x * x], {
      strokeColor: COLORS.reference,
      strokeWidth: 1.5,
      dash: 3,
      highlight: false,
    }) as unknown as El;

    const symmetry = board.create(
      "line",
      [
        [() => D().h, 0],
        [() => D().h, 1],
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
    ) as unknown as El;

    const curve = board.create("functiongraph", [(x: number) => evalQuad(L().q, x)], {
      strokeColor: COLORS.curve,
      strokeWidth: 3,
      highlight: false,
    }) as unknown as El;

    const d0 = D();
    /** Nilai hasil seretan: menempel ke kelipatan langkah bila "tempel" aktif. */
    const snapV = (v: number) => (L().show.snap ? snapTo(v, L().step) : round2(v));
    const vertex = handle(board, d0.isQuad ? d0.h : 0, d0.isQuad ? d0.k : 0, COLORS.vertex);
    const roots: [El, El] = [
      handle(board, d0.roots[0] ?? 0, 0, COLORS.roots),
      handle(board, d0.roots[1] ?? 0, 0, COLORS.roots),
    ];
    const intercept = handle(board, 0, L().q.c, COLORS.intercept);

    const labels = {
      vertex: coordLabel(board, () => vertex.X(), () => vertex.Y(), () => point(vertex.X(), vertex.Y())),
      roots: [0, 1].map((i) =>
        coordLabel(board, () => roots[i].X(), () => 0, () => point(roots[i].X(), 0)),
      ) as [El, El],
      intercept: coordLabel(board, () => 0, () => intercept.Y(), () => point(0, intercept.Y())),
    };

    const begin = (el: El) => () => {
      dragging.current = el;
    };
    const end = () => {
      dragging.current = null;
      syncPoints();
      board.update();
    };

    vertex.on("down", begin(vertex));
    vertex.on("up", end);
    vertex.on("drag", () => {
      const cur = L().q;
      if (!derive(cur).isQuad) return;
      const x = snapV(vertex.X());
      const y = snapV(vertex.Y());
      vertex.setPosition(COORDS_BY_USER, [x, y]);
      push(fromVertex(cur.a, x, y));
    });

    intercept.on("down", begin(intercept));
    intercept.on("up", end);
    intercept.on("drag", () => {
      const y = snapV(intercept.Y());
      intercept.setPosition(COORDS_BY_USER, [0, y]);
      push(clean({ ...L().q, c: y }));
    });

    roots.forEach((el, i) => {
      let other = 0;
      el.on("down", () => {
        dragging.current = el;
        const d = D();
        other = d.roots.length === 2 ? d.roots[1 - i] : (d.roots[0] ?? 0);
      });
      el.on("up", end);
      el.on("drag", () => {
        const x = snapV(el.X());
        el.setPosition(COORDS_BY_USER, [x, 0]);
        if (D().isQuad) push(fromFactor(L().q.a, x, other));
      });
    });

    scene.current = { grid, axes, curve, reference, symmetry, vertex, roots, intercept, labels };
    applyView();
  };

  const { boardProps, boardRef, zoomIn, zoomOut, resetView } = useJsxBoard({ boundingBox: INITIAL_BOX, setup });

  useEffect(() => {
    syncPoints();
    applyView();
    boardRef.current?.update();
  }, [q, show, step, boardRef]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  // Jika tombol dilepas di luar titik, JSXGraph bisa tidak mengirim "up". Tanpa ini titik tertinggal di posisi seretan.
  useEffect(() => {
    const release = () => {
      if (!dragging.current) return;
      dragging.current = null;
      syncPoints();
      boardRef.current?.update();
    };
    const events = ["pointerup", "pointercancel", "mouseup", "touchend"] as const;
    events.forEach((e) => window.addEventListener(e, release));
    return () => events.forEach((e) => window.removeEventListener(e, release));
  }, [boardRef]);

  return (
    <div className="relative size-full min-h-0 select-none overflow-hidden bg-white">
      <div
        {...boardProps}
        className={`${boardProps.className} absolute inset-0 size-full`}
        role="img"
        aria-label="Grafik fungsi kuadrat. Seret titik berwarna untuk mengubah parabola, seret latar untuk menggeser, gulir atau cubit untuk memperbesar."
      />
      <BoardControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} grid={show.grid} onToggleGrid={onToggleGrid} />
      {children}
    </div>
  );
}
