# Next.js Specific Patterns

## Server vs Client Components

### Server Component with Data Fetching
```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface Post {
  title: string
  content: string
  slug: string
  publishedAt: string
}

interface PageProps {
  params: { slug: string }
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`https://api.example.com/posts/${slug}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })
    
    if (!res.ok) {
      return null
    }
    
    return res.json()
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found'
    }
  }

  return {
    title: post.title,
    description: post.content.slice(0, 160),
  }
}

export default async function BlogPost({ params }: PageProps) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }

  return (
    <article className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <time className="text-muted-foreground">
          {new Date(post.publishedAt).toLocaleDateString()}
        </time>
      </header>
      <div className="prose prose-lg max-w-none">
        {post.content}
      </div>
    </article>
  )
}
```

### Client Component with Interactivity
```typescript
// app/components/Counter.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CounterProps {
  initialValue?: number
  step?: number
}

export default function Counter({ initialValue = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  const increment = () => setCount(prev => prev + step)
  const decrement = () => setCount(prev => prev - step)
  const reset = () => setCount(initialValue)

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Button onClick={decrement} variant="outline" size="sm">
        -
      </Button>
      <span className="text-2xl font-bold min-w-[3rem] text-center">
        {count}
      </span>
      <Button onClick={increment} variant="outline" size="sm">
        +
      </Button>
      <Button onClick={reset} variant="secondary" size="sm">
        Reset
      </Button>
    </div>
  )
}
```

## Route Handlers and API Routes

### GET Route Handler
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface Post {
  id: string
  title: string
  excerpt: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'

    // Fetch posts from database or external API
    const posts: Post[] = await fetchPosts({
      page: parseInt(page),
      limit: parseInt(limit)
    })

    return NextResponse.json({
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length
      }
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
```

### POST Route Handler with Validation
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(10),
  tags: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createPostSchema.parse(body)
    
    // Create post in database
    const newPost = await createPost(validatedData)
    
    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
```

## Dynamic Routes and Layouts

### Dynamic Route with Multiple Segments
```typescript
// app/blog/[category]/[slug]/page.tsx
interface PageProps {
  params: { 
    category: string
    slug: string 
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function BlogPost({ params, searchParams }: PageProps) {
  const { category, slug } = params
  
  const post = await getPostBySlug(category, slug)
  
  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <nav className="mb-6">
        <Link href="/blog" className="text-primary hover:underline">
          Blog
        </Link>
        {' / '}
        <Link href={`/blog/${category}`} className="text-primary hover:underline">
          {category}
        </Link>
        {' / '}
        <span className="text-muted-foreground">{post.title}</span>
      </nav>
      
      <article>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="prose max-w-none">
          {post.content}
        </div>
      </article>
    </div>
  )
}
```

### Nested Layout with Loading States
```typescript
// app/dashboard/layout.tsx
import { Suspense } from 'react'
import { DashboardNav } from '@/components/dashboard/nav'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardNav />
        </Suspense>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <div className="container py-6">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
```

## Data Fetching Patterns

### Server Component with Parallel Data Fetching
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { UserStats } from '@/components/dashboard/user-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

async function getUserData(userId: string) {
  // These fetch operations run in parallel
  const [user, stats, activities] = await Promise.all([
    fetchUser(userId),
    fetchUserStats(userId),
    fetchRecentActivity(userId)
  ])
  
  return { user, stats, activities }
}

export default async function DashboardPage() {
  const { user, stats, activities } = await getUserData('current-user-id')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">Here's what's happening today.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UserStats stats={stats} />
        <RecentActivity activities={activities} />
        <QuickActions />
      </div>
    </div>
  )
}
```

### Client Component with SWR/React Query Pattern
```typescript
// app/components/live-data.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface LiveDataProps {
  endpoint: string
  refreshInterval?: number
}

export function LiveData({ endpoint, refreshInterval = 5000 }: LiveDataProps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(endpoint)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [endpoint, refreshInterval])

  if (loading && !data) {
    return <Card className="p-6">Loading...</Card>
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-destructive">Error: {error}</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <pre className="text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  )
}
```

## Next.js Conventions

### File Structure and Naming
```typescript
// ✅ Correct directory structure
app/
├── auth-form/          // kebab-case for directories
│   └── page.tsx
├── user-profile/       // kebab-case for directories
│   └── page.tsx
└── components/
    ├── AuthForm.tsx    // PascalCase for components
    └── UserCard.tsx    // PascalCase for components

// ✅ Named exports (preferred)
// components/Button.tsx
export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>
}

// ❌ Avoid default exports
export default function Button() { /* ... */ }
```

### Server Actions for Forms
```typescript
// app/contact/actions.ts
'use server'

import { redirect } from 'next/navigation'

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string

  // Validate and process form data
  if (!name || !email || !message) {
    throw new Error('All fields are required')
  }

  // Save to database
  await saveContactForm({ name, email, message })
  
  // Redirect after successful submission
  redirect('/contact/success')
}

// app/contact/page.tsx
import { submitContactForm } from './actions'

export default function ContactPage() {
  return (
    <form action={submitContactForm} className="space-y-4">
      <input 
        name="name" 
        placeholder="Your name" 
        required 
        className="w-full p-2 border rounded"
      />
      <input 
        name="email" 
        type="email" 
        placeholder="Your email" 
        required 
        className="w-full p-2 border rounded"
      />
      <textarea 
        name="message" 
        placeholder="Your message" 
        required 
        className="w-full p-2 border rounded"
      />
      <button type="submit" className="px-4 py-2 bg-primary text-white rounded">
        Send Message
      </button>
    </form>
  )
}
```

### URL Search Params for State
```typescript
// app/products/page.tsx
import { Suspense } from 'react'
import { ProductList } from './product-list'

interface PageProps {
  searchParams: {
    category?: string
    sort?: string
    page?: string
  }
}

export default function ProductsPage({ searchParams }: PageProps) {
  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

// app/products/product-list.tsx
import Link from 'next/link'

interface ProductListProps {
  searchParams: {
    category?: string
    sort?: string
    page?: string
  }
}

export async function ProductList({ searchParams }: ProductListProps) {
  const products = await fetchProducts(searchParams)
  
  return (
    <div>
      {/* Filter links update URL search params */}
      <nav className="mb-4 space-x-2">
        <Link 
          href="/products?category=electronics" 
          className="text-primary hover:underline"
        >
          Electronics
        </Link>
        <Link 
          href="/products?category=clothing" 
          className="text-primary hover:underline"
        >
          Clothing
        </Link>
      </nav>
      
      <div className="grid gap-4">
        {products.map(product => (
          <div key={product.id} className="border rounded p-4">
            <h3>{product.name}</h3>
            <p>{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Minimal Client Components
```typescript
// components/InteractiveWrapper.tsx
'use client'

import { useState } from 'react'

interface InteractiveWrapperProps {
  children: React.ReactNode
  initialCount?: number
}

// Small client component wrapper
export function InteractiveWrapper({ children, initialCount = 0 }: InteractiveWrapperProps) {
  const [count, setCount] = useState(initialCount)

  return (
    <div className="border rounded p-4">
      <div className="mb-4">
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-3 py-1 bg-primary text-white rounded mr-2"
        >
          Count: {count}
        </button>
      </div>
      {children}
    </div>
  )
}

// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react'
import { InteractiveWrapper } from '@/components/InteractiveWrapper'
import { UserStats } from '@/components/UserStats'

export default async function DashboardPage() {
  const userData = await fetchUserData()

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Wrap interactive elements in client component */}
      <InteractiveWrapper>
        <Suspense fallback={<div>Loading stats...</div>}>
          <UserStats data={userData} />
        </Suspense>
      </InteractiveWrapper>
    </div>
  )
}
```

## Navigation and Routing

### Navigation Component with Active States
```typescript
// app/components/navigation.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Posts', href: '/posts' },
  { name: 'Settings', href: '/settings' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-4">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
```

### Programmatic Navigation
```typescript
// app/components/form-with-redirect.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function FormWithRedirect() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        // Programmatic navigation after successful submission
        router.push('/success')
        router.refresh() // Refresh server components
      }
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
```