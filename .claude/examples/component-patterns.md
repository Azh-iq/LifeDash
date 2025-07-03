# Component Patterns

## Basic Component Structure

### Functional Component with Props
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  children 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 py-2': size === 'md',
          'h-12 px-8 text-lg': size === 'lg',
        }
      )}
    >
      {children}
    </button>
  )
}
```

### Server Component with Data Fetching
```typescript
interface User {
  id: string
  name: string
  email: string
}

async function getUsers(): Promise<User[]> {
  // Fetch data from API
  const response = await fetch('https://api.example.com/users')
  return response.json()
}

export default async function UserList() {
  const users = await getUsers()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Users</h2>
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border p-4">
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Client Component with State
```typescript
'use client'

import { useState } from 'react'

interface CounterProps {
  initialValue?: number
}

export function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  return (
    <div className="flex items-center gap-4">
      <Button onClick={() => setCount(count - 1)}>-</Button>
      <span className="text-2xl font-bold">{count}</span>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  )
}
```

## Layout Patterns

### App Layout Structure
```typescript
// app/layout.tsx
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <nav className="container flex h-16 items-center">
              {/* Navigation */}
            </nav>
          </header>
          <main className="container py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
```

### Page Structure
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { UserStats } from '@/components/dashboard/user-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<LoadingSpinner />}>
          <UserStats />
        </Suspense>
        
        <Suspense fallback={<LoadingSpinner />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  )
}
```