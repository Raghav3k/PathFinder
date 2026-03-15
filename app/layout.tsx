import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PathFinder - Strategic Pathfinding Puzzle',
  description: 'Challenge your mind with strategic pathfinding puzzles. Navigate grids, minimize your score, and compete for the top spot.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0c0c12] text-slate-100 font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
