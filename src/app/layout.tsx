import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const plexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-plex-sans',
})

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
})

export const metadata: Metadata = {
  title: 'Detective Bureau — Investigate. Analyze. Uncover.',
  description:
    'An AI-driven investigation simulator. Interrogate suspects in your own words, earn every piece of evidence, and file the accusation. Every case is generated once and never repeats.',
}

export const viewport: Viewport = {
  themeColor: '#0B0D10',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${bebas.variable} ${plexSans.variable} ${plexMono.variable} bg-ink`}
      >
        <body className="antialiased bg-ink font-sans text-parchment">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}