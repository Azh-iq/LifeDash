import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'
import { ToastContainer } from '@/components/ui/toast'
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
      <body className="main-layout min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <ToastContainer>{children}</ToastContainer>
      </body>
    </html>
  )
}
