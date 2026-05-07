"use client"

import { useRef } from "react"

interface Photo {
  id: string
  dataUrl: string
  timestamp: number
}

interface PhotoStripProps {
  photos: Photo[]
  onDownload: () => void
  variant?: "ui" | "export"
}

export function PhotoStrip({ photos, onDownload, variant = "ui" }: PhotoStripProps) {
  const stripRef = useRef<HTMLDivElement>(null)

  // html2canvas doesn't support some modern CSS color functions (like oklch()).
  // For exporting, we use inline hex colors only.
  const exportStyles =
    variant === "export"
      ? ({
          wrapper: {
            backgroundColor: "#f7f2e7",
            color: "#231f1a",
            border: "1px solid #d8cfbf",
            borderRadius: "6px",
            padding: "16px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
          } as React.CSSProperties,
          frame: {
            border: "1px solid rgba(0,0,0,0.18)",
            borderRadius: "4px",
            backgroundColor: "#000000",
            overflow: "hidden",
            aspectRatio: "3 / 4",
          } as React.CSSProperties,
          footer: {
            marginTop: "12px",
            paddingTop: "8px",
            borderTop: "1px dashed rgba(0,0,0,0.25)",
            textAlign: "center",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.8,
          } as React.CSSProperties,
          date: {
            fontSize: "10px",
            letterSpacing: "normal",
            textTransform: "none",
            opacity: 0.7,
            marginTop: "4px",
          } as React.CSSProperties,
          stack: { display: "flex", flexDirection: "column", gap: "12px" } as React.CSSProperties,
        })
      : null

  return (
    <div className="flex items-center justify-center">
      <div
        ref={stripRef}
        className={
          variant === "ui"
            ? "relative bg-[oklch(0.95_0.02_85)] text-[oklch(0.16_0.02_85)] rounded-md px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] border border-[oklch(0.82_0.02_85)]"
            : undefined
        }
        style={variant === "export" ? exportStyles!.wrapper : undefined}
      >
        {/* Paper strip body */}
        <div className={variant === "ui" ? "flex flex-col gap-3" : undefined} style={variant === "export" ? exportStyles!.stack : undefined}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={variant === "ui" ? "relative overflow-hidden rounded-sm border border-black/20 bg-black aspect-[3/4]" : undefined}
              style={variant === "export" ? exportStyles!.frame : undefined}
            >
              <img
                src={photo.dataUrl || "/placeholder.svg"}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div
          className={variant === "ui" ? "mt-3 pt-2 border-t border-dashed border-black/25 text-center" : undefined}
          style={variant === "export" ? exportStyles!.footer : undefined}
        >
          <div className={variant === "ui" ? "text-[10px] tracking-[0.18em] uppercase opacity-80" : undefined}>photobooth</div>
          <div className={variant === "ui" ? "text-[10px] opacity-70" : undefined} style={variant === "export" ? exportStyles!.date : undefined}>
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
