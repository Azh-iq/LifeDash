# File Structure Examples

## Recommended Directory Organization

```
LifeDash/
├── .claude/                    # AI assistant configuration
│   ├── instructions.md
│   ├── context.md
│   ├── rules.md
│   └── examples/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Route groups
│   │   ├── dashboard/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # Reusable UI components
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── index.ts
│   ├── dashboard/             # Feature-specific components
│   │   ├── user-stats.tsx
│   │   └── recent-activity.tsx
│   └── layout/                # Layout components
│       ├── header.tsx
│       └── sidebar.tsx
├── lib/                       # Utility functions and shared logic
│   ├── utils/
│   │   ├── cn.ts
│   │   └── formatting.ts
│   ├── hooks/
│   │   └── use-local-storage.ts
│   └── api/
│       └── client.ts
├── types/                     # TypeScript type definitions
│   ├── api.ts
│   └── user.ts
└── public/                    # Static assets
    ├── icons/
    └── images/
```

## Component File Patterns

### UI Component Structure

```typescript
// components/ui/button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          'focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border border-input bg-background hover:bg-accent': variant === 'outline',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
```

### Index File for Clean Imports

```typescript
// components/ui/index.ts
export { Button } from './button'
export { Card } from './card'
export { Input } from './input'
export { Label } from './label'
```

### Feature Component Structure

```typescript
// components/dashboard/user-stats.tsx
import { Card } from '@/components/ui'

interface UserStatsProps {
  userId: string
}

export async function UserStats({ userId }: UserStatsProps) {
  const stats = await getUserStats(userId)

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="font-semibold">User Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
```

## Type Definition Patterns

### API Types

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

### Domain Types

```typescript
// types/user.ts
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends User {
  bio?: string
  location?: string
  website?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
}
```

## Utility Function Patterns

### Custom Hooks

```typescript
// lib/hooks/use-local-storage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}
```

### API Client

```typescript
// lib/api/client.ts
import { ApiResponse } from '@/types/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '')
```
