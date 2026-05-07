"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CameraView } from "@/components/camera-view"
import { PhotoGallery } from "@/components/photo-gallery"
import { FilterSelector } from "@/components/filter-selector"
import { type FilterType, type FilmSliders, presetSliders } from "@/lib/filters"
import { Camera } from "lucide-react"

interface Photo {
  id: string
  dataUrl: string
  timestamp: number
}

export default function PhotoboothApp() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("none")
  const [filmSliders, setFilmSliders] = useState<FilmSliders>(() => presetSliders("softFilm"))
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    // Persist only in session storage so nothing is written to disk.
    try {
      sessionStorage.setItem("photobooth-photos", JSON.stringify(photos))
    } catch (err) {
      /* ignore */
    }
    if (photos.length === 4) {
      router.push("/results")
    }
  }, [photos, router])

  const handlePhotoCapture = (dataUrl: string) => {
    if (photos.length >= 4) return

    const newPhoto: Photo = {
      id: `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
      dataUrl,
      timestamp: Date.now(),
    }
    setPhotos((prev) => [newPhoto, ...prev])
  }

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
  }

  return (
    <div className="pb-shell">
      <div className="max-w-6xl mx-auto">
        <div className="pb-header">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Camera className="w-7 h-7 text-foreground" />
            <h1 className="pb-title">Photobooth</h1>
          </div>
          <p className="pb-subtitle">
            Take {4 - photos.length} more {4 - photos.length === 1 ? "photo" : "photos"} to complete your strip
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 pb-panel">
            <div className="pb-panel-inner">
            {/* Bigger preview on phones: square; widescreen on md+ */}
            <div className="aspect-square md:aspect-video mb-6">
              <CameraView
                selectedFilter={selectedFilter}
                filmSliders={filmSliders}
                onPhotoCapture={handlePhotoCapture}
                isRecording={isRecording}
                onRecordingChange={setIsRecording}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black tracking-wide uppercase text-foreground">Film look</h2>
                <div className="flex items-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < photos.length
                          ? "bg-foreground scale-110"
                          : "bg-muted border border-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <FilterSelector
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                sliders={filmSliders}
                onSlidersChange={setFilmSliders}
              />
            </div>
            </div>
          </div>

          <div className="pb-panel overflow-hidden">
            <div className="pb-panel-inner border-b border-border">
              <h2 className="font-black text-center uppercase tracking-wide text-foreground">Frames</h2>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {photos.length} of 4 {photos.length === 1 ? "photo" : "photos"}
              </p>
            </div>
            <div className="h-[600px] overflow-hidden">
              <PhotoGallery photos={photos} onDeletePhoto={handleDeletePhoto} />
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-muted-foreground">
            Tip: keep it subtle — intensity ~70–85%, grain ~10–35%, flash only if you want that mall-booth pop.
          </p>
        </div>
      </div>
    </div>
  )
}
