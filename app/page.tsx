import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to LifeDash
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Your personal life dashboard
        </p>
        
        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
          <Link 
            href="/test-connection" 
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors text-center"
          >
            Test Database Connection
          </Link>
          <Link 
            href="/ui-demo" 
            className="inline-block bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors text-center"
          >
            UI Component Demo
          </Link>
          <Link 
            href="/data-demo" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            Data Display Demo
          </Link>
          <Link 
            href="/auth-demo" 
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            Authentication Demo
          </Link>
        </nav>
      </div>
    </main>
  )
}