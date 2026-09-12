import type { ReactNode } from 'react'

import 'react-perfect-scrollbar/dist/css/styles.css'
import 'leaflet/dist/leaflet.css'
import './globals.css'
import '../assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'Action Arena - Where Evert Bite Feels Like Family',
  description: 'Action Arena - Where Evert Bite Feels Like Family'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>{children}</body>
    </html>
  )
}
