import type React from "react"
import type { Metadata } from "next"
import { Kode_Mono } from "next/font/google"
import "./globals.css"

const kodeMono = Kode_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-kode-mono",
})

export const metadata: Metadata = {
  title: "Photobooth App",
  description: "Capture fun moments with filters and effects",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${kodeMono.variable} antialiased`}>
      <body className="font-mono">{children}</body>
    </html>
  )
}
