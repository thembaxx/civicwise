import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Archivo, Public_Sans } from 'next/font/google'
import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { PwaRegister } from '@/components/pwa-register'
import { getFollowedCode } from '@/lib/viewer'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', weight: ['500', '600', '700', '800'] })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Civic Ledger — Your municipality, clearly',
    template: '%s · Civic Ledger',
  },
  description:
    'An independent civic utility for understanding municipal money, finding your ward, and keeping a timestamped history of local service issues.',
  applicationName: 'Civic Ledger',
  keywords: ['South Africa', 'municipality', 'ward', 'municipal money', 'service delivery', 'civic accountability'],
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  generator: 'Civic Ledger',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eff3f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1d19' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const followed = await getFollowedCode()
  return (
    <html lang="en-ZA" className={`${archivo.variable} ${publicSans.variable} bg-background`}>
      <body className="antialiased">
        <PwaRegister />
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-2xl">
          <AppHeader />
          <main className="flex flex-1 flex-col px-4 pb-32 pt-2 md:px-6">{children}</main>
        </div>
        <BottomNav followedCode={followed} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
