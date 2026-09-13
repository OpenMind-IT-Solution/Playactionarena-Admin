import type { ReactNode } from 'react'

import type { Metadata, Viewport } from 'next'

import 'react-perfect-scrollbar/dist/css/styles.css'
import 'leaflet/dist/leaflet.css'
import './globals.css'
import '../assets/iconify-icons/generated-icons.css'

export const metadata: Metadata = {
  title: 'Action Arena - Where Evert Bite Feels Like Family',
  description: 'Action Arena - Where Evert Bite Feels Like Family',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Action Arena'
  }
}

export const viewport: Viewport = {
  themeColor: '#f26649'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>{children}</body>
    </html>
  )
}
