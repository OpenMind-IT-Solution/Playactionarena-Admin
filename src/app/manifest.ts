import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.BASEPATH ?? ''

  return {
    name: 'Action Arena - Where Every Bite Feels Like Family',
    short_name: 'Action Arena',
    description: 'Action Arena - Where Every Bite Feels Like Family',
    start_url: `${basePath}/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f26649',
    icons: [
      {
        src: `${basePath}/icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${basePath}/icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${basePath}/icons/icon-512-maskable.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
