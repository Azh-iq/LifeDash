import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-foreground mb-4 text-4xl font-bold">
          Welcome to LifeDash
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Your personal life dashboard
        </p>

        <nav className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/test-connection"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-center text-white transition-colors hover:bg-primary-700"
          >
            Test Database Connection
          </Link>
          <Link
            href="/ui-demo"
            className="inline-block rounded-lg bg-secondary-600 px-6 py-3 text-center text-white transition-colors hover:bg-secondary-700"
          >
            UI Component Demo
          </Link>
          <Link
            href="/data-demo"
            className="inline-block rounded-lg bg-green-600 px-6 py-3 text-center text-white transition-colors hover:bg-green-700"
          >
            Data Display Demo
          </Link>
          <Link
            href="/auth-demo"
            className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-center text-white transition-colors hover:bg-purple-700"
          >
            Authentication Demo
          </Link>
        </nav>
      </div>
    </main>
  )
}
