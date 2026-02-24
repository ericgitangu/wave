import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

import meta from '@/data/meta.json'
import CollapsibleNav from '@/components/CollapsibleNav'
import GlobalSearch from '@/components/GlobalSearch'
import ThemeToggle from '@/components/ThemeToggle'
import ChatWidget from '@/components/ChatWidget'
import InstallPrompt from '@/components/pwa/install-prompt'
import ServiceWorkerRegister from '@/components/pwa/sw-register'
import { Toaster } from '@/components/ui/sonner'
import WhatsNew from '@/components/WhatsNew'
import { AppStatusProvider } from '@/context/app-status-context'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: meta.seo.title,
  description: meta.app.description,
  keywords: meta.seo.keywords,
  authors: [{ name: meta.seo.author }],
  metadataBase: new URL(meta.app.url),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: meta.app.short_name,
  },
  openGraph: {
    title: meta.seo.title,
    description: meta.seo.og_description,
    url: meta.app.url,
    siteName: meta.app.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.seo.title,
    description: meta.seo.og_description,
    creator: meta.seo.twitter,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: meta.app.background_color },
    { media: '(prefers-color-scheme: light)', color: meta.app.theme_color },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="dark"
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          <AppStatusProvider>
            <div className="flex min-h-screen">
              <CollapsibleNav />
              <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-sm">
                  <GlobalSearch />
                  <ThemeToggle />
                </header>
                <main className="flex-1 p-6">{children}</main>
              </div>
            </div>
            <ChatWidget />
            <InstallPrompt />
            <ServiceWorkerRegister />
            <Toaster />
            <WhatsNew />
          </AppStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
