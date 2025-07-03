# TypeScript Patterns

## Type Definitions and Interfaces

### Domain Types with TSDoc
```typescript
// types/user.ts

/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string
  /** User's email address */
  email: string
  /** User's display name */
  name: string
  /** Optional avatar URL */
  avatar?: string
  /** Account creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * User profile with extended information
 */
export interface UserProfile extends User {
  bio?: string
  location?: string
  website?: string
  preferences: UserPreferences
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
}
```

### API Response Types
```typescript
// types/api.ts

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
  timestamp: Date
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * API error with structured details
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

## Advanced Type Patterns

### Discriminated Unions
```typescript
// types/states.ts

/**
 * Loading state with discriminated union
 */
export type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

/**
 * Form validation state
 */
export type ValidationState =
  | { isValid: true; errors: [] }
  | { isValid: false; errors: ValidationError[] }

export interface ValidationError {
  field: string
  message: string
}
```

### Generic Utility Types
```typescript
// types/utilities.ts

/**
 * Make specific fields optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific fields required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Extract function return type
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never

/**
 * Create update payload type
 */
export type UpdatePayload<T> = PartialBy<T, 'id' | 'createdAt' | 'updatedAt'>
```

## Service Layer Patterns

### Type-Safe Service Class
```typescript
// lib/services/user-service.ts
import { User, UserProfile, ApiResponse } from '@/types'

/**
 * Service for user-related operations
 */
export class UserService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Finds a user by email address
   * @param email - The email to search for
   * @returns Promise containing the user or null
   * @throws ApiError if the request fails
   */
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users?email=${email}`)
      
      if (!response.ok) {
        throw new ApiError(
          'Failed to fetch user',
          response.status,
          await response.text()
        )
      }

      const result: ApiResponse<User> = await response.json()
      return result.data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Network error', 500, error)
    }
  }

  /**
   * Updates user profile
   * @param userId - The user ID to update
   * @param updates - Partial user data to update
   * @returns Promise containing updated user
   */
  async updateProfile(
    userId: string,
    updates: UpdatePayload<UserProfile>
  ): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new ApiError('Failed to update user', response.status)
    }

    const result: ApiResponse<UserProfile> = await response.json()
    return result.data
  }
}
```

### Type Guards and Predicates
```typescript
// lib/utils/type-guards.ts

/**
 * Type guard to check if value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * Type guard for User interface
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj &&
    typeof (obj as User).id === 'string' &&
    typeof (obj as User).email === 'string' &&
    typeof (obj as User).name === 'string'
  )
}

/**
 * Type predicate for filtering arrays
 */
export function isValidEmail(email: string): email is string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

## React Component Type Patterns

### Strongly Typed Component Props
```typescript
// components/user-card.tsx
import { User } from '@/types'

interface UserCardProps {
  user: User
  showEmail?: boolean
  onEdit?: (user: User) => void
  className?: string
}

export function UserCard({ 
  user, 
  showEmail = false, 
  onEdit, 
  className 
}: UserCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <div className="flex items-center gap-3">
        {user.avatar && (
          <img 
            src={user.avatar} 
            alt={`${user.name}'s avatar`}
            className="h-10 w-10 rounded-full"
          />
        )}
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          {showEmail && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>
      {onEdit && (
        <button 
          onClick={() => onEdit(user)}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Edit Profile
        </button>
      )}
    </div>
  )
}
```

### Generic Hook Pattern
```typescript
// lib/hooks/use-api.ts
import { useState, useEffect } from 'react'
import { LoadingState } from '@/types'

/**
 * Generic hook for API data fetching
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [state, setState] = useState<LoadingState<T>>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setState({ status: 'loading' })
      
      try {
        const data = await fetcher()
        if (!cancelled) {
          setState({ status: 'success', data })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, dependencies)

  return state
}

// Usage example
export function UserProfile({ userId }: { userId: string }) {
  const userState = useApi(() => userService.findById(userId), [userId])

  switch (userState.status) {
    case 'loading':
      return <div>Loading...</div>
    case 'error':
      return <div>Error: {userState.error}</div>
    case 'success':
      return <UserCard user={userState.data} />
    default:
      return null
  }
}
```

## Design Patterns

### Factory Pattern
```typescript
// types/user.ts
export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER'
}

export interface User {
  id: string
  email: string
  role: UserRole
}

// lib/factories/user-factory.ts
export class UserFactory {
  static createUser(data: Partial<User>): User {
    return {
      id: data.id || crypto.randomUUID(),
      email: data.email || '',
      role: data.role || UserRole.User
    }
  }
}
```

### Observer Pattern
```typescript
// lib/utils/event-emitter.ts
export class EventEmitter<T> {
  private listeners: ((data: T) => void)[] = []

  subscribe(listener: (data: T) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit(data: T): void {
    this.listeners.forEach(listener => listener(data))
  }
}

// Usage example
const userEvents = new EventEmitter<User>()

// Subscribe to user events
const unsubscribe = userEvents.subscribe((user) => {
  console.log('User updated:', user)
})

// Emit user event
userEvents.emit(updatedUser)
```

## Performance Optimization

### Memoization Pattern
```typescript
// lib/utils/memoize.ts
export function memoize<T extends object, U>(fn: (arg: T) => U): (arg: T) => U {
  const cache = new Map<string, U>()

  return (arg: T): U => {
    const key = JSON.stringify(arg)
    if (cache.has(key)) return cache.get(key)!
    
    const result = fn(arg)
    cache.set(key, result)
    return result
  }
}

// Usage example
const expensiveCalculation = memoize((data: { numbers: number[] }) => {
  return data.numbers.reduce((sum, num) => sum + num * num, 0)
})
```

## Security Patterns

### Input Sanitization
```typescript
// lib/utils/security.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000) // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitizeInput(email))
}
```

### Comprehensive Error Handling
```typescript
// lib/api/user-api.ts
interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
  }
}

export async function fetchUser(id: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`/api/users/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return { data: UserFactory.createUser(data) }
  } catch (error) {
    return {
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
```

## Form Handling with Types

### Typed Form State
```typescript
// lib/hooks/use-form.ts
import { useState } from 'react'

export type FormState<T> = {
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
}

export type FormConfig<T> = {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => Promise<void>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: FormConfig<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
  })

  const updateField = (name: keyof T, value: T[keyof T]) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      errors: { ...prev.errors, [name]: undefined },
    }))
  }

  const handleSubmit = async () => {
    const errors = validate?.(state.values) || {}
    
    if (Object.keys(errors).length > 0) {
      setState(prev => ({ ...prev, errors }))
      return
    }

    setState(prev => ({ ...prev, isSubmitting: true }))
    
    try {
      await onSubmit(state.values)
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  return {
    ...state,
    updateField,
    handleSubmit,
  }
}
```