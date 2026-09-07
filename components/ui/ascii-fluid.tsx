"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type AsciiFluidProps = {
  className?: string
  /**
   * Brightness ramp (sparse → dense). Default is a full letter/symbol map.
   */
  charset?: string
  /** Glyph cell size in CSS pixels. Default `12` */
  cellSize?: number
  /** Ink color (hex). Default follows theme. */
  color?: string
  /** Stage color (hex). Default follows theme. */
  backgroundColor?: string
  /** Mouse trail / fluid force. Default `1` */
  force?: number
  /** How quickly trails fade (higher = vanish sooner). Default `0.05` */
  dissipation?: number
  /** Trail brush size 0–1. Default `0.55` */
  brush?: number
  /** Soft ambient swirl when idle. Default `true` */
  animate?: boolean
  /** Follow pointer. Default `true` */
  interactive?: boolean
  /**
   * Skip the GPU simulation on touch / low-power devices and paint a flat
   * stage instead. There is no hover trail to see on a phone, and the solve
   * is what pushes mobile Safari into throttling and context loss.
   * Default `true`.
   */
  disableOnTouch?: boolean
  /**
   * Palette mode. Default `auto` follows shadcn / next-themes
   * (`html.dark` class).
   */
  theme?: "light" | "dark" | "auto"
}

/** Sparse → dense brightness ramp (letters + symbols). */
const DEFAULT_CHARSET =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

const LIGHT = { ink: "#121212", paper: "#ffffff" }
const DARK = { ink: "#f5f5f5", paper: "#000000" }

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

// Velocity / dye stored biased in RGBA8: enc(v) = v * 0.05 + 0.5
const FRAG_SPLAT = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_target;
uniform vec2 u_point;
uniform vec3 u_color;
uniform float u_radius;
uniform float u_aspect;
uniform float u_velocityField;

vec2 dec(vec2 e) { return (e - 0.5) / 0.05; }
vec2 enc(vec2 v) { return clamp(v * 0.05 + 0.5, 0.0, 1.0); }

void main() {
  vec2 p = v_uv - u_point;
  p.x *= u_aspect;
  float d = exp(-dot(p, p) / max(u_radius, 0.0001));
  vec3 base = texture2D(u_target, v_uv).xyz;
  if (u_velocityField > 0.5) {
    vec2 next = dec(base.xy) + u_color.xy * d;
    gl_FragColor = vec4(enc(next), 0.5, 1.0);
  } else {
    gl_FragColor = vec4(base + u_color * d, 1.0);
  }
}
`

const FRAG_ADVECT = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform vec2 u_texel;
uniform float u_dt;
uniform float u_dissipation;
uniform float u_velocityField;

vec2 dec(vec2 e) { return (e - 0.5) / 0.05; }
vec2 enc(vec2 v) { return clamp(v * 0.05 + 0.5, 0.0, 1.0); }

void main() {
  vec2 vel = dec(texture2D(u_velocity, v_uv).xy);
  vec2 coord = v_uv - u_dt * vel * u_texel * 110.0;
  vec4 src = texture2D(u_source, clamp(coord, 0.0, 1.0));
  if (u_velocityField > 0.5) {
    vec2 next = dec(src.xy) * u_dissipation;
    gl_FragColor = vec4(enc(next), 0.5, 1.0);
  } else {
    gl_FragColor = vec4(src.xyz * u_dissipation, 1.0);
  }
}
`

const FRAG_DIVERGENCE = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_velocity;
uniform vec2 u_texel;

vec2 dec(vec2 e) { return (e - 0.5) / 0.05; }

void main() {
  float L = dec(texture2D(u_velocity, v_uv - vec2(u_texel.x, 0.0)).xy).x;
  float R = dec(texture2D(u_velocity, v_uv + vec2(u_texel.x, 0.0)).xy).x;
  float B = dec(texture2D(u_velocity, v_uv - vec2(0.0, u_texel.y)).xy).y;
  float T = dec(texture2D(u_velocity, v_uv + vec2(0.0, u_texel.y)).xy).y;
  float div = 0.5 * ((R - L) + (T - B));
  gl_FragColor = vec4(div * 0.05 + 0.5, 0.0, 0.0, 1.0);
}
`

const FRAG_PRESSURE = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform vec2 u_texel;

float dec1(float e) { return (e - 0.5) / 0.05; }
float enc1(float v) { return clamp(v * 0.05 + 0.5, 0.0, 1.0); }

void main() {
  float L = dec1(texture2D(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x);
  float R = dec1(texture2D(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x);
  float B = dec1(texture2D(u_pressure, v_uv - vec2(0.0, u_texel.y)).x);
  float T = dec1(texture2D(u_pressure, v_uv + vec2(0.0, u_texel.y)).x);
  float C = dec1(texture2D(u_divergence, v_uv).x);
  float p = (L + R + B + T - C) * 0.25;
  gl_FragColor = vec4(enc1(p), 0.0, 0.0, 1.0);
}
`

const FRAG_GRADIENT = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
uniform vec2 u_texel;

float dec1(float e) { return (e - 0.5) / 0.05; }
vec2 dec(vec2 e) { return (e - 0.5) / 0.05; }
vec2 enc(vec2 v) { return clamp(v * 0.05 + 0.5, 0.0, 1.0); }

void main() {
  float L = dec1(texture2D(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x);
  float R = dec1(texture2D(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x);
  float B = dec1(texture2D(u_pressure, v_uv - vec2(0.0, u_texel.y)).x);
  float T = dec1(texture2D(u_pressure, v_uv + vec2(0.0, u_texel.y)).x);
  vec2 vel = dec(texture2D(u_velocity, v_uv).xy);
  vel -= vec2(R - L, T - B) * 0.5;
  gl_FragColor = vec4(enc(vel), 0.5, 1.0);
}
`

const FRAG_DISPLAY = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_dye;
uniform sampler2D u_atlas;
uniform vec2 u_resolution;
uniform vec2 u_cell;
uniform float u_charCount;
uniform vec3 u_ink;
uniform vec3 u_paper;
uniform float u_time;
uniform float u_animate;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 pixel = v_uv * u_resolution;
  vec2 cell = floor(pixel / u_cell);
  vec2 cellUv = (cell + 0.5) * u_cell / u_resolution;

  float dens = clamp(texture2D(u_dye, cellUv).x, 0.0, 1.0);

  // Soft neighborhood sample for a low-res glow halo under the glyphs
  vec2 texel = u_cell / u_resolution;
  float glow =
    dens * 0.40 +
    texture2D(u_dye, cellUv + vec2( texel.x, 0.0)).x * 0.15 +
    texture2D(u_dye, cellUv - vec2( texel.x, 0.0)).x * 0.15 +
    texture2D(u_dye, cellUv + vec2(0.0,  texel.y)).x * 0.15 +
    texture2D(u_dye, cellUv - vec2(0.0,  texel.y)).x * 0.15;
  glow = clamp(glow, 0.0, 1.0);
  glow = pow(glow, 1.35);

  float lit = dens;
  if (u_animate > 0.5) {
    float flicker = hash21(cell + floor(u_time * 10.0)) - 0.5;
    lit = clamp(lit + flicker * 0.05, 0.0, 1.0);
  }

  float idx = min(floor(lit * (u_charCount - 0.001)), u_charCount - 1.0);
  vec2 local = fract(pixel / u_cell);
  float u0 = (idx + local.x) / u_charCount;
  float glyph = texture2D(u_atlas, vec2(u0, local.y)).r;

  float alpha = glyph * smoothstep(0.02, 0.12, dens);

  // Paper → soft ink wash → sharp ASCII on top
  float wash = glow * 0.22;
  vec3 col = mix(u_paper, u_ink, wash);
  col = mix(col, u_ink, clamp(alpha, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim()
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return [0.1, 0.1, 0.12]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

function resolveDark(theme: "light" | "dark" | "auto"): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return isDarkTheme()
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "AsciiFluid: shader failed to compile\n",
        gl.getShaderInfoLog(shader)
      )
    }
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * A linked program with every uniform location resolved once. Resolving them
 * per frame costs hundreds of validated GL calls a frame, which is measurably
 * expensive in Safari's WebGL implementation.
 */
type Prog = {
  program: WebGLProgram
  fs: WebGLShader
  u: Record<string, WebGLUniformLocation | null>
  posLoc: number
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fragSource: string,
  uniforms: readonly string[]
): Prog | null {
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSource)
  if (!fs) return null
  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(fs)
    return null
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "AsciiFluid: program failed to link\n",
        gl.getProgramInfoLog(program)
      )
    }
    gl.deleteProgram(program)
    gl.deleteShader(fs)
    return null
  }
  const u: Record<string, WebGLUniformLocation | null> = {}
  for (const name of uniforms) u[name] = gl.getUniformLocation(program, name)
  return { program, fs, u, posLoc: gl.getAttribLocation(program, "a_position") }
}

type FBO = {
  tex: WebGLTexture
  fbo: WebGLFramebuffer
  w: number
  h: number
}

function createFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  filter: number
): FBO | null {
  const tex = gl.createTexture()
  const fbo = gl.createFramebuffer()
  if (!tex || !fbo) return null
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  )
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { tex, fbo, w, h }
}

function createDoubleFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  filter: number
) {
  const a = createFBO(gl, w, h, filter)
  const b = createFBO(gl, w, h, filter)
  if (!a || !b) return null
  return {
    read: a,
    write: b,
    swap() {
      const t = this.read
      this.read = this.write
      this.write = t
    },
  }
}

function buildAtlas(
  gl: WebGLRenderingContext,
  charset: string
): { tex: WebGLTexture; count: number } | null {
  const count = Math.max(charset.length, 1)
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size * count
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#fff"
  ctx.font = `700 ${Math.floor(size * 0.72)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  for (let i = 0; i < count; i++) {
    const ch = charset[i] ?? " "
    if (ch === " ") continue
    ctx.fillText(ch, size * (i + 0.5), size * 0.55)
  }

  const tex = gl.createTexture()
  if (!tex) return null
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
  return { tex, count }
}

/** Coarse pointer (phone / tablet) — no hover trail is possible there. */
function isTouchOnly() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  )
}

/**
 * Devices that cannot sustain a 20-pass fluid solve at 60fps. Mobile Safari
 * exposes no `deviceMemory`, so fall back to core count.
 */
function isLowPower() {
  if (typeof navigator === "undefined") return false
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof mem === "number" && mem <= 4) return true
  if (typeof navigator.hardwareConcurrency === "number") {
    return navigator.hardwareConcurrency <= 4
  }
  return false
}

/**
 * ASCII fluid background — pointer trails leave ink that swirls and
 * quantizes to a clean brightness-mapped glyph field. Zero deps.
 */
export function AsciiFluid({
  className,
  charset = DEFAULT_CHARSET,
  cellSize = 12,
  color,
  backgroundColor,
  force = 1,
  dissipation = 0.05,
  brush = 0.55,
  animate = true,
  interactive = true,
  disableOnTouch = true,
  theme = "auto",
}: AsciiFluidProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Both resolved on the client only, so SSR and the first paint agree.
  const [enabled, setEnabled] = useState(false)
  const [dark, setDark] = useState(false)

  const propsRef = useRef({
    charset,
    cellSize,
    color,
    backgroundColor,
    force,
    dissipation,
    brush,
    animate,
    interactive,
    theme,
  })

  useEffect(() => {
    propsRef.current = {
      charset,
      cellSize,
      color,
      backgroundColor,
      force,
      dissipation,
      brush,
      animate,
      interactive,
      theme,
    }
  })

  const mouseRef = useRef({
    x: 0.5,
    y: 0.5,
    dx: 0,
    dy: 0,
    moved: false,
    inside: false,
  })
  const reduceRef = useRef(false)
  const charsetRef = useRef("")
  const darkRef = useRef(false)

  // Track the palette off the animation loop rather than reading `classList`
  // on every single frame.
  useEffect(() => {
    const sync = () => {
      const next = resolveDark(propsRef.current.theme)
      darkRef.current = next
      setDark(next)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => {
      reduceRef.current = mq.matches
      // A flat stage is the honest reading of "reduce motion" here, and it
      // drops the entire GPU cost on devices that cannot afford it.
      setEnabled(
        !mq.matches && !(disableOnTouch && (isTouchOnly() || isLowPower()))
      )
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [disableOnTouch])

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return

    // `alpha: true` means a lost or never-initialised context shows the
    // wrapper's paper colour instead of an opaque black rectangle.
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    })
    if (!gl) return

    // Safari's watchdog kills WebGL contexts under sustained GPU load, and
    // without these handlers the canvas keeps a dead frame forever.
    let contextLost = false
    const onLost = (e: Event) => {
      e.preventDefault()
      contextLost = true
      cancelAnimationFrame(raf)
    }
    const onRestored = () => {
      contextLost = false
      // Programs and textures are gone; a remount rebuilds them cleanly.
      setEnabled(false)
      requestAnimationFrame(() => setEnabled(true))
    }
    canvas.addEventListener("webglcontextlost", onLost, false)
    canvas.addEventListener("webglcontextrestored", onRestored, false)

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    if (!vs) return

    const splat = createProgram(gl, vs, FRAG_SPLAT, [
      "u_target",
      "u_point",
      "u_color",
      "u_radius",
      "u_aspect",
      "u_velocityField",
    ])
    const advect = createProgram(gl, vs, FRAG_ADVECT, [
      "u_velocity",
      "u_source",
      "u_texel",
      "u_dt",
      "u_dissipation",
      "u_velocityField",
    ])
    const divergence = createProgram(gl, vs, FRAG_DIVERGENCE, [
      "u_velocity",
      "u_texel",
    ])
    const pressure = createProgram(gl, vs, FRAG_PRESSURE, [
      "u_pressure",
      "u_divergence",
      "u_texel",
    ])
    const gradient = createProgram(gl, vs, FRAG_GRADIENT, [
      "u_pressure",
      "u_velocity",
      "u_texel",
    ])
    const display = createProgram(gl, vs, FRAG_DISPLAY, [
      "u_dye",
      "u_atlas",
      "u_resolution",
      "u_cell",
      "u_charCount",
      "u_ink",
      "u_paper",
      "u_time",
      "u_animate",
    ])
    if (
      !splat ||
      !advect ||
      !divergence ||
      !pressure ||
      !gradient ||
      !display
    ) {
      return
    }

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const bindQuad = (p: Prog) => {
      gl.useProgram(p.program)
      gl.enableVertexAttribArray(p.posLoc)
      gl.vertexAttribPointer(p.posLoc, 2, gl.FLOAT, false, 0, 0)
    }

    // Quality budget. The solve is O(SIM² × iterations), so trimming both on a
    // weak GPU cuts the per-frame cost by roughly an order of magnitude.
    const lowPower = isLowPower()
    const SIM = lowPower ? 96 : 160
    const PRESSURE_ITER = lowPower ? 6 : 10
    const MAX_DPR = lowPower ? 1 : 1.5
    const FRAME_MS = 1000 / 40 // a background wash does not need 60fps

    const velocity = createDoubleFBO(gl, SIM, SIM, gl.LINEAR)
    const dye = createDoubleFBO(gl, SIM, SIM, gl.LINEAR)
    const pressureFbo = createDoubleFBO(gl, SIM, SIM, gl.NEAREST)
    const divergenceFbo = createFBO(gl, SIM, SIM, gl.NEAREST)
    if (!velocity || !dye || !pressureFbo || !divergenceFbo) return

    const initialAtlas = buildAtlas(gl, propsRef.current.charset)
    if (!initialAtlas) return
    let atlas = initialAtlas
    charsetRef.current = propsRef.current.charset

    const blit = (target: FBO | null) => {
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
        gl.viewport(0, 0, target.w, target.h)
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const clearFbo = (fbo: FBO, r = 0, g = 0, b = 0) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo)
      gl.viewport(0, 0, fbo.w, fbo.h)
      gl.clearColor(r, g, b, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }

    clearFbo(velocity.read, 0.5, 0.5, 0.5)
    clearFbo(velocity.write, 0.5, 0.5, 0.5)
    clearFbo(dye.read)
    clearFbo(dye.write)

    let raf = 0
    let running = true
    let visible = true
    let onScreen = true
    let last = performance.now()
    const start = last
    let lastFrame = 0
    // Frames of simulation still owed after the last pointer input. The dye
    // decays geometrically, so ~2s of solve settles it; past that the field is
    // uniform and re-solving it is wasted GPU time.
    let settleFrames = 0
    let needsDisplay = true

    let cssW = 0
    let cssH = 0
    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w <= 0 || h <= 0) return
      // Mobile Safari resizes the viewport every time the URL bar collapses
      // mid-scroll. Reallocating the drawing buffer on each of those is what
      // makes the background strobe, so ignore small height-only churn.
      if (w === cssW && Math.abs(h - cssH) < 120) return
      cssW = w
      cssH = h
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      needsDisplay = true
    }

    resize()
    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 120)
    })
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const onPointer = (e: PointerEvent) => {
      if (!propsRef.current.interactive) return
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      const m = mouseRef.current
      m.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1
      m.dx = x - m.x
      m.dy = y - m.y
      m.x = x
      m.y = y
      m.moved = true
      settleFrames = 80
      // Pointer input can arrive while the loop is parked mid-idle.
      schedule()
    }
    const onLeave = () => {
      mouseRef.current.inside = false
    }

    window.addEventListener("pointermove", onPointer, { passive: true })
    const parentEl = canvas.parentElement
    parentEl?.addEventListener("pointerleave", onLeave, { passive: true })

    // The loop parks itself whenever the tab is hidden or the background is
    // scrolled away, and both listeners below can restart it. `scheduled`
    // keeps that from ever leaving two rAF chains running at once.
    let scheduled = false
    const schedule = () => {
      if (scheduled || !running || contextLost || !visible || !onScreen) return
      scheduled = true
      raf = requestAnimationFrame(tick)
    }
    const resume = () => {
      if (!visible || !onScreen) return
      last = performance.now()
      needsDisplay = true
      schedule()
    }

    // Never burn GPU on a hidden tab. Safari throttles rAF unevenly there,
    // which surfaces as a stutter the moment you switch back.
    const onVisibility = () => {
      visible = !document.hidden
      resume()
    }
    document.addEventListener("visibilitychange", onVisibility)

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true
        resume()
      },
      { threshold: 0 }
    )
    if (parentEl) io.observe(parentEl)

    const tick = (now: number) => {
      scheduled = false
      if (!running || contextLost) return
      if (!visible || !onScreen) return // restarted by the listeners above

      schedule()

      if (now - lastFrame < FRAME_MS) return
      const dt = Math.min((now - last) / 1000, 0.033)
      last = now
      lastFrame = now
      const time = (now - start) / 1000
      const p = propsRef.current

      if (p.charset !== charsetRef.current) {
        const next = buildAtlas(gl, p.charset)
        if (next) {
          gl.deleteTexture(atlas.tex)
          atlas = next
          charsetRef.current = p.charset
          needsDisplay = true
        }
      }

      const m = mouseRef.current
      const ambient = p.animate && !reduceRef.current
      const splatting =
        p.interactive && m.moved && m.inside && !reduceRef.current
      const simulate = ambient || splatting || settleFrames > 0

      // Idle and already settled: nothing on screen can change, so skip the
      // whole 20-pass solve and the redraw.
      if (!simulate && !needsDisplay) return

      const ink = hexToRgb(p.color ?? (darkRef.current ? DARK.ink : LIGHT.ink))
      const paper = hexToRgb(
        p.backgroundColor ?? (darkRef.current ? DARK.paper : LIGHT.paper)
      )
      const texel = [1 / SIM, 1 / SIM] as const
      const aspect = canvas.width / Math.max(canvas.height, 1)
      const brushR = 0.00012 + Math.max(0.05, Math.min(1, p.brush)) * 0.0011

      if (splatting) {
        const speed = Math.hypot(m.dx, m.dy)
        const strength = p.force * (18 + speed * 120)

        // Velocity trail
        bindQuad(splat)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(splat.u.u_target, 0)
        gl.uniform2f(splat.u.u_point, m.x, m.y)
        gl.uniform3f(splat.u.u_color, m.dx * strength, m.dy * strength, 0)
        gl.uniform1f(splat.u.u_radius, brushR)
        gl.uniform1f(splat.u.u_aspect, aspect)
        gl.uniform1f(splat.u.u_velocityField, 1)
        blit(velocity.write)
        velocity.swap()

        // Dye trail — denser with speed so fast moves write brighter glyphs
        const dyeAmt = Math.min(1.4, 0.45 + speed * 8) * p.force
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, dye.read.tex)
        gl.uniform1i(splat.u.u_target, 0)
        gl.uniform2f(splat.u.u_point, m.x, m.y)
        gl.uniform3f(splat.u.u_color, dyeAmt, 0, 0)
        gl.uniform1f(splat.u.u_radius, brushR * 1.15)
        gl.uniform1f(splat.u.u_aspect, aspect)
        gl.uniform1f(splat.u.u_velocityField, 0)
        blit(dye.write)
        dye.swap()

        m.moved = false
        m.dx = 0
        m.dy = 0
      }

      // Soft ambient swirl so the field never fully dies when idle
      if (ambient && !m.inside) {
        const ax = Math.sin(time * 0.55) * 0.22
        const ay = Math.cos(time * 0.42) * 0.22
        bindQuad(splat)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(splat.u.u_target, 0)
        gl.uniform2f(
          splat.u.u_point,
          0.5 + Math.sin(time * 0.23) * 0.22,
          0.5 + Math.cos(time * 0.19) * 0.18
        )
        gl.uniform3f(splat.u.u_color, ax, ay, 0)
        gl.uniform1f(splat.u.u_radius, 0.0018)
        gl.uniform1f(splat.u.u_aspect, aspect)
        gl.uniform1f(splat.u.u_velocityField, 1)
        blit(velocity.write)
        velocity.swap()
      }

      if (simulate) {
        if (settleFrames > 0) settleFrames--

        bindQuad(advect)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(advect.u.u_velocity, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(advect.u.u_source, 1)
        gl.uniform2f(advect.u.u_texel, texel[0], texel[1])
        gl.uniform1f(advect.u.u_dt, dt)
        gl.uniform1f(
          advect.u.u_dissipation,
          1 - Math.min(0.18, p.dissipation * 2.5)
        )
        gl.uniform1f(advect.u.u_velocityField, 1)
        blit(velocity.write)
        velocity.swap()

        bindQuad(divergence)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(divergence.u.u_velocity, 0)
        gl.uniform2f(divergence.u.u_texel, texel[0], texel[1])
        blit(divergenceFbo)

        clearFbo(pressureFbo.read, 0.5, 0.5, 0.5)
        clearFbo(pressureFbo.write, 0.5, 0.5, 0.5)
        // Uniforms and the divergence binding are identical across every
        // Jacobi iteration, so set them once outside the loop.
        bindQuad(pressure)
        gl.uniform2f(pressure.u.u_texel, texel[0], texel[1])
        gl.uniform1i(pressure.u.u_pressure, 0)
        gl.uniform1i(pressure.u.u_divergence, 1)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, divergenceFbo.tex)
        for (let i = 0; i < PRESSURE_ITER; i++) {
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, pressureFbo.read.tex)
          blit(pressureFbo.write)
          pressureFbo.swap()
        }

        bindQuad(gradient)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, pressureFbo.read.tex)
        gl.uniform1i(gradient.u.u_pressure, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(gradient.u.u_velocity, 1)
        gl.uniform2f(gradient.u.u_texel, texel[0], texel[1])
        blit(velocity.write)
        velocity.swap()

        bindQuad(advect)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex)
        gl.uniform1i(advect.u.u_velocity, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, dye.read.tex)
        gl.uniform1i(advect.u.u_source, 1)
        gl.uniform2f(advect.u.u_texel, texel[0], texel[1])
        gl.uniform1f(advect.u.u_dt, dt)
        gl.uniform1f(
          advect.u.u_dissipation,
          1 - Math.min(0.22, Math.max(0.02, p.dissipation))
        )
        gl.uniform1f(advect.u.u_velocityField, 0)
        blit(dye.write)
        dye.swap()
      }

      bindQuad(display)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex)
      gl.uniform1i(display.u.u_dye, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, atlas.tex)
      gl.uniform1i(display.u.u_atlas, 1)
      gl.uniform2f(display.u.u_resolution, canvas.width, canvas.height)
      const cell =
        Math.max(7, p.cellSize) *
        Math.min(window.devicePixelRatio || 1, MAX_DPR)
      gl.uniform2f(display.u.u_cell, cell, cell)
      gl.uniform1f(display.u.u_charCount, atlas.count)
      gl.uniform3f(display.u.u_ink, ink[0], ink[1], ink[2])
      gl.uniform3f(display.u.u_paper, paper[0], paper[1], paper[2])
      gl.uniform1f(display.u.u_time, time)
      gl.uniform1f(display.u.u_animate, ambient ? 1 : 0)
      blit(null)
      needsDisplay = false
    }

    schedule()

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pointermove", onPointer)
      parentEl?.removeEventListener("pointerleave", onLeave)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      if (contextLost) return
      for (const prog of [
        splat,
        advect,
        divergence,
        pressure,
        gradient,
        display,
      ]) {
        gl.deleteProgram(prog.program)
        gl.deleteShader(prog.fs)
      }
      gl.deleteShader(vs)
      gl.deleteBuffer(buf)
      gl.deleteTexture(atlas.tex)
      for (const f of [
        velocity.read,
        velocity.write,
        dye.read,
        dye.write,
        pressureFbo.read,
        pressureFbo.write,
        divergenceFbo,
      ]) {
        gl.deleteTexture(f.tex)
        gl.deleteFramebuffer(f.fbo)
      }
      // Release the context now rather than waiting for GC — Safari caps how
      // many live WebGL contexts a page may hold, and this page has several.
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [enabled])

  return (
    <div
      data-slot="ascii-fluid"
      aria-hidden
      // The stage colour lives on the wrapper, so the page reads correctly
      // before WebGL starts, if it never starts, and if the context is lost.
      style={{
        backgroundColor:
          backgroundColor ?? (dark ? DARK.paper : LIGHT.paper),
      }}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {enabled ? (
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      ) : null}
    </div>
  )
}
