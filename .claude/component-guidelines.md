# LifeDash Component Guidelines

## Button Components

### Primary Button

```tsx
<button className="btn-primary focus-ring">Sign In</button>
```

- Height: 48px
- Background: `#4169E1` (secondary-blue)
- Text: White
- Radius: 12px
- Hover: 10% lighter
- Active: 10% darker

### Secondary Button

```tsx
<button className="btn-secondary focus-ring">Create Account</button>
```

- Height: 48px
- Background: Transparent
- Border: 1.5px `#8B91A7` (secondary-gray)
- Hover: Background rgba(139, 145, 167, 0.1)

### Ghost Button

```tsx
<button className="btn-ghost focus-ring">Forgot Password?</button>
```

- Height: 44px
- Background: None
- Text: `#4169E1` (secondary-blue)
- Hover: Background rgba(65, 105, 225, 0.08)

## Card Components

### Standard Card

```tsx
<div className="card">
  <h2 className="text-h2">Card Title</h2>
  <p className="text-secondary-gray text-body">Card content</p>
</div>
```

- Background: `#1A1D29` (background-secondary)
- Border: 1px solid rgba(139, 145, 167, 0.1)
- Radius: 16px
- Padding: 20px
- Hover: Border rgba(65, 105, 225, 0.3)

### Portfolio Card

```tsx
<div className="card">
  <h3 className="text-h3">Investments</h3>
  <div className="trend-positive text-data-lg">$45,250.30</div>
  <div className="trend-positive text-data-sm">+2.4%</div>
</div>
```

- Use monospace font for all numerical values
- Right-align numbers
- Color-code performance indicators

## Input Components

### Text Input

```tsx
<input className="input-field focus-ring" type="email" placeholder="Email" />
```

- Height: 52px
- Background: `#242837` (background-tertiary)
- Border: 1px solid transparent
- Radius: 12px
- Focus: 2px `#4169E1` border

### Input with Label

```tsx
<div className="space-y-2">
  <label className="text-secondary-gray text-label">Email</label>
  <input className="input-field focus-ring" type="email" />
</div>
```

## Typography Components

### Display Text

```tsx
<h1 className="text-display-lg">$125,430.50</h1>
<h2 className="text-display-md">Portfolio Overview</h2>
```

### Data Display

```tsx
<div className="text-data-lg trend-positive">$45,250.30</div>
<div className="text-data-md font-mono">18.5 BTC</div>
<div className="text-data-sm font-mono">+2.4%</div>
```

### Body Text

```tsx
<p className="text-body-lg">Primary content and descriptions</p>
<p className="text-body">Standard UI text</p>
<p className="text-body-sm text-secondary-gray">Supporting text</p>
```

## Navigation Components

### Bottom Tab Bar (Mobile)

```tsx
<nav className="border-secondary-gray/10 bg-background-secondary fixed bottom-0 left-0 right-0 border-t">
  <div className="flex justify-around py-2">
    <button className="text-secondary-blue flex flex-col items-center p-2">
      <Icon className="h-6 w-6" />
      <span className="text-caption">Home</span>
    </button>
  </div>
</nav>
```

### Side Navigation (Desktop)

```tsx
<nav className="border-secondary-gray/10 bg-background-secondary w-64 border-r">
  <div className="space-y-2 p-4">
    <a
      href="#"
      className="text-primary-light hover:bg-secondary-blue/10 flex items-center rounded-sm p-3"
    >
      <Icon className="mr-3 h-5 w-5" />
      <span className="text-body">Dashboard</span>
    </a>
  </div>
</nav>
```

## Loading & Animation Components

### Skeleton Loading

```tsx
<div className="bg-background-tertiary h-4 animate-shimmer rounded-sm"></div>
```

### Floating Animation

```tsx
<div className="animate-float">
  <Icon className="text-secondary-blue h-8 w-8" />
</div>
```

### Staggered List Animation

```tsx
<div className="space-y-4">
  {items.map((item, index) => (
    <div
      key={item.id}
      className="card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {item.content}
    </div>
  ))}
</div>
```

## Chart Components

### Performance Chart

```tsx
<div className="chart-container">
  <svg className="h-64 w-full">
    <g className="chart-grid">{/* Grid lines */}</g>
    <path className="stroke-secondary-blue fill-none stroke-2" />
  </svg>
</div>
```

### Trend Indicators

```tsx
<div className="flex items-center space-x-2">
  <span className="font-mono text-data-md">$45,250.30</span>
  <span className="trend-positive text-data-sm">+2.4%</span>
  <TrendUpIcon className="text-accent-green h-4 w-4" />
</div>
```

## Form Components

### Login Form

```tsx
<form className="space-y-4">
  <div>
    <label className="text-secondary-gray text-label">Email</label>
    <input className="input-field focus-ring w-full" type="email" />
  </div>
  <div>
    <label className="text-secondary-gray text-label">Password</label>
    <input className="input-field focus-ring w-full" type="password" />
  </div>
  <button className="btn-primary w-full">Sign In</button>
</form>
```

### Search Input

```tsx
<div className="relative">
  <SearchIcon className="text-secondary-gray absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
  <input
    className="input-field focus-ring w-full pl-10"
    placeholder="Search stocks..."
  />
</div>
```

## Modal Components

### Modal Overlay

```tsx
<div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
  <div className="bg-background-secondary w-full max-w-md rounded-md p-6">
    <h2 className="mb-4 text-h2">Modal Title</h2>
    <p className="text-secondary-gray mb-6 text-body">Modal content</p>
    <div className="flex justify-end space-x-3">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

## State Components

### Success State

```tsx
<div className="p-6 text-center">
  <CheckCircleIcon className="text-accent-green mx-auto mb-4 h-16 w-16" />
  <h3 className="mb-2 text-h3">Success!</h3>
  <p className="text-secondary-gray text-body">Account created successfully</p>
</div>
```

### Error State

```tsx
<div className="p-6 text-center">
  <XCircleIcon className="text-accent-red mx-auto mb-4 h-16 w-16" />
  <h3 className="mb-2 text-h3">Error</h3>
  <p className="text-secondary-gray text-body">Something went wrong</p>
</div>
```

### Empty State

```tsx
<div className="p-12 text-center">
  <div className="bg-secondary-gray/10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
    <Icon className="text-secondary-gray h-12 w-12" />
  </div>
  <h3 className="mb-2 text-h3">No data available</h3>
  <p className="text-secondary-gray mb-6 text-body">
    Get started by adding your first investment
  </p>
  <button className="btn-primary">Add Investment</button>
</div>
```

## Accessibility Guidelines

### Focus Management

- All interactive elements must have focus states
- Use `focus-ring` utility class
- Ensure keyboard navigation works properly

### Color Contrast

- Verify 4.5:1 contrast ratio for normal text
- Verify 3:1 contrast ratio for large text
- Never rely solely on color to convey information

### Touch Targets

- Minimum 44px touch target size
- Ensure adequate spacing between interactive elements
- Optimize for thumb navigation on mobile

## Animation Guidelines

### Timing Functions

- Micro-interactions: 150ms with `ease-responsive`
- State transitions: 200ms with `ease-smooth`
- Data updates: 300ms with `ease-smooth`
- Page transitions: 350ms with `ease-smooth`

### Animation Types

- Hover states: Instant feedback
- Button presses: Subtle scale/color change
- Modal appearance: Fade + scale from 0.95 to 1.0
- List items: Stagger with 50ms delay
- Number changes: Count animation over 1 second

## Performance Optimization Patterns (July 2025)

### React.memo Usage

```tsx
import { memo, useCallback } from 'react'

const OptimizedComponent = memo(function OptimizedComponent({
  data,
  onUpdate,
}) {
  const handleUpdate = useCallback(() => {
    onUpdate(data.id)
  }, [data.id, onUpdate])

  return (
    <div className="card">
      <h3>{data.title}</h3>
      <Button onClick={handleUpdate}>Update</Button>
    </div>
  )
})
```

### Stable Refs Pattern

```tsx
const useStableHook = (data: any[], callback: Function) => {
  const dataRef = useRef<any[]>([])
  const callbackRef = useRef<Function>()

  // Update refs when values change
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Use refs in useEffect to avoid dependency cycles
  useEffect(() => {
    const processData = () => {
      callbackRef.current?.(dataRef.current)
    }

    processData()
  }, []) // Empty dependency array - uses refs instead
}
```

### Error Boundary Integration

```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'

function PortfolioPage() {
  return (
    <div className="page-container">
      <ErrorBoundary>
        <PortfolioHeader />
      </ErrorBoundary>

      <ErrorBoundary>
        <PortfolioMetrics />
      </ErrorBoundary>

      <ErrorBoundary>
        <HoldingsTable />
      </ErrorBoundary>
    </div>
  )
}
```

### Debounced Updates

```tsx
const useDebouncedUpdate = (callback: Function, delay: number = 1000) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}
```

### Memory Management

```tsx
const useCleanupEffect = (effect: () => (() => void) | void, deps: any[]) => {
  const mountedRef = useRef(true)

  useEffect(() => {
    const cleanup = effect()

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, deps)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return mountedRef
}
```

### Cache Integration

```tsx
import { PortfolioCacheManager } from '@/lib/cache/portfolio-cache'

const useCachedPortfolio = (portfolioId: string) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Try cache first
      const cached = PortfolioCacheManager.getPortfolio(portfolioId)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }

      // Fetch and cache
      const fresh = await fetchPortfolio(portfolioId)
      PortfolioCacheManager.setPortfolio(portfolioId, fresh)
      setData(fresh)
      setLoading(false)
    }

    loadData()
  }, [portfolioId])

  return { data, loading }
}
```
