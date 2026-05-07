"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Download, RotateCcw, Camera } from "lucide-react"
import { PhotoStrip } from "@/components/photo-strip"

interface Photo {
  id: string
  dataUrl: string
  timestamp: number
}

export default function ResultsPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [showStrip, setShowStrip] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // read photos captured in this session from sessionStorage
    try {
      const stored = sessionStorage.getItem("photobooth-photos")
      if (!stored) {
        router.push("/")
        return
      }
      const parsed = JSON.parse(stored)
      // dedupe by id, keep first occurrence
      const seen = new Set<string>()
      const deduped = parsed.filter((p: any) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      setPhotos(deduped)
      setTimeout(() => setShowStrip(true), 300)
    } catch (err) {
      console.error(err)
      router.push("/")
    }
  }, [router])

  const waitForImages = async (root: HTMLElement, timeoutMs = 4000) => {
    const imgs = Array.from(root.querySelectorAll("img"))
    if (imgs.length === 0) return

    const start = Date.now()
    await Promise.race([
      Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve()
              const cleanup = () => {
                img.removeEventListener("load", onDone)
                img.removeEventListener("error", onDone)
              }
              const onDone = () => {
                cleanup()
                resolve()
              }
              img.addEventListener("load", onDone, { once: true })
              img.addEventListener("error", onDone, { once: true })
            }),
        ),
      ),
      new Promise<void>((resolve) => {
        const tick = () => {
          if (Date.now() - start > timeoutMs) return resolve()
          setTimeout(tick, 50)
        }
        tick()
      }),
    ])
  }

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })

  const drawCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => {
    const sw = img.naturalWidth || img.width
    const sh = img.naturalHeight || img.height
    if (sw <= 0 || sh <= 0) return

    const sAspect = sw / sh
    const dAspect = dw / dh

    let sx = 0
    let sy = 0
    let sCropW = sw
    let sCropH = sh

    if (sAspect > dAspect) {
      // source too wide -> crop sides
      sCropW = Math.round(sh * dAspect)
      sx = Math.round((sw - sCropW) / 2)
    } else {
      // source too tall -> crop top/bottom
      sCropH = Math.round(sw / dAspect)
      sy = Math.round((sh - sCropH) / 2)
    }

    ctx.drawImage(img, sx, sy, sCropW, sCropH, dx, dy, dw, dh)
  }

  const downloadPhotoStrip = async () => {
    try {
      // Reliable export: draw strip directly to a canvas (no DOM/CSS parsing)
      const ordered = [...photos].slice(0, 4).reverse() // original capture order (oldest -> newest)
      const imgs = await Promise.all(ordered.map((p) => loadImage(p.dataUrl)))

      // Layout (paper strip)
      const paperW = 900
      const marginX = 50
      const marginTop = 44
      const gap = 28
      const footerH = 86
      const frameW = paperW - marginX * 2
      const frameH = Math.round(frameW * (4 / 3)) // 3:4 frame
      const paperH = marginTop + imgs.length * frameH + (imgs.length - 1) * gap + footerH + 28

      const canvas = document.createElement("canvas")
      canvas.width = paperW
      canvas.height = paperH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not create canvas context")

      // Paper background
      ctx.fillStyle = "#f7f2e7"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Slight paper border
      ctx.strokeStyle = "#d8cfbf"
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

      // Frames
      let y = marginTop
      for (let i = 0; i < imgs.length; i++) {
        // frame border
        ctx.fillStyle = "#000000"
        ctx.fillRect(marginX, y, frameW, frameH)
        ctx.strokeStyle = "rgba(0,0,0,0.18)"
        ctx.lineWidth = 2
        ctx.strokeRect(marginX + 1, y + 1, frameW - 2, frameH - 2)

        drawCover(ctx, imgs[i], marginX, y, frameW, frameH)
        y += frameH + gap
      }

      // Footer dashed line
      const dashY = canvas.height - footerH
      ctx.strokeStyle = "rgba(0,0,0,0.25)"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(marginX, dashY)
      ctx.lineTo(canvas.width - marginX, dashY)
      ctx.stroke()
      ctx.setLineDash([])

      // Footer text
      ctx.fillStyle = "rgba(0,0,0,0.78)"
      ctx.textAlign = "center"
      ctx.font = "700 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      ctx.fillText("PHOTOBOOTH", canvas.width / 2, dashY + 34)
      ctx.fillStyle = "rgba(0,0,0,0.6)"
      ctx.font = "500 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, dashY + 60)

      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `photobooth-strip-${Date.now()}.png`
      link.click()
    } catch (error) {
      console.error("Error downloading photo strip:", error)
      // Fallback: download photos individually
      photos.forEach((photo, index) => {
        setTimeout(() => {
          const link = document.createElement("a")
          link.href = photo.dataUrl
          link.download = `photobooth-${index + 1}.png`
          link.click()
        }, index * 200)
      })
    }
  }

  const startOver = () => {
    // clear the session photos so user returns to fresh camera
    try {
      sessionStorage.removeItem("photobooth-photos")
    } catch (err) {
      /* ignore */
    }
    router.push("/")
  }

  return (
    <div className="pb-shell flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] gap-6 items-start">
          {/* Left plaque */}
          <div className="pb-panel">
            <div className="pb-panel-inner">
              <div className="inline-flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-foreground" />
                <div className="text-xs font-black tracking-[0.22em] uppercase">Photobooth</div>
              </div>

              <div className="rounded-md border border-border bg-[color-mix(in_oklab,var(--muted)_80%,white_20%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                <div className="text-sm font-black tracking-[0.18em] uppercase opacity-90">Photos delivered</div>
                <div className="text-sm font-black tracking-[0.18em] uppercase opacity-90">here in</div>
                <div className="text-4xl font-black tracking-tight mt-2">2½</div>
                <div className="text-sm font-black tracking-[0.18em] uppercase -mt-1 opacity-90">minutes</div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Your strip prints from the slot on the right. Download is available once it finishes “printing”.
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button onClick={downloadPhotoStrip} className="pb-button w-full sm:w-auto" disabled={!showStrip}>
                  <Download className="w-5 h-5" />
                  Download
                </button>
                <button onClick={startOver} className="pb-button pb-button-secondary w-full sm:w-auto">
                  <RotateCcw className="w-5 h-5" />
                  Start Over
                </button>
              </div>
            </div>
          </div>

          {/* Right slot + strip */}
          <div className="pb-panel overflow-hidden">
            <div className="pb-panel-inner">
              <div className="pb-slot-frame">
                <div className="pb-slot-top" />
                <div className="pb-slot-window" aria-label="Photo slot window">
                  <div
                    className={`pb-strip-motion ${showStrip ? "is-printing" : ""}`}
                    style={{ "--printDelay": "220ms" } as any}
                  >
                    <div ref={stripRef}>
                      <PhotoStrip photos={photos} onDownload={downloadPhotoStrip} />
                    </div>
                  </div>
                </div>
                <div className="pb-slot-bottom" />
              </div>

              <div className="mt-4 text-center text-[11px] text-muted-foreground">
                If you’re on mobile, scroll a little to see the full strip.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden export target: full strip, not clipped by the slot */}
      <div
        aria-hidden="true"
        className="fixed left-0 top-0 opacity-0 pointer-events-none"
        style={{ width: 420, padding: 16, zIndex: -1 }}
      >
        <div ref={exportRef}>
          <PhotoStrip photos={photos} onDownload={downloadPhotoStrip} variant="export" />
        </div>
      </div>

      <style jsx>{`
        /* “Wood panel” booth vibe (no external assets) */
        :global(body) {
          background-image: radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.25), transparent 45%),
            radial-gradient(circle at 80% 25%, rgba(255, 255, 255, 0.18), transparent 50%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.02)),
            repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.045) 0px, rgba(0, 0, 0, 0.045) 1px, transparent 1px, transparent 7px);
        }

        .pb-slot-frame {
          border-radius: 14px;
          border: 1px solid color-mix(in oklab, black 18%, var(--border));
          background: linear-gradient(180deg, color-mix(in oklab, var(--muted) 55%, black 10%), var(--card));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
          overflow: hidden;
        }

        .pb-slot-top {
          height: 18px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0));
        }

        .pb-slot-bottom {
          height: 18px;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0));
        }

        .pb-slot-window {
          height: 560px;
          background: rgba(0, 0, 0, 0.38);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          border-bottom: 1px solid rgba(0, 0, 0, 0.25);
          overflow: hidden;
          position: relative;
        }

        /* Strip motion: starts hidden above, prints down into view */
        .pb-strip-motion {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -110%);
          will-change: transform;
        }

        .pb-strip-motion.is-printing {
          animation: printDown 2.4s cubic-bezier(0.16, 0.9, 0.18, 1) var(--printDelay, 0ms) forwards;
        }

        @keyframes printDown {
          0% {
            transform: translate(-50%, -110%);
          }
          72% {
            transform: translate(-50%, -8%);
          }
          84% {
            transform: translate(-50%, -12%);
          }
          100% {
            transform: translate(-50%, 0%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pb-strip-motion,
          .pb-strip-motion.is-printing {
            animation: none !important;
            transform: translate(-50%, 0%) !important;
          }
        }
      `}</style>
    </div>
  )
}
