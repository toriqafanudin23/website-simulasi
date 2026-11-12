import { useEffect, useRef } from "react";
import { point } from "../../lib";
import { BoardControls } from "../../components/graph/BoardControls";
import { COORDS_BY_USER, coordLabel, createFrame, handle, snapTo, type AxisEl, type El } from "../../components/graph/jsx";
import { useJsxBoard, type BoundingBox, type SimBoard } from "../../hooks/useJsxBoard";
import { FUNCS, PALETTE, X0_LIMIT, isZero, type State } from "./model";

export interface Show {
  grid: boolean;
  axisNumbers: boolean;
  pointLabels: boolean;
  snap: boolean;
  curve: boolean;
  derivative: boolean;
  tangent: boolean;
  secant: boolean;
  helpers: boolean;
  p: boolean;
  q: boolean;
}

/** Ketebalan kurva dan ukuran titik yang bisa diatur pengguna. */
export interface Sizes {
  curve: number;
  point: number;
}

interface Scene {
  grid: El;
  axes: AxisEl[];
  curve: El;
  derivative: El;
  tangent: El;
  secant: El;
  helpers: El[];
  p: El;
  q: El;
  d: El;
  labels: { p: El; q: El; d: El };
}

const INITIAL_BOX: BoundingBox = [-7, 7, 7, -7];
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
const finite = Number.isFinite;

interface Props {
  state: State;
  show: Show;
  /** Besar langkah x₀; titik yang diseret menempel ke kelipatannya bila "tempel" aktif. */
  step: number;
  sizes: Sizes;
  /** Seretan di grafik mengubah x₀ (titik P) atau h (titik Q). */
  onChange: (change: Partial<Pick<State, "x0" | "h">>) => void;
  onToggleGrid: () => void;
  fullscreen?: boolean;
}

export function DerivativeBoard({ state, show, step, sizes, onChange, onToggleGrid, fullscreen = false }: Props) {
  // Papan membaca keadaan terbaru lewat ref, jadi elemen JSXGraph cukup dibuat sekali.
  const live = useRef({ state, show, step, sizes });
  live.current = { state, show, step, sizes };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const scene = useRef<Scene | null>(null);
  const dragging = useRef<El | null>(null);
  const frame = useRef(0);
  const pending = useRef<Partial<Pick<State, "x0" | "h">>>({});

  /** Teruskan hasil seretan ke React paling sering sekali per frame. */
  const push = (change: Partial<Pick<State, "x0" | "h">>) => {
    live.current = { ...live.current, state: { ...live.current.state, ...change } };
    pending.current = { ...pending.current, ...change };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const out = pending.current;
      pending.current = {};
      onChangeRef.current(out);
    });
  };

  /** Pindahkan titik yang tidak sedang diseret ke posisi sesuai keadaan. */
  const syncPoints = () => {
    const s = scene.current;
    if (!s) return;
    const { fn, x0, h } = live.current.state;
    const f = FUNCS[fn];
    const move = (el: El, x: number, y: number) => {
      if (el !== dragging.current && finite(x) && finite(y)) el.setPosition(COORDS_BY_USER, [x, y]);
    };
    move(s.p, x0, f.f(x0));
    move(s.q, x0 + h, f.f(x0 + h));
    move(s.d, x0, f.df(x0));
  };

  /** Terapkan tampilan (centang, ukuran, objek yang valid) ke papan. */
  const applyView = () => {
    const s = scene.current;
    if (!s) return;
    const { state: cur, show: v, sizes: z } = live.current;
    const f = FUNCS[cur.fn];
    const hZero = isZero(cur.h);
    const hasTangent = finite(f.df(cur.x0));
    const thin = Math.max(1.5, z.curve * 0.7);

    s.grid.setAttribute({ visible: v.grid });
    s.axes.forEach((axis) => axis.defaultTicks.setAttribute({ visible: v.axisNumbers, drawLabels: v.axisNumbers }));
    s.curve.setAttribute({ visible: v.curve, strokeWidth: z.curve });
    s.derivative.setAttribute({ visible: v.derivative, strokeWidth: thin });
    s.tangent.setAttribute({ visible: v.tangent && hasTangent, strokeWidth: thin });
    s.secant.setAttribute({ visible: v.secant && !hZero, strokeWidth: thin + 0.5 });
    s.helpers.forEach((el) => el.setAttribute({ visible: v.helpers && !hZero }));

    const item = (el: El, label: El, on: boolean, size: number) => {
      el.setAttribute({ visible: on, size });
      label.setAttribute({ visible: on && v.pointLabels });
    };
    item(s.p, s.labels.p, v.p, z.point + 1);
    item(s.q, s.labels.q, v.q && !hZero, z.point);
    item(s.d, s.labels.d, v.derivative && hasTangent, Math.max(2, z.point - 1));
  };

  const setup = (board: SimBoard) => {
    const L = () => live.current;
    const F = () => FUNCS[L().state.fn];
    const P = () => L().state.x0;
    const Hh = () => L().state.h;
    const py = () => F().f(P());
    const qx = () => P() + Hh();
    const secantSlope = () => (isZero(Hh()) ? Number.NaN : (F().f(qx()) - py()) / Hh());
    const { grid, axes } = createFrame(board, L().show.axisNumbers);

    const derivative = board.create("functiongraph", [(x: number) => F().df(x)], {
      strokeColor: PALETTE.derivative,
      strokeWidth: 2,
      dash: 3,
      highlight: false,
    }) as unknown as El;

    const tangent = board.create("functiongraph", [(x: number) => (finite(F().df(P())) ? py() + F().df(P()) * (x - P()) : Number.NaN)], {
      strokeColor: PALETTE.tangent,
      strokeWidth: 2,
      dash: 2,
      highlight: false,
    }) as unknown as El;

    const secant = board.create("functiongraph", [(x: number) => (finite(secantSlope()) ? py() + secantSlope() * (x - P()) : Number.NaN)], {
      strokeColor: PALETTE.secant,
      strokeWidth: 2.5,
      highlight: false,
    }) as unknown as El;

    // Segmen bantu: Δx (mendatar) dan Δy (tegak).
    const helperStyle = {
      strokeWidth: 1.5,
      dash: 2,
      highlight: false,
      fixed: true,
      point1: { visible: false },
      point2: { visible: false },
    };
    const deltaX = board.create(
      "segment",
      [
        [P, py],
        [qx, py],
      ],
      { ...helperStyle, strokeColor: PALETTE.helper },
    ) as unknown as El;
    const deltaY = board.create(
      "segment",
      [
        [qx, py],
        [qx, () => F().f(qx())],
      ],
      { ...helperStyle, strokeColor: PALETTE.secant },
    ) as unknown as El;

    const curve = board.create("functiongraph", [(x: number) => F().f(x)], {
      strokeColor: PALETTE.curve,
      strokeWidth: L().sizes.curve,
      highlight: false,
    }) as unknown as El;

    /** Nilai hasil seretan: menempel ke kelipatan langkah bila "tempel" aktif. */
    const snapV = (v: number) => (L().show.snap ? snapTo(v, L().step) : round3(v));

    // Titik penanda f'(x₀) pada kurva turunan; tidak bisa diseret.
    const d0 = F().df(P());
    const d = handle(board, P(), finite(d0) ? d0 : 0, PALETTE.derivative);
    d.setAttribute({ fixed: true, highlight: false });
    // Q dibuat lebih dulu supaya P berada di atasnya saat keduanya berimpit.
    const q = handle(board, qx(), F().f(qx()), PALETTE.q);
    const p = handle(board, P(), py(), PALETTE.p);

    const labels = {
      p: coordLabel(board, () => p.X(), () => p.Y(), () => `P${point(p.X(), p.Y())}`),
      q: coordLabel(board, () => q.X(), () => q.Y(), () => `Q${point(q.X(), q.Y())}`),
      d: coordLabel(board, () => d.X(), () => d.Y(), () => `f′${point(d.X(), d.Y())}`),
    };

    const begin = (el: El) => () => {
      dragging.current = el;
    };
    const end = () => {
      dragging.current = null;
      syncPoints();
      board.update();
    };

    p.on("down", begin(p));
    p.on("up", end);
    p.on("drag", () => {
      const x = clamp(snapV(p.X()), X0_LIMIT);
      p.setPosition(COORDS_BY_USER, [x, F().f(x)]);
      push({ x0: x });
    });

    q.on("down", begin(q));
    q.on("up", end);
    q.on("drag", () => {
      const h = clamp(round3(snapV(q.X()) - P()), 2 * X0_LIMIT);
      q.setPosition(COORDS_BY_USER, [P() + h, F().f(P() + h)]);
      push({ h });
    });

    scene.current = { grid, axes, curve, derivative, tangent, secant, helpers: [deltaX, deltaY], p, q, d, labels };
    applyView();
  };

  const { boardProps, boardRef, zoomIn, zoomOut, resetView } = useJsxBoard({ boundingBox: INITIAL_BOX, setup });

  useEffect(() => {
    syncPoints();
    applyView();
    boardRef.current?.update();
  }, [state, show, step, sizes, boardRef]);

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
        aria-label="Grafik fungsi f dengan tali busur melalui titik P dan Q serta garis singgung di P. Seret titik P atau Q, seret latar untuk menggeser, gulir atau cubit untuk memperbesar."
      />
      <BoardControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} grid={show.grid} onToggleGrid={onToggleGrid} horizontal={fullscreen} />
    </div>
  );
}
