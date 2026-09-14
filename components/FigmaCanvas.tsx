"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* -------------------------------------------------------------------------
   A Figma-flavoured playground that lives *around* the portfolio column.

   - The centre reading column is never covered: drawing is limited to the two
     empty side gutters.
   - Everything is viewport-anchored, so a shape stays exactly where it was
     drawn and remains visible while the page scrolls.
   - Desktop only. Narrow or touch viewports render nothing at all.
   ---------------------------------------------------------------------- */

type ShapeKind =
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "polygon"
  | "star";

type Kind = ShapeKind | "pencil" | "text";

type Tool = "move" | "shape" | "pencil" | "text";

type Swatch = { name: string; fill: string; stroke: string };

type Shape = {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  /** Relative to the shape origin, so moving only has to change x/y. */
  points?: [number, number][];
  text?: string;
  /** Text only: its unscaled measured size, so w/h can scale it. */
  baseW?: number;
  baseH?: number;
};

type Zone = { x0: number; x1: number };

const PALETTE: Swatch[] = [
  { name: "Grey", fill: "#D9D9D9", stroke: "#9B9B9B" },
  { name: "Red", fill: "#FFCDD2", stroke: "#E53935" },
  { name: "Blue", fill: "#C5CAFF", stroke: "#3B4DE8" },
  { name: "Green", fill: "#C6F6D5", stroke: "#22A559" },
  { name: "Yellow", fill: "#FFF1B8", stroke: "#E3B505" },
  { name: "Purple", fill: "#E9D5FF", stroke: "#8B5CF6" },
  { name: "Black", fill: "#1A1A1A", stroke: "#000000" },
  { name: "White", fill: "#FFFFFF", stroke: "#A3A3A3" },
];

const CONTENT_COLUMN = 640; // safe margin around the 520px reading column
const GUTTER = 18;
const MIN_ZONE = 170;
const MAX_SHAPES = 40;
const BLUE = "#0D99FF";

/** Shapes stay this far clear of the bottom of the view. */
const FLOOR_PAD = 16;
/** Thin strokes need a fat invisible band to be clickable. */
const HIT_WIDTH = 16;
/** Nothing can be scaled smaller than this. */
const MIN_SIZE = 8;

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Corner and edge handles, as fractions of the bounding box. */
const HANDLES: { id: Handle; fx: number; fy: number }[] = [
  { id: "nw", fx: 0, fy: 0 },
  { id: "n", fx: 0.5, fy: 0 },
  { id: "ne", fx: 1, fy: 0 },
  { id: "e", fx: 1, fy: 0.5 },
  { id: "se", fx: 1, fy: 1 },
  { id: "s", fx: 0.5, fy: 1 },
  { id: "sw", fx: 0, fy: 1 },
  { id: "w", fx: 0, fy: 0.5 },
];

const ARROW_CURSOR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M5 2.4 L5 19.4 L9.4 15.2 L12 21 L14.8 19.8 L12.2 14.1 L18.1 14.1 Z' fill='%23000000' stroke='%23ffffff' stroke-width='1.4' stroke-linejoin='round'/></svg>\") 5 2, default";

const CURSOR_CSS = `
  body.figma-cursor, body.figma-cursor * { cursor: ${ARROW_CURSOR} !important; }
  body.figma-draw, body.figma-draw * { cursor: crosshair !important; }
  body.figma-cursor [data-figma-text="editing"] { cursor: text !important; }
  /* The page reads like a Figma canvas: a drag never leaves a text selection
     behind. Only the canvas' own text box stays selectable. */
  body.figma-cursor, body.figma-cursor * {
    user-select: none !important;
    -webkit-user-select: none !important;
    -webkit-touch-callout: none;
  }
  body.figma-cursor [data-figma-text="editing"],
  body.figma-cursor [data-figma-text="editing"] * {
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  body.figma-cursor [data-figma-handle="nw"],
  body.figma-cursor [data-figma-handle="se"] { cursor: nwse-resize !important; }
  body.figma-cursor [data-figma-handle="ne"],
  body.figma-cursor [data-figma-handle="sw"] { cursor: nesw-resize !important; }
  body.figma-cursor [data-figma-handle="n"],
  body.figma-cursor [data-figma-handle="s"] { cursor: ns-resize !important; }
  body.figma-cursor [data-figma-handle="e"],
  body.figma-cursor [data-figma-handle="w"] { cursor: ew-resize !important; }
  .figma-btn { transition: background-color .15s ease, color .15s ease; }
  .figma-btn:hover { background: var(--figma-hover); }
  .figma-item:hover { background: ${BLUE}; color: #fff; }
  .figma-item:hover .figma-item-key { color: rgba(255,255,255,.75); }
`;

const uid = () => Math.random().toString(36).slice(2, 9);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function getZones(): Zone[] {
  const vw = document.documentElement.clientWidth;
  const side = (vw - CONTENT_COLUMN) / 2;
  if (side < MIN_ZONE) return [];
  return [
    { x0: GUTTER, x1: side - GUTTER },
    { x0: vw - side + GUTTER, x1: vw - GUTTER },
  ];
}

/* ------------------------------- sound ---------------------------------- */

/* Tiny synthesised blips — no audio files, nothing to download. The context is
   created lazily on the first gesture so autoplay policy never blocks it. */
let audioCtx: AudioContext | null = null;

function getAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") void audioCtx.resume().catch(() => {});
  return audioCtx;
}

function blip(
  type: OscillatorType,
  from: number,
  to: number,
  duration: number,
  peak: number
) {
  try {
    const ctx = getAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch {
    // ignore audio errors
  }
}

const sfx = {
  /** picking a tool */
  tick: () => blip("triangle", 900, 1300, 0.035, 0.022),
  /** pointer goes down and a shape starts being drawn */
  draw: () => blip("sine", 420, 620, 0.05, 0.03),
  /** the shape is finished */
  pop: () => blip("sine", 300, 780, 0.09, 0.05),
  /** something is removed */
  erase: () => blip("sawtooth", 520, 120, 0.11, 0.035),
};

/* ------------------------------ geometry -------------------------------- */

function polygonPoints(s: Shape, sides: number) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
    pts.push(`${cx + (s.w / 2) * Math.cos(a)},${cy + (s.h / 2) * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function starPoints(s: Shape) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    const f = i % 2 === 0 ? 1 : 0.42;
    pts.push(
      `${cx + (s.w / 2) * f * Math.cos(a)},${cy + (s.h / 2) * f * Math.sin(a)}`
    );
  }
  return pts.join(" ");
}

/* ----------------------------- tiny icon set ---------------------------- */

/* Drawn to match Figma's own toolbar glyphs: a 24px grid, 1.5px outlines,
   round caps and joins, and no fills — the arrow included. */
const ic = {
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICON = 22;

function IconMove() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <g transform="rotate(10 12 12)">
        <path d="M6.2 3.2 L6.2 18.1 L10.2 14.3 L12.7 20.2 L15.1 19.1 L12.6 13.3 L17.7 12.7 Z" />
      </g>
    </svg>
  );
}
function IconRect() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
    </svg>
  );
}
function IconEllipse() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}
function IconLine() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <path d="M5 19 L19 5" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <path d="M5 19 L19 5M13.2 5H19v5.8" />
    </svg>
  );
}
function IconPolygon() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <path d="M12 4.6 L19.8 18.4 H4.2 Z" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <path d="M12 3.8l2.55 5.45 5.95.75-4.4 4.15 1.15 5.9L12 17.1l-5.25 2.95 1.15-5.9-4.4-4.15 5.95-.75z" />
    </svg>
  );
}
/** Figma's freehand scribble. */
function IconPencil() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <path d="M2.9 16.9c1.1-4.1 2.3-6.7 3.6-7.6 1.4-1 2 .6 1.6 3-.4 2.4-.2 3.7.9 3.9 1.4.3 2.6-1.9 3.7-4.2 1.1-2.3 2-3.2 2.7-2.5.7.7.3 2.4.6 3.4.4 1.3 1.7 1 2.6-.2l2.5-3.4" />
    </svg>
  );
}
function IconText() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 24 24" {...ic}>
      <path d="M5 7.2V5.4h14v1.8M12 5.4v13.2M9.2 18.6h5.6" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" {...ic}>
      <path d="M4 6h16M9 6V4h6v2M7 6l1 14h8l1-14M10 10v7M14 10v7" />
    </svg>
  );
}
function Caret() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M1.8 3.9 L5 7.1 L8.2 3.9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const SHAPE_ICONS: Record<ShapeKind, React.ReactNode> = {
  rectangle: <IconRect />,
  ellipse: <IconEllipse />,
  line: <IconLine />,
  arrow: <IconArrow />,
  polygon: <IconPolygon />,
  star: <IconStar />,
};

/* ------------------------------ toolbar bits ---------------------------- */

type Ui = {
  panel: string;
  border: string;
  icon: string;
  muted: string;
  hover: string;
  shadow: string;
};

function MenuItem({
  label,
  shortcut,
  icon,
  active,
  ui,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  active?: boolean;
  ui: Ui;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="figma-item flex w-full items-center gap-2.5 rounded-[4px] px-2 py-[6px] text-left text-[12px]"
      style={{ color: ui.icon }}
    >
      <span className="flex w-3.5 justify-center text-[10px]">
        {active ? "✓" : ""}
      </span>
      <span className="flex h-[22px] w-[22px] items-center justify-center">{icon}</span>
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {shortcut && (
        <span className="figma-item-key text-[11px]" style={{ color: ui.muted }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

/* ------------------------------ component ------------------------------- */

class FigmaErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("FigmaCanvas error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function FigmaCanvasInner() {
  const [enabled, setEnabled] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [dark, setDark] = useState(false);

  const [tool, setTool] = useState<Tool>("move");
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rectangle");
  const [shapeMenu, setShapeMenu] = useState(false);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [color, setColor] = useState(0);

  const drawing = useRef<{
    zone: Zone;
    startX: number;
    startY: number;
    shape: Shape;
  } | null>(null);
  const moving = useRef<{
    zone: Zone;
    offX: number;
    offY: number;
    id: string;
    before: Shape[];
  } | null>(null);
  const resizing = useRef<{
    zone: Zone;
    id: string;
    handle: Handle;
    startX: number;
    startY: number;
    orig: Shape;
    before: Shape[];
  } | null>(null);

  /* Undo / redo. Shapes are plain data, so a snapshot of the array is a
     complete, cheap checkpoint. */
  const shapesRef = useRef<Shape[]>(shapes);
  const past = useRef<Shape[][]>([]);
  const future = useRef<Shape[][]>([]);

  const selected = shapes.find((s) => s.id === selectedId) ?? null;
  const isDrawTool = tool !== "move";

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const checkpointRef = useRef<(before?: Shape[]) => void>(() => {});

  /** Checkpoint the current shapes before changing them. */
  const checkpoint = useCallback((before?: Shape[]) => {
    past.current = [...past.current, before ?? shapesRef.current].slice(-60);
    future.current = [];
  }, []);

  useEffect(() => {
    checkpointRef.current = checkpoint;
  }, [checkpoint]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(shapesRef.current);
    setShapes(previous);
    setSelectedId(null);
    setEditingId(null);
    sfx.tick();
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(shapesRef.current);
    setShapes(next);
    setSelectedId(null);
    setEditingId(null);
    sfx.tick();
  }, []);

  /* -- viewport bookkeeping (desktop only) ------------------------------- */

  useEffect(() => {
    const sync = () => {
      const roomy = window.matchMedia("(min-width: 1024px)").matches;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const next = getZones();
      setEnabled(roomy && !touch && next.length > 0);
      setZones(next);
      // Re-seat anything that would now sit outside the gutters or below the
      // new floor.
      setShapes((prev) =>
        prev.map((s) => {
          // Keep a shape on the side it was drawn on: the gutter it sits in,
          // or failing that the nearest one.
          const centre = s.x + s.w / 2;
          const zone =
            next.find((z) => centre >= z.x0 && centre <= z.x1) ??
            next
              .slice()
              .sort(
                (a, b) =>
                  Math.abs(centre - (a.x0 + a.x1) / 2) -
                  Math.abs(centre - (b.x0 + b.x1) / 2)
              )[0];
          if (!zone) return s;

          // A shape drawn in a wide gutter would otherwise spill over the
          // reading column once the window narrows, so scale it to fit first.
          const zoneW = zone.x1 - zone.x0;
          const k = s.w > zoneW ? zoneW / s.w : 1;
          const w = s.w * k;
          const h = s.h * k;
          const floor = window.innerHeight - FLOOR_PAD;

          return {
            ...s,
            w,
            h,
            points:
              k === 1
                ? s.points
                : s.points?.map(
                    (p) => [p[0] * k, p[1] * k] as [number, number]
                  ),
            x: clamp(s.x, zone.x0, Math.max(zone.x0, zone.x1 - w)),
            y: clamp(s.y, 0, Math.max(0, floor - h)),
          };
        })
      );
    };
    sync();
    window.addEventListener("resize", sync);
    // `resize` alone misses a few real-device cases: rotating an iPhone, the
    // iOS URL bar collapsing, and a scrollbar appearing or disappearing.
    window.addEventListener("orientationchange", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      ro.disconnect();
    };
  }, []);

  /* -- follow the site's light / dark theme ------------------------------ */

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  /* -- cursor ------------------------------------------------------------ */

  useEffect(() => {
    const body = document.body;
    if (!enabled) {
      body.classList.remove("figma-cursor", "figma-draw");
      return;
    }
    body.classList.add("figma-cursor");
    body.classList.toggle("figma-draw", isDrawTool && !editingId);
    return () => body.classList.remove("figma-cursor", "figma-draw");
  }, [enabled, isDrawTool, editingId]);

  /* Belt and braces for the selection: Safari and Firefox will still start a
     selection on a drag that began before the CSS applied, and a double click
     selects a word regardless of `user-select`. */
  useEffect(() => {
    if (!enabled) return;
    const inEditor = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('[data-figma-text="editing"]');
    const block = (e: Event) => {
      if (inEditor(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
    };
  }, [enabled]);

  const deselect = useCallback(() => {
    setSelectedId(null);
  }, []);

  /* -- keyboard ---------------------------------------------------------- */

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable ||
          el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA")
      ) {
        if (e.key === "Escape") el.blur();
        return;
      }
      // Undo / redo. Typing inside the canvas' text box is handled above, so
      // the browser's own undo still applies there.
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        const wantsRedo = key === "y" || (key === "z" && e.shiftKey);
        if (wantsRedo) {
          if (future.current.length) {
            e.preventDefault();
            redo();
          }
          return;
        }
        if (key === "z") {
          if (past.current.length) {
            e.preventDefault();
            undo();
          }
          return;
        }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        setTool("move");
        setShapeMenu(false);
        deselect();
        return;
      }
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault();
        checkpoint();
        setShapes((prev) => prev.filter((s) => s.id !== selectedId));
        setSelectedId(null);
        sfx.erase();
        return;
      }
      const k = e.key.toLowerCase();
      const pick = (t: Tool, sk?: ShapeKind) => {
        deselect();
        setTool(t);
        if (sk) setShapeKind(sk);
        setShapeMenu(false);
        sfx.tick();
      };
      if (k === "v") pick("move");
      else if (k === "r") pick("shape", "rectangle");
      else if (k === "o") pick("shape", "ellipse");
      else if (k === "l") pick("shape", "line");
      else if (k === "p") pick("pencil");
      else if (k === "t") pick("text");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, selectedId, deselect, checkpoint, undo, redo]);

  /* -- click away -------------------------------------------------------- */

  useEffect(() => {
    if (!selectedId && !shapeMenu) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest) return;
      if (el.closest("[data-figma-toolbar]")) return;
      setShapeMenu(false);
      if (el.closest("[data-figma-id], [data-figma-text], [data-figma-handle]"))
        return;
      deselect();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [selectedId, shapeMenu, deselect]);

  /* -- drawing ----------------------------------------------------------- */

  const startDraw = (e: React.PointerEvent, zone: Zone) => {
    if (!isDrawTool || e.button !== 0) return;
    if (shapes.length >= MAX_SHAPES) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    deselect();
    setShapeMenu(false);

    const floor = window.innerHeight - FLOOR_PAD;
    const x = clamp(e.clientX, zone.x0, zone.x1);
    const y = clamp(e.clientY, 0, floor);

    if (tool === "text") {
      const id = uid();
      setShapes((prev) => [
        ...prev,
        {
          id,
          kind: "text",
          x,
          y,
          w: 120,
          h: 22,
          color,
          text: "",
        },
      ]);
      setEditingId(id);
      setTool("move");
      sfx.draw();
      return;
    }

    const kind: Kind = tool === "pencil" ? "pencil" : shapeKind;
    const isLineOrArrow = kind === "line" || kind === "arrow";
    const shape: Shape = {
      id: uid(),
      kind,
      x,
      y,
      w: 0,
      h: 0,
      color,
      ...(kind === "pencil"
        ? { points: [[0, 0]] as [number, number][] }
        : isLineOrArrow
        ? { points: [[0, 0], [0, 0]] as [number, number][] }
        : {}),
    };
    document.body.classList.add("figma-dragging");
    drawing.current = { zone, startX: x, startY: y, shape };
    setDraft(shape);
    sfx.draw();
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const floor = window.innerHeight - FLOOR_PAD;
      const d = drawing.current;

      if (d) {
        const x = clamp(e.clientX, d.zone.x0, d.zone.x1);
        const y = clamp(e.clientY, 0, floor);

        if (d.shape.kind === "pencil") {
          const abs = [
            ...(d.shape.points ?? []).map(
              (p) =>
                [p[0] + d.shape.x, p[1] + d.shape.y] as [number, number]
            ),
            [x, y] as [number, number],
          ];
          const xs = abs.map((p) => p[0]);
          const ys = abs.map((p) => p[1]);
          const ox = Math.min(...xs);
          const oy = Math.min(...ys);
          d.shape = {
            ...d.shape,
            x: ox,
            y: oy,
            w: Math.max(...xs) - ox,
            h: Math.max(...ys) - oy,
            points: abs.map((p) => [p[0] - ox, p[1] - oy] as [number, number]),
          };
        } else if (d.shape.kind === "line" || d.shape.kind === "arrow") {
          const ox = Math.min(d.startX, x);
          const oy = Math.min(d.startY, y);
          d.shape = {
            ...d.shape,
            x: ox,
            y: oy,
            w: Math.abs(x - d.startX),
            h: Math.abs(y - d.startY),
            points: [
              [d.startX - ox, d.startY - oy],
              [x - ox, y - oy],
            ],
          };
        } else {
          let w = x - d.startX;
          let h = y - d.startY;
          if (e.shiftKey) {
            const side = Math.min(Math.abs(w), Math.abs(h));
            w = Math.sign(w) * side;
            h = Math.sign(h) * side;
          }
          d.shape = {
            ...d.shape,
            x: Math.min(d.startX, d.startX + w),
            y: Math.min(d.startY, d.startY + h),
            w: Math.abs(w),
            h: Math.abs(h),
          };
        }
        setDraft({ ...d.shape });
        return;
      }

      const r = resizing.current;
      if (r) {
        const { orig, handle, zone } = r;
        const east = handle.includes("e");
        const west = handle.includes("w");
        const south = handle.includes("s");
        const north = handle.includes("n");
        let dx = e.clientX - r.startX;
        let dy = e.clientY - r.startY;

        // Shift on a corner keeps the proportions.
        const proportional =
          e.shiftKey &&
          (east || west) &&
          (north || south) &&
          orig.w > 0 &&
          orig.h > 0;
        if (proportional) {
          const k = Math.max(
            (orig.w + (east ? dx : -dx)) / orig.w,
            (orig.h + (south ? dy : -dy)) / orig.h
          );
          dx = (east ? 1 : -1) * (orig.w * k - orig.w);
          dy = (south ? 1 : -1) * (orig.h * k - orig.h);
        }

        let x = orig.x;
        let y = orig.y;
        let w = orig.w;
        let h = orig.h;
        if (east) w = orig.w + dx;
        if (west) {
          w = orig.w - dx;
          x = orig.x + dx;
        }
        if (south) h = orig.h + dy;
        if (north) {
          h = orig.h - dy;
          y = orig.y + dy;
        }

        // A flat shape (a horizontal line, say) keeps its flat axis flat.
        const minW = orig.w > 0 ? MIN_SIZE : 0;
        const minH = orig.h > 0 ? MIN_SIZE : 0;
        if (w < minW) {
          if (west) x = orig.x + orig.w - minW;
          w = minW;
        }
        if (h < minH) {
          if (north) y = orig.y + orig.h - minH;
          h = minH;
        }

        // Never let a resize push past the gutter or out of the view.
        if (x < zone.x0) {
          w -= zone.x0 - x;
          x = zone.x0;
        }
        if (x + w > zone.x1) w = zone.x1 - x;
        if (y < 0) {
          h += y;
          y = 0;
        }
        if (y + h > floor) h = floor - y;
        w = Math.max(w, minW);
        h = Math.max(h, minH);

        // Clamping against the gutter can trim one axis, so restore the
        // aspect ratio afterwards rather than before.
        if (proportional) {
          const k = Math.min(w / orig.w, h / orig.h);
          w = orig.w * k;
          h = orig.h * k;
          if (west) x = orig.x + orig.w - w;
          if (north) y = orig.y + orig.h - h;
        }

        const kx = orig.w > 0 ? w / orig.w : 1;
        const ky = orig.h > 0 ? h / orig.h : 1;

        setShapes((prev) =>
          prev.map((sh) =>
            sh.id !== r.id
              ? sh
              : {
                  ...sh,
                  x,
                  y,
                  w,
                  h,
                  // strokes and scribbles scale with the box
                  points: orig.points?.map(
                    (pt) => [pt[0] * kx, pt[1] * ky] as [number, number]
                  ),
                }
          )
        );
        return;
      }

      const m = moving.current;
      if (!m) return;
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== m.id) return s;
          return {
            ...s,
            x: clamp(e.clientX - m.offX, m.zone.x0, Math.max(m.zone.x0, m.zone.x1 - s.w)),
            y: clamp(e.clientY - m.offY, 0, floor - s.h),
          };
        })
      );
    };

    const onUp = () => {
      const d = drawing.current;
      if (d) {
        drawing.current = null;
        setDraft(null);
        const s = d.shape;
        const worthKeeping =
          s.kind === "pencil"
            ? (s.points?.length ?? 0) > 1 && (s.w > 4 || s.h > 4)
            : s.kind === "line" || s.kind === "arrow"
            ? s.w > 4 || s.h > 4
            : s.w > 6 || s.h > 6;
        if (worthKeeping) {
          checkpointRef.current();
          const final =
            s.kind === "pencil" || s.kind === "line" || s.kind === "arrow"
              ? s
              : { ...s, w: Math.max(s.w, 8), h: Math.max(s.h, 8) };
          setShapes((prev) => [...prev, final]);
          setSelectedId(final.id);
          sfx.pop();
        }
        setTool("move");
      }
      // A click that merely selects must not fill the undo stack, so a drag
      // or scale is only recorded when it actually changed the shapes.
      const gesture = moving.current ?? resizing.current;
      if (gesture && gesture.before !== shapesRef.current) {
        checkpointRef.current(gesture.before);
      }
      moving.current = null;
      resizing.current = null;
      document.body.classList.remove("figma-dragging");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const startMove = (e: React.PointerEvent, s: Shape) => {
    if (tool !== "move" || e.button !== 0) return;
    e.stopPropagation();
    if (editingId !== s.id) {
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
    }
    setSelectedId(s.id);
    document.body.classList.add("figma-dragging");
    const centre = s.x + s.w / 2;
    const zone =
      zones.find((z) => centre >= z.x0 && centre <= z.x1) ?? zones[0];
    if (!zone) return;
    moving.current = {
      zone,
      id: s.id,
      offX: e.clientX - s.x,
      offY: e.clientY - s.y,
      before: shapesRef.current,
    };
  };

  const startResize = (e: React.PointerEvent, s: Shape, handle: Handle) => {
    if (tool !== "move" || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    const centre = s.x + s.w / 2;
    const zone =
      zones.find((z) => centre >= z.x0 && centre <= z.x1) ?? zones[0];
    if (!zone) return;
    document.body.classList.add("figma-dragging");
    resizing.current = {
      zone,
      id: s.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      orig: s,
      before: shapesRef.current,
    };
  };

  const applyColor = (i: number) => {
    setColor(i);
    if (selectedId) {
      checkpoint();
      setShapes((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, color: i } : s))
      );
    }
    sfx.tick();
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    checkpoint();
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
    sfx.erase();
  };

  const chooseTool = (t: Tool, sk?: ShapeKind) => {
    deselect();
    setTool(t);
    if (sk) setShapeKind(sk);
    setShapeMenu(false);
    sfx.tick();
  };

  if (!enabled) return null;

  /* ------------------------------ render -------------------------------- */

  const ui: Ui = dark
    ? {
        panel: "#2c2c2c",
        border: "rgba(255,255,255,0.10)",
        icon: "#e6e6e6",
        muted: "#8c8c8c",
        hover: "rgba(255,255,255,0.10)",
        shadow: "0 10px 36px rgba(0,0,0,0.45)",
      }
    : {
        panel: "#ffffff",
        border: "rgba(0,0,0,0.08)",
        icon: "#1e1e1e",
        muted: "#8c8c8c",
        hover: "rgba(0,0,0,0.06)",
        shadow: "0 10px 30px rgba(0,0,0,0.14)",
      };

  const panelStyle = {
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: ui.shadow,
    ["--figma-hover" as string]: ui.hover,
  } as React.CSSProperties;

  const btnStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: BLUE, color: "#ffffff" }
      : { color: ui.icon, background: "transparent" };

  const renderShape = (s: Shape, isDraft = false) => {
    const c = PALETTE[s.color] ?? PALETTE[0];
    const common = {
      fill: c.fill,
      stroke: c.stroke,
      strokeWidth: 1.5,
      opacity: isDraft ? 0.75 : 1,
    };
    const handlers = {
      "data-figma-id": s.id,
      style: {
        pointerEvents: (!isDraft && tool === "move" ? "auto" : "none") as
          | "auto"
          | "none",
      },
    };

    switch (s.kind) {
      case "rectangle":
        return (
          <rect
            {...common}
            {...handlers}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={2}
          />
        );
      case "ellipse":
        return (
          <ellipse
            {...common}
            {...handlers}
            cx={s.x + s.w / 2}
            cy={s.y + s.h / 2}
            rx={s.w / 2}
            ry={s.h / 2}
          />
        );
      case "polygon":
        return (
          <polygon {...common} {...handlers} points={polygonPoints(s, 3)} />
        );
      case "star":
        return <polygon {...common} {...handlers} points={starPoints(s)} />;
      case "line":
      case "arrow": {
        const p1 = s.points?.[0] ?? [0, 0];
        const p2 = s.points?.[1] ?? [s.w, s.h];
        const [x1, y1] = [p1[0] + s.x, p1[1] + s.y];
        const [x2, y2] = [p2[0] + s.x, p2[1] + s.y];
        const hasLength = Math.hypot(x2 - x1, y2 - y1) > 0.5;
        const colorIdx =
          typeof s.color === "number" && s.color >= 0 && s.color < PALETTE.length
            ? s.color
            : 0;
        return (
          <g {...handlers} opacity={isDraft ? 0.75 : 1}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={c.stroke}
              strokeWidth={2}
              strokeLinecap="round"
              markerEnd={
                s.kind === "arrow" && hasLength
                  ? `url(#fig-arrow-${colorIdx})`
                  : undefined
              }
            />
            {/* fat invisible hit area */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth={HIT_WIDTH}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case "pencil": {
        const pts = (s.points ?? [])
          .map((p) => `${p[0] + s.x},${p[1] + s.y}`)
          .join(" ");
        return (
          <g {...handlers} opacity={isDraft ? 0.75 : 1}>
            {/* A 2px stroke is far too thin to click, so the same path is
                drawn again, fat and transparent, as the hit area. */}
            <polyline
              points={pts}
              fill="none"
              stroke="transparent"
              strokeWidth={HIT_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={pts}
              fill="none"
              stroke={c.stroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      }
      default:
        return null;
    }
  };

  const badgeTarget = draft ?? selected;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CURSOR_CSS }} />

      {/* ------------------------ canvas layer ------------------------- */}
      <div
        className="pointer-events-none fixed inset-0 z-30"
        onPointerDown={(e) => {
          const hit = (e.target as Element).closest?.("[data-figma-id]");
          const id = hit?.getAttribute("data-figma-id");
          if (!id) return;
          const shape = shapes.find((s) => s.id === id);
          if (shape) startMove(e, shape);
        }}
      >
        {/* drawing surfaces — side gutters only, never the reading column */}
        {isDrawTool &&
          zones.map((z) => (
            <div
              key={`draw-${z.x0}`}
              onPointerDown={(e) => startDraw(e, z)}
              className="pointer-events-auto absolute inset-y-0"
              style={{ left: z.x0, width: z.x1 - z.x0 }}
            />
          ))}

        <svg
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: "none" }}
          aria-hidden="true"
        >
          <defs>
            {PALETTE.map((c, i) => (
              <marker
                key={c.name}
                id={`fig-arrow-${i}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10 z" fill={c.stroke} />
              </marker>
            ))}
          </defs>

          {shapes
            .filter((s) => s.kind !== "text")
            .map((s) => (
              <g key={s.id}>{renderShape(s)}</g>
            ))}
          {draft && renderShape(draft, true)}

          {/* selection chrome */}
          {selected && !editingId && (
            <g>
              <rect
                x={selected.x - 0.5}
                y={selected.y - 0.5}
                width={selected.w + 1}
                height={selected.h + 1}
                fill="none"
                stroke={BLUE}
                strokeWidth={1.5}
                pointerEvents="none"
              />
              {HANDLES.map(({ id, fx, fy }) => {
                const hx = selected.x + selected.w * fx;
                const hy = selected.y + selected.h * fy;
                return (
                  <g key={id}>
                    {/* generous invisible grab area */}
                    <rect
                      data-figma-handle={id}
                      x={hx - 7}
                      y={hy - 7}
                      width={14}
                      height={14}
                      fill="transparent"
                      style={{ pointerEvents: "auto" }}
                      onPointerDown={(e) => startResize(e, selected, id)}
                    />
                    <rect
                      x={hx - 3}
                      y={hy - 3}
                      width={6}
                      height={6}
                      fill="#ffffff"
                      stroke={BLUE}
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* width × height badge, exactly like Figma's */}
          {badgeTarget && !editingId && (
            <g pointerEvents="none">
              <rect
                x={badgeTarget.x + badgeTarget.w / 2 - 34}
                y={badgeTarget.y + badgeTarget.h + 6}
                width={68}
                height={17}
                rx={3}
                fill={BLUE}
              />
              <text
                x={badgeTarget.x + badgeTarget.w / 2}
                y={badgeTarget.y + badgeTarget.h + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#ffffff"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {Math.round(badgeTarget.w)} × {Math.round(badgeTarget.h)}
              </text>
            </g>
          )}
        </svg>

        {/* text layers live in the DOM so they stay editable */}
        {shapes
          .filter((s) => s.kind === "text")
          .map((s) => (
            <div
              key={s.id}
              data-figma-text={editingId === s.id ? "editing" : "idle"}
              contentEditable={editingId === s.id}
              suppressContentEditableWarning
              spellCheck={false}
              ref={(el) => {
                if (el && editingId === s.id && document.activeElement !== el) {
                  el.focus();
                }
              }}
              onBlur={(e) => {
                const node = e.currentTarget;
                const text = node.textContent ?? "";
                // offsetWidth/Height ignore the CSS transform, so this is the
                // natural size; any scale already applied is preserved below.
                const w = node.offsetWidth;
                const h = node.offsetHeight;
                setEditingId(null);
                checkpoint();
                setShapes((prev) =>
                  text.trim()
                    ? prev.map((sh) => {
                        if (sh.id !== s.id) return sh;
                        const kx = sh.baseW ? sh.w / sh.baseW : 1;
                        const ky = sh.baseH ? sh.h / sh.baseH : 1;
                        return {
                          ...sh,
                          text,
                          baseW: w,
                          baseH: h,
                          w: w * kx,
                          h: h * ky,
                        };
                      })
                    : prev.filter((sh) => sh.id !== s.id)
                );
                if (text.trim()) sfx.pop();
              }}
              onDoubleClick={() => {
                if (tool === "move") setEditingId(s.id);
              }}
              onPointerDown={(e) => {
                if (editingId === s.id) return;
                startMove(e, s);
              }}
              className="pointer-events-auto absolute min-w-[24px] whitespace-pre text-[15px] leading-[1.4] outline-none"
              style={{
                left: s.x,
                top: s.y,
                color: (PALETTE[s.color] ?? PALETTE[0]).stroke,
                transform:
                  s.baseW && s.baseH
                    ? `scale(${s.w / s.baseW}, ${s.h / s.baseH})`
                    : undefined,
                transformOrigin: "top left",
                boxShadow:
                  editingId === s.id ? `0 0 0 1.5px ${BLUE}` : undefined,
              }}
            >
              {s.text}
            </div>
          ))}
      </div>

      {/* --------------------------- toolbar --------------------------- */}
      <motion.div
        data-figma-toolbar=""
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 select-none"
      >
        {/* colour + delete bar for the active tool / selected shape */}
        <AnimatePresence>
          {(selected || isDrawTool) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={panelStyle}
              className="absolute bottom-[calc(100%+8px)] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-[10px] px-2 py-1.5"
            >
              {PALETTE.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => applyColor(i)}
                  className="figma-btn flex h-6 w-6 items-center justify-center rounded-[5px]"
                >
                  <span
                    className="block h-[15px] w-[15px] rounded-[3px]"
                    style={{
                      background: c.fill,
                      boxShadow: `inset 0 0 0 1.5px ${
                        (selected ? selected.color : color) === i
                          ? BLUE
                          : c.stroke
                      }`,
                    }}
                  />
                </button>
              ))}
              {selected && (
                <>
                  <span
                    className="mx-1 h-4 w-px"
                    style={{ background: ui.border }}
                  />
                  <button
                    type="button"
                    title="Delete (⌫)"
                    onClick={deleteSelected}
                    className="figma-btn flex h-6 w-6 items-center justify-center rounded-[5px]"
                    style={{ color: ui.icon }}
                  >
                    <IconTrash />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={panelStyle}
          className="flex items-center gap-[6px] rounded-[13px] px-[9px] py-[6px]"
        >
          {/* cursor */}
          <button
            type="button"
            title="Move (V)"
            onClick={() => chooseTool("move")}
            className="figma-btn flex h-10 w-10 items-center justify-center rounded-[5px]"
            style={btnStyle(tool === "move")}
          >
            <IconMove />
          </button>

          {/* shapes */}
          <div className="relative flex items-center">
            <button
              type="button"
              title="Shape"
              onClick={() => chooseTool("shape")}
              className="figma-btn flex h-10 w-10 items-center justify-center rounded-[5px]"
              style={btnStyle(tool === "shape")}
            >
              {SHAPE_ICONS[shapeKind]}
            </button>
            <button
              type="button"
              aria-label="Choose a shape"
              onClick={() => setShapeMenu((v) => !v)}
              className="figma-btn flex h-10 w-[15px] items-center justify-center rounded-[5px]"
              style={{ color: tool === "shape" ? ui.icon : ui.muted }}
            >
              <Caret />
            </button>
            <AnimatePresence>
              {shapeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{
                    duration: 0.14,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={panelStyle}
                  className="absolute bottom-[calc(100%+10px)] left-0 min-w-[176px] rounded-[8px] p-1.5"
                >
                  {(
                    [
                      ["rectangle", "Rectangle", "R"],
                      ["ellipse", "Ellipse", "O"],
                      ["line", "Line", "L"],
                      ["arrow", "Arrow", ""],
                      ["polygon", "Polygon", ""],
                      ["star", "Star", ""],
                    ] as [ShapeKind, string, string][]
                  ).map(([k, label, sc]) => (
                    <MenuItem
                      key={k}
                      ui={ui}
                      label={label}
                      shortcut={sc}
                      icon={SHAPE_ICONS[k]}
                      active={tool === "shape" && shapeKind === k}
                      onClick={() => chooseTool("shape", k)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* pencil */}
          <button
            type="button"
            title="Pencil (P)"
            onClick={() => chooseTool("pencil")}
            className="figma-btn flex h-10 w-10 items-center justify-center rounded-[5px]"
            style={btnStyle(tool === "pencil")}
          >
            <IconPencil />
          </button>

          {/* text */}
          <button
            type="button"
            title="Text (T)"
            onClick={() => chooseTool("text")}
            className="figma-btn flex h-10 w-10 items-center justify-center rounded-[5px]"
            style={btnStyle(tool === "text")}
          >
            <IconText />
          </button>
        </div>
      </motion.div>
    </>
  );
}

export function FigmaCanvas() {
  return (
    <FigmaErrorBoundary>
      <FigmaCanvasInner />
    </FigmaErrorBoundary>
  );
}
