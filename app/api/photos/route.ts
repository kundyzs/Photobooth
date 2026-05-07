import { NextResponse } from "next/server"

// This API is intentionally a harmless stub for now. It does not write files
// or persist image data to disk. The frontend uses sessionStorage for temporary
// photo transfer between pages (so nothing is saved server-side).

let inMemoryPhotos: Array<any> = []

export async function GET() {
  // Return whatever is in-memory (usually empty). Not persistent.
  return NextResponse.json(inMemoryPhotos)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // don't persist image data to disk; optionally keep small metadata in memory
    const { id, timestamp } = body || {}
    const item = { id, timestamp: timestamp || Date.now() }
    inMemoryPhotos.unshift(item)
    // cap size to avoid memory bloat in dev
    if (inMemoryPhotos.length > 50) inMemoryPhotos = inMemoryPhotos.slice(0, 50)
    return NextResponse.json(item)
  } catch (err) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: "Server error" }), { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return new NextResponse(JSON.stringify({ error: "Missing id" }), { status: 400 })
    inMemoryPhotos = inMemoryPhotos.filter((p) => p.id !== id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: "Server error" }), { status: 500 })
  }
}
