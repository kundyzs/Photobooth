export type FilterType = "none" | "softFilm" | "flashVintage" | "disposableCamera"

export interface Filter {
  id: FilterType
  name: string
}

export type FilmSliders = {
  /**
   * Master intensity (0..1). This is a mixing knob between original and processed.
   */
  intensity: number
  /**
   * Film grain amount (0..1). Procedural and subtle by design.
   */
  grain: number
  /**
   * Lift blacks / faded shadows (0..1).
   */
  fade: number
  /**
   * Warmth / creamy whites (0..1).
   */
  warmth: number
  /**
   * Softness / slight motion softness (0..1). Keeps detail (not heavy blur).
   */
  softness: number
  /**
   * Channel inconsistency / slight chroma mismatch (0..1).
   */
  chroma: number
  /**
   * Flash feel (0..1). Brighter highs, slightly desaturated mids.
   */
  flash: number
}

export const defaultFilmSliders: FilmSliders = {
  intensity: 0.75,
  grain: 0.25,
  fade: 0.35,
  warmth: 0.35,
  softness: 0.18,
  chroma: 0.18,
  flash: 0.0,
}

export const filters: Filter[] = [
  { id: "none", name: "Original" },
  { id: "softFilm", name: "Soft Film" },
  { id: "flashVintage", name: "Flash Vintage" },
  { id: "disposableCamera", name: "Disposable Camera" },
]

export function presetSliders(preset: FilterType): FilmSliders {
  if (preset === "softFilm") {
    return {
      intensity: 0.75,
      grain: 0.25,
      fade: 0.35,
      warmth: 0.35,
      softness: 0.18,
      chroma: 0.18,
      flash: 0.05,
    }
  }
  if (preset === "flashVintage") {
    return {
      intensity: 0.82,
      grain: 0.22,
      fade: 0.28,
      warmth: 0.42,
      softness: 0.14,
      chroma: 0.14,
      flash: 0.55,
    }
  }
  if (preset === "disposableCamera") {
    return {
      intensity: 0.8,
      grain: 0.38,
      fade: 0.4,
      warmth: 0.32,
      softness: 0.22,
      chroma: 0.28,
      flash: 0.18,
    }
  }
  return { ...defaultFilmSliders, intensity: 0 }
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function rand2(x: number, y: number, seed: number) {
  // Fast deterministic hash noise in [0,1)
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453123
  return s - Math.floor(s)
}

function applyFilmPipeline(ctx: CanvasRenderingContext2D, w: number, h: number, sliders: FilmSliders, seed: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data

  const intensity = clamp01(sliders.intensity)
  if (intensity <= 0) return

  const grain = clamp01(sliders.grain)
  const fade = clamp01(sliders.fade)
  const warmth = clamp01(sliders.warmth)
  const softness = clamp01(sliders.softness)
  const chroma = clamp01(sliders.chroma)
  const flash = clamp01(sliders.flash)

  // Global tonal shaping tuned for “early 2000s photobooth / compact flash”.
  // - soft contrast
  // - slightly lifted blacks
  // - creamy whites
  const gamma = lerp(1.03, 0.97, flash) // flash: slightly brighter mids
  const contrast = lerp(0.96, 1.02, flash) // keep soft; avoid HDR look
  const lift = lerp(0.035, 0.02, flash) + fade * 0.06
  const highlightRoll = 0.12 + flash * 0.08 // compress highlights

  // Slight channel curve differences (subtle)
  const rBias = warmth * 0.035
  const bBias = -warmth * 0.02
  const gBias = warmth * 0.01

  // Reduce digital “sharpness” feel by blending a tiny blur later (not per-pixel).
  // Here we only do pixel-domain adjustments + grain.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const or = d[i] / 255
      const og = d[i + 1] / 255
      const ob = d[i + 2] / 255

      // Optional tiny chroma mismatch by sampling neighboring pixel for one channel (very subtle).
      const shift = chroma * 1.2 // in pixels (fractional-ish)
      const sx = shift > 0 ? Math.min(w - 1, x + 1) : x
      const si = (y * w + sx) * 4
      const rb = d[si] / 255
      const bb = d[i + 2] / 255
      const r0 = lerp(or, rb, chroma * 0.22)
      const b0 = lerp(ob, bb, chroma * 0.18)
      const g0 = og

      // Soft contrast around mid-gray and lifted blacks
      const tone = (c: number) => {
        // lift blacks (fade)
        let v = c * (1 - lift) + lift
        // gamma shaping
        v = Math.pow(clamp01(v), gamma)
        // soft contrast (S-curve-ish)
        v = (v - 0.5) * contrast + 0.5
        // highlight rolloff to avoid “digital clipping”
        const roll = highlightRoll
        if (v > 1 - roll) {
          const t = (v - (1 - roll)) / roll
          v = (1 - roll) + roll * (1 - Math.pow(1 - clamp01(t), 1.6))
        }
        return clamp01(v)
      }

      let r = tone(r0)
      let g = tone(g0)
      let b = tone(b0)

      // “Creamy whites” + slight warmth without orange/teal grading.
      // Warm highlights a little more than shadows.
      const lum = clamp01(0.2126 * r + 0.7152 * g + 0.0722 * b)
      const hi = Math.pow(lum, 1.6)
      r = clamp01(r + rBias * (0.4 + 0.6 * hi))
      g = clamp01(g + gBias * (0.35 + 0.65 * hi))
      b = clamp01(b + bBias * (0.2 + 0.8 * hi))

      // Subtle desaturation (keep skin natural)
      const sat = lerp(0.98, 0.93, intensity) * lerp(1, 0.92, flash)
      const avg = (r + g + b) / 3
      r = clamp01(lerp(avg, r, sat))
      g = clamp01(lerp(avg, g, sat))
      b = clamp01(lerp(avg, b, sat))

      // Procedural fine grain: mostly luma, tiny chroma noise.
      if (grain > 0) {
        const n = rand2(x, y, seed)
        const n2 = rand2(x + 17.13, y - 3.7, seed + 11.1)
        const lumaNoise = (n - 0.5) * 0.08 * grain
        const chromaNoise = (n2 - 0.5) * 0.03 * grain
        r = clamp01(r + lumaNoise + chromaNoise * 0.6)
        g = clamp01(g + lumaNoise)
        b = clamp01(b + lumaNoise - chromaNoise * 0.6)
      }

      // Mix with original to keep it subtle and preserve detail.
      const fr = clamp01(lerp(or, r, intensity))
      const fg = clamp01(lerp(og, g, intensity))
      const fb = clamp01(lerp(ob, b, intensity))

      d[i] = Math.round(fr * 255)
      d[i + 1] = Math.round(fg * 255)
      d[i + 2] = Math.round(fb * 255)
    }
  }

  ctx.putImageData(img, 0, 0)

  // Tiny “softness / motion softness” pass: blur then blend back to avoid losing detail.
  if (softness > 0) {
    const blurPx = lerp(0, 0.9, softness)
    const off = document.createElement("canvas")
    off.width = w
    off.height = h
    const octx = off.getContext("2d")
    if (octx) {
      // copy current
      octx.drawImage(ctx.canvas, 0, 0)
      ctx.save()
      ;(ctx as any).filter = `blur(${blurPx}px)`
      ctx.globalAlpha = lerp(0.0, 0.28, softness)
      ctx.drawImage(off, 0, 0)
      ctx.restore()
    }
  }

  // Subtle flash “bloom” (no vignette, no dust): a soft screen blend in highlights.
  if (flash > 0) {
    const off = document.createElement("canvas")
    off.width = w
    off.height = h
    const octx = off.getContext("2d")
    if (octx) {
      octx.drawImage(ctx.canvas, 0, 0)
      ctx.save()
      ;(ctx as any).filter = `blur(${lerp(0.6, 1.6, flash)}px)`
      ctx.globalCompositeOperation = "screen"
      ctx.globalAlpha = lerp(0.0, 0.12, flash)
      ctx.drawImage(off, 0, 0)
      ctx.restore()
    }
  }
}

export function applyFilter(
  videoElement: HTMLVideoElement,
  filterType: FilterType,
  sliders: FilmSliders | null,
  width: number,
  height: number,
  mirror: boolean = false,
): string {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) return ""

  if (width === 0 || height === 0) {
    // nothing to draw
    console.warn("applyFilter called with zero width/height", { width, height })
    return ""
  }

  if (mirror) {
    // flip horizontally
    ctx.save()
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoElement, 0, 0, width, height)
    ctx.restore()
  } else {
    ctx.drawImage(videoElement, 0, 0, width, height)
  }

  if (filterType !== "none") {
    const seed = Date.now() % 1000000
    const effective = sliders ?? presetSliders(filterType)
    applyFilmPipeline(ctx, width, height, effective, seed)
  }

  return canvas.toDataURL("image/png")
}
