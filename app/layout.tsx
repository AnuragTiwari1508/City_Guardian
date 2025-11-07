import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import FloatingChatbot from "@/components/floating-chatbot"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "🎮 CITY GUARDIAN - Environmental Defense Network",
  description: "Gaming-themed environmental monitoring platform. Real-time sensor data, mission control interface, and gamified citizen engagement for urban environmental protection.",
  keywords: ["environmental monitoring", "gaming interface", "smart city", "IoT sensors", "citizen engagement", "mission control"],
  authors: [{ name: "City Guardian Team" }],
  creator: "City Guardian",
  publisher: "City Guardian",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cityguardian-frontend.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '🎮 CITY GUARDIAN - Environmental Defense Network',
    description: 'Gaming-themed environmental monitoring platform with real-time sensor data and mission control interface.',
    url: 'https://cityguardian-frontend.vercel.app',
    siteName: 'City Guardian',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'City Guardian Logo - Environmental Defense Shield',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎮 CITY GUARDIAN - Environmental Defense Network',
    description: 'Gaming-themed environmental monitoring platform with real-time sensor data.',
    images: ['/logo.svg'],
    creator: '@cityguardian',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo.svg",
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <FloatingChatbot />
        <Analytics />
      </body>
    </html>
  )
}
