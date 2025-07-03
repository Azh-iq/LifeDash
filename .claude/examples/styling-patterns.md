# Styling Patterns

## Tailwind CSS Patterns

### Responsive Design (Mobile-First)

```typescript
function ResponsiveCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      // Mobile first - full width
      'w-full p-4',
      // Medium screens - half width
      'md:w-1/2 md:p-6',
      // Large screens - one-third width
      'lg:w-1/3 lg:p-8',
      // Extra large screens - one-fourth width
      'xl:w-1/4'
    )}>
      {children}
    </div>
  )
}

// Grid responsive example
function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  )
}
```

### State Variants for Interactive Elements

```typescript
function InteractiveButton({ children, variant = 'primary' }: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
}) {
  return (
    <button className={cn(
      // Base styles
      'px-4 py-2 rounded-md font-medium transition-colors',
      // Focus styles
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Disabled styles
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Variant-specific hover and focus styles
      {
        'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500': variant === 'primary',
        'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500': variant === 'secondary',
        'border border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500': variant === 'outline',
      }
    )}>
      {children}
    </button>
  )
}
```

### Component Patterns with @apply

```css
/* globals.css */
@layer components {
  .btn-primary {
    @apply rounded-md bg-blue-500 px-4 py-2 font-medium text-white;
    @apply hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500;
    @apply disabled:cursor-not-allowed disabled:opacity-50;
    @apply transition-colors duration-200;
  }

  .card {
    @apply rounded-lg border border-gray-200 bg-white shadow-sm;
    @apply dark:border-gray-700 dark:bg-gray-800;
  }

  .input-field {
    @apply w-full rounded-md border border-gray-300 px-3 py-2;
    @apply focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500;
    @apply disabled:cursor-not-allowed disabled:bg-gray-100;
  }
}
```

### Arbitrary Values for Specific Requirements

```typescript
function CustomLayout() {
  return (
    <div className="grid grid-cols-[250px_1fr_300px] min-h-screen">
      {/* Sidebar */}
      <aside className="bg-gray-100 p-4">
        <nav className="space-y-2">
          <a href="#" className="block py-2 px-3 rounded hover:bg-gray-200">
            Dashboard
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Custom positioning */}
          <div className="relative">
            <div className="absolute top-[117px] left-[24px]">
              Custom positioned element
            </div>
          </div>

          {/* Custom grid with arbitrary values */}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-[32px] mt-8">
            <div className="bg-blue-50 p-4 rounded">Column 1</div>
            <div className="bg-blue-100 p-4 rounded">Column 2 (2x width)</div>
            <div className="bg-blue-50 p-4 rounded">Column 3</div>
          </div>
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="bg-gray-50 p-4">
        Right sidebar content
      </aside>
    </div>
  )
}
```

### Spacing Utilities for Consistent Layout

```typescript
function SpacingExamples() {
  return (
    <div className="space-y-8">
      {/* Vertical spacing between children */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Section Title</h2>
        <p>First paragraph</p>
        <p>Second paragraph</p>
        <p>Third paragraph</p>
      </div>

      {/* Horizontal spacing */}
      <div className="flex space-x-4">
        <button className="btn-primary">Button 1</button>
        <button className="btn-primary">Button 2</button>
        <button className="btn-primary">Button 3</button>
      </div>

      {/* Grid with gap */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">Card 1</div>
        <div className="card p-4">Card 2</div>
        <div className="card p-4">Card 3</div>
      </div>

      {/* Different spacing for different screen sizes */}
      <div className="space-y-2 md:space-y-4 lg:space-y-6">
        <div className="p-2 md:p-4 lg:p-6 bg-gray-100 rounded">
          Responsive spacing and padding
        </div>
        <div className="p-2 md:p-4 lg:p-6 bg-gray-100 rounded">
          Another item with responsive spacing
        </div>
      </div>
    </div>
  )
}
```

## Using the cn() Utility

### Conditional Classes

```typescript
import { cn } from '@/lib/utils/cn'

function Alert({ variant, className, children }: {
  variant: 'default' | 'destructive' | 'warning'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        // Base styles
        'relative w-full rounded-lg border p-4',
        // Conditional variants
        {
          'border-border bg-background text-foreground': variant === 'default',
          'border-destructive/50 bg-destructive/10 text-destructive': variant === 'destructive',
          'border-yellow-500/50 bg-yellow-50 text-yellow-800': variant === 'warning',
        },
        // Allow additional classes
        className
      )}
    >
      {children}
    </div>
  )
}
```

### Responsive Design

```typescript
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      'p-4 sm:p-6', // Responsive padding
      'w-full sm:max-w-sm md:max-w-md lg:max-w-lg' // Responsive width
    )}>
      {children}
    </div>
  )
}
```

## Design System Usage

### Color Tokens

```typescript
// Semantic colors from design system
const StatusBadge = ({ status }: { status: 'active' | 'inactive' | 'pending' }) => {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
      {
        'bg-green-100 text-green-800': status === 'active',
        'bg-red-100 text-red-800': status === 'inactive',
        'bg-yellow-100 text-yellow-800': status === 'pending',
      }
    )}>
      {status}
    </span>
  )
}
```

### Typography Scale

```typescript
function TypographyExample() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
      <h2 className="text-3xl font-semibold">Heading 2</h2>
      <h3 className="text-2xl font-semibold">Heading 3</h3>
      <h4 className="text-xl font-semibold">Heading 4</h4>
      <p className="text-base leading-7">Body text with good line height</p>
      <p className="text-sm text-muted-foreground">Small text for secondary info</p>
    </div>
  )
}
```

### Spacing System

```typescript
function SpacingExample() {
  return (
    <div className="space-y-8"> {/* Vertical spacing */}
      <div className="flex items-center gap-4"> {/* Horizontal spacing */}
        <div className="p-4 bg-card rounded-lg"> {/* Internal padding */}
          <p className="mb-2">Content with margin bottom</p>
          <p>More content</p>
        </div>
      </div>
    </div>
  )
}
```

## Dark Mode Support

### Theme-aware Components

```typescript
function ThemeToggle() {
  return (
    <button className={cn(
      'relative inline-flex h-10 w-10 items-center justify-center rounded-md',
      'bg-background text-foreground', // Uses CSS variables
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    )}>
      {/* Icon would go here */}
    </button>
  )
}
```

### Custom CSS Variables

```css
/* In globals.css - already configured */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

## Animation Patterns

### Transition Classes

```typescript
function AnimatedButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'transform transition-all duration-200 ease-in-out',
        'hover:scale-105 hover:shadow-lg',
        'active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Loading States

```typescript
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-primary',
        'border-t-transparent'
      )} />
    </div>
  )
}
```
