import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import { cookies } from 'next/headers'
import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { PwaRegister } from '@/components/pwa-register'
import { AppFooter } from '@/components/app-footer'
import { getFollowedCode } from '@/lib/viewer'
import './globals.css'

const editorial = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-editorial',
  weight: '400',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Civicwise — Your municipality, clearly',
    template: '%s · Civicwise',
  },
  description:
    'An independent civic utility for understanding municipal money, finding your ward, and keeping a timestamped history of local service issues.',
  applicationName: 'Civicwise',
  keywords: [
    'South Africa',
    'municipality',
    'ward',
    'municipal money',
    'service delivery',
    'civic accountability',
  ],
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  generator: 'Civicwise',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f0e9' },
    { media: '(prefers-color-scheme: dark)', color: '#181b16' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [followed, cookieStore] = await Promise.all([
    getFollowedCode(),
    cookies(),
  ])
  const theme = cookieStore.get('theme')?.value === 'dark' ? 'dark' : 'light'
  return (
    <html
      lang="en-ZA"
      className={`${editorial.variable} ${dmSans.variable} ${theme} bg-background`}
    >
      <body className="antialiased">
        <PwaRegister />
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-50 -translate-y-24 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground focus:translate-y-0"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <AppHeader followedCode={followed} />
          <main
            id="main-content"
            tabIndex={-1}
            className="site-width site-main flex-1"
          >
            {children}
          </main>
          <AppFooter />
        </div>
        <BottomNav followedCode={followed} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <a href="/vision/index.html" style={{ display: 'block', width: 'fit-content', margin: '16px auto', padding: '12px 18px', border: '1px solid currentColor', borderRadius: 999, fontSize: 14, textDecoration: 'none' }}>Try on-device vision (preview)</a>
      </body>
    </html>
  )
}
