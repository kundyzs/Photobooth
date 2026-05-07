"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Video, VideoOff } from "lucide-react"
import { type FilterType, type FilmSliders, applyFilter } from "@/lib/filters"

interface CameraViewProps {
  selectedFilter: FilterType
  filmSliders: FilmSliders
  onPhotoCapture: (dataUrl: string) => void
  isRecording: boolean
  onRecordingChange: (recording: boolean) => void
}

export function CameraView({ selectedFilter, filmSliders, onPhotoCapture, isRecording, onRecordingChange }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const isCapturingRef = useRef(false)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [mirror, setMirror] = useState(true)
  const [videoDims, setVideoDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  useEffect(() => {
    startCamera()
    listDevices()

    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      } catch (e) {
        console.warn("Error stopping stream on unmount", e)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const listDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = list.filter((d) => d.kind === "videoinput")
      setDevices(videoInputs)
      if (videoInputs.length > 0 && !selectedDeviceId) setSelectedDeviceId(videoInputs[0].deviceId)
    } catch (err) {
      console.warn("Could not list devices", err)
    }
  }

  const startCamera = async (deviceId?: string | null) => {
    setLastError(null)
    setVideoReady(false)
    setVideoDims({ w: 0, h: 0 })
    try {
      // stop any existing stream first to avoid multiple active streams
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      } catch (e) {
        console.warn("Error stopping previous stream", e)
      }

      const waitForVideoFrames = async (videoEl: HTMLVideoElement, timeoutMs = 3000) => {
        const start = Date.now()
        return await new Promise<boolean>((resolve) => {
          const tick = () => {
            const w = videoEl.videoWidth || 0
            const h = videoEl.videoHeight || 0
            if (w > 0 && h > 0) return resolve(true)
            if (Date.now() - start > timeoutMs) return resolve(false)
            setTimeout(tick, 100)
          }
          tick()
        })
      }

      const makeConstraints = (mode: "preferred" | "fallback1" | "fallback2"): MediaStreamConstraints => {
        if (mode === "preferred") {
          return {
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
            audio: false,
          }
        }
        if (mode === "fallback1") {
          // remove facingMode (some Windows camera drivers choke on it)
          return { video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false }
        }
        // most permissive
        return { video: true, audio: false }
      }

      let mediaStream: MediaStream
      const attemptModes: Array<"preferred" | "fallback1" | "fallback2"> = ["preferred", "fallback1", "fallback2"]
      let lastAttemptError: any = null

      for (const mode of attemptModes) {
        try {
          const constraints = makeConstraints(mode)
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          // assign stream immediately so track state can be inspected while we wait
          setStream(mediaStream)
          streamRef.current = mediaStream
          setHasPermission(true)

          const videoEl = videoRef.current
          if (!videoEl) throw new Error("Video element not available")

          videoEl.srcObject = mediaStream
          videoEl.muted = true

          const p = videoEl.play()
          if (p && typeof (p as any).then === "function") await p.catch(() => {})

          // wait for real frames/dimensions; some devices report an active stream but never deliver frames
          const ok = await waitForVideoFrames(videoEl, 3500)
          if (ok) {
            setVideoReady(true)
            setVideoDims({ w: videoEl.videoWidth || 0, h: videoEl.videoHeight || 0 })
            lastAttemptError = null
            break
          }

          // no frames: stop and retry with different constraints
          mediaStream.getTracks().forEach((t) => t.stop())
          if (streamRef.current === mediaStream) streamRef.current = null
          setStream(null)
          setVideoReady(false)
          lastAttemptError = new Error("Camera stream started but no frames were received.")
        } catch (err: any) {
          lastAttemptError = err
        }
      }

      if (lastAttemptError) {
        throw lastAttemptError
      }

      // refresh device list (labels may be available now)
      listDevices()
    } catch (error: any) {
      console.error("[v0] Error accessing camera:", error)
      setHasPermission(false)
      const name = error?.name ? String(error.name) : ""
      const msg = error?.message ? String(error.message) : String(error)
      if (name === "NotReadableError" || /device.*in use/i.test(msg)) {
        setLastError("Camera is in use by another app. Close other apps (Zoom/Teams/Camera) and reload.")
      } else if (/no frames/i.test(msg)) {
        setLastError("Camera opened but no video frames arrived. Try restarting Chrome or rebooting the laptop.")
      } else {
        setLastError(msg)
      }
    }
  }

  const startCountdown = () => {
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval)
          setTimeout(() => {
            capturePhoto()
            setCountdown(null)
          }, 1000)
          return 0
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    if (isCapturingRef.current) return
    isCapturingRef.current = true
    setTimeout(() => (isCapturingRef.current = false), 500)

    const video = videoRef.current
    const canvas = canvasRef.current

    // If video dimensions are not ready, wait briefly for loadedmetadata
    const waitForMetadata = (timeout = 1000) =>
      new Promise<boolean>((resolve) => {
        if (video.videoWidth > 0 && video.videoHeight > 0) return resolve(true)
        const onLoaded = () => {
          resolve(true)
          video.removeEventListener("loadedmetadata", onLoaded)
        }
        video.addEventListener("loadedmetadata", onLoaded)
        setTimeout(() => {
          video.removeEventListener("loadedmetadata", onLoaded)
          resolve(false)
        }, timeout)
      })

    const ready = await waitForMetadata(3000)
    if (!ready) {
      console.warn("Video metadata not ready (width/height = 0), aborting capture")
      isCapturingRef.current = false
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

      // applyFilter now supports film preset + sliders + mirror flag
    let dataUrl = ""

    if (video.videoWidth > 0 && video.videoHeight > 0) {
        dataUrl = applyFilter(video, selectedFilter, filmSliders, canvas.width, canvas.height, mirror)
    }

    // If video element has no dimensions, try ImageCapture.grabFrame() fallback
    if (!dataUrl) {
      try {
        const track = streamRef.current?.getVideoTracks()[0]
        if (track && (window as any).ImageCapture) {
          try {
            const ImageCaptureCtor = (window as any).ImageCapture
            const ic = new ImageCaptureCtor(track)
            const bitmap = await ic.grabFrame()
            // draw bitmap to canvas
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
              if (mirror) {
                ctx.save()
                ctx.translate(canvas.width, 0)
                ctx.scale(-1, 1)
                ctx.drawImage(bitmap, 0, 0)
                ctx.restore()
              } else {
                ctx.drawImage(bitmap, 0, 0)
              }
              dataUrl = canvas.toDataURL("image/png")
            }
            // close bitmap if possible
            if (bitmap.close) bitmap.close()
          } catch (icErr) {
            console.warn("ImageCapture grabFrame failed:", icErr)
          }
        }

        // Final fallback: attempt to draw video element directly even if size is zero
        if (!dataUrl) {
          const ctx = canvas.getContext("2d")
          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            if (mirror) {
              ctx.save()
              ctx.translate(canvas.width, 0)
              ctx.scale(-1, 1)
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              ctx.restore()
            } else {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            }
            dataUrl = canvas.toDataURL("image/png")
          }
        }
      } catch (err) {
        console.warn("Fallback capture failed:", err)
      }
    }

    console.debug("Captured photo", { id: Date.now(), width: canvas.width, height: canvas.height, dataUrlPresent: !!dataUrl })
    if (dataUrl) onPhotoCapture(dataUrl)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = () => {
    if (!stream) return

    recordedChunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `photobooth-session-${Date.now()}.webm`
      link.click()
      URL.revokeObjectURL(url)
    }

    mediaRecorder.start()
    mediaRecorderRef.current = mediaRecorder
    onRecordingChange(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      onRecordingChange(false)
    }
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-2xl">
        <div className="text-center p-8">
          <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-sm text-muted-foreground mb-4">Please allow camera access to use the photobooth</p>
          <div className="flex flex-col items-center gap-3">
            <div>
              <select
                value={selectedDeviceId ?? ""}
                onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                className="px-3 py-2 rounded-md border"
              >
                <option value="">Default camera</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition-transform duration-200"
              >
                Enable Camera
              </button>
            </div>
            {lastError && <p className="text-xs text-destructive mt-2">{lastError}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full rounded-2xl overflow-hidden bg-black">
      {/* Diagnostics overlay (hidden by default via opacity) */}
      <div className="absolute top-4 right-4 bg-background/70 text-xs p-2 rounded-md opacity-90 z-20">
        <div>video: {videoDims.w}x{videoDims.h}</div>
        <div>stream: {streamRef.current ? "active" : "none"}</div>
        <div>device: {selectedDeviceId ?? "default"}</div>
        {lastError && <div className="text-destructive">err: {lastError}</div>}
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-9xl font-black text-white animate-pulse">{countdown === 0 ? "📸" : countdown}</div>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full" />
          <span className="font-semibold text-sm">Recording</span>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={toggleRecording}
          className={`p-4 rounded-full font-medium transition-all duration-200 hover:scale-110 ${
            isRecording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMirror((m) => !m)}
            className={`p-3 rounded-md border ${mirror ? "bg-primary text-primary-foreground" : "bg-background"}`}
            aria-label="Toggle mirror"
            title={mirror ? "Mirrored" : "Normal"}
          >
            {mirror ? "Mirrored" : "Normal"}
          </button>

          <button
            onClick={startCountdown}
            disabled={countdown !== null}
            className="p-6 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Take photo"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  )
}
