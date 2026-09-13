import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en/dashboards/crm',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/dashboards/crm',
        permanent: true,
        locale: false
      },
      {
        // Skip known page prefixes AND anything that looks like a static/metadata
        // file (has a "." in its segment, e.g. manifest.webmanifest, icon.png,
        // apple-icon.png, logo.webp, favicon.ico, robots.txt, sitemap.xml, ...).
        // Without the dot-exclusion, those root-level files get redirected to
        // /en/<file> (which doesn't exist) and fall through to the [lang] catch-all,
        // returning an HTML 200 instead of the real asset — this is what was breaking
        // manifest.webmanifest and the icon files, making the PWA "not installable".
        source: '/((?!(?:en|fr|ar|front-pages)\\b)(?!.*\\.)):path',
        destination: '/en/:path',
        permanent: true,
        locale: false
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3009',
        pathname: '/upload/images/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3009',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'api.openminditsolutions.in',
        pathname: '/upload/images/**'
      },
      {
        protocol: 'https',
        hostname: 'api.openminditsolutions.in',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'cafe.playactionarena.com',
        pathname: '/upload/images/**'
      },
      {
        protocol: 'https',
        hostname: 'cafe.playactionarena.com',
        pathname: '/uploads/**'
      }
    ]
  }
}

export default nextConfig
