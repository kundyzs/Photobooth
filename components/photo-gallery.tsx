"use client"

import { Download, Trash2 } from "lucide-react"
import Image from "next/image"

interface Photo {
  id: string
  dataUrl: string
  timestamp: number
}

interface PhotoGalleryProps {
  photos: Photo[]
  onDeletePhoto: (id: string) => void
}

export function PhotoGallery({ photos, onDeletePhoto }: PhotoGalleryProps) {
  const downloadPhoto = (dataUrl: string, id: string) => {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `photobooth-${id}.png`
    link.click()
  }

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-center p-6">
        <p className="text-sm">Your photos will appear here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 overflow-y-auto h-full">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative group rounded-lg overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <div className="relative aspect-square">
            {photo.dataUrl && photo.dataUrl.startsWith("data:") ? (
              // data URLs work best with a native img element
              // fill the container using absolute positioning
              <img src={photo.dataUrl} alt={`Photo ${photo.id}`} className="w-full h-full object-cover" />
            ) : (
              <Image src={photo.dataUrl || "/placeholder.svg"} alt={`Photo ${photo.id}`} fill className="object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <button
              onClick={() => downloadPhoto(photo.dataUrl, photo.id)}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:scale-110 transition-transform duration-200"
              aria-label="Download photo"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                // Remove from sessionStorage and call parent handler
                try {
                  const stored = sessionStorage.getItem("photobooth-photos")
                  if (stored) {
                    const arr = JSON.parse(stored)
                    const filtered = arr.filter((p: any) => p.id !== photo.id)
                    sessionStorage.setItem("photobooth-photos", JSON.stringify(filtered))
                  }
                } catch (err) {
                  /* ignore */
                }
                onDeletePhoto(photo.id)
              }}
              className="p-3 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform duration-200"
              aria-label="Delete photo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
