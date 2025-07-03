import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'LifeDash',
  description: 'Your personal life dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background-primary font-sans antialiased text-primary-light">
        {children}
      </body>
    </html>
  )
}