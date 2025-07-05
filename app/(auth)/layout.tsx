import React from 'react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800">
      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2 text-2xl font-bold text-neutral-900 transition-colors dark:text-neutral-100"
          >
            <div className="from-primary-500 to-primary-700 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            LifeDash
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              ← Back to Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary-100 dark:bg-primary-900/20 absolute -right-40 -top-40 h-80 w-80 rounded-full opacity-50 blur-3xl" />
        <div className="bg-secondary-100 dark:bg-secondary-900/20 absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-50 blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(0 0 0) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(0 0 0) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 px-6 pb-12">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-200 bg-white/50 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
              <Link
                href="/legal/privacy"
                className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Privacy Policy
              </Link>
              <Link
                href="/legal/terms"
                className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Terms of Service
              </Link>
              <Link
                href="/support"
                className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Support
              </Link>
            </div>

            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              © 2024 LifeDash. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
