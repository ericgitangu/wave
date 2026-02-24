import type { MetadataRoute } from 'next'
import meta from '@/data/meta.json'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: meta.app.name,
    short_name: meta.app.short_name,
    description: meta.app.description,
    start_url: '/',
    display: 'standalone',
    background_color: meta.app.background_color,
    theme_color: meta.app.theme_color,
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
