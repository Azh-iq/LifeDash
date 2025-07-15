# Wireframe Breadcrumb Component

A lightweight, reusable breadcrumb navigation component designed to match the exact styling specifications from the LifeDash wireframes.

## Features

- ✅ **Pixel-perfect wireframe compliance** - Matches the exact styling from wireframes
- ✅ **Auto-generation** - Automatically generates breadcrumbs from pathname
- ✅ **Norwegian localization** - Built-in Norwegian route mappings
- ✅ **TypeScript support** - Full TypeScript definitions
- ✅ **Next.js App Router** - Compatible with Next.js App Router
- ✅ **Accessibility** - Proper ARIA labels and keyboard navigation
- ✅ **Customizable** - Custom items, route mappings, and click handlers
- ✅ **Lightweight** - Simple, focused implementation

## Wireframe Styling Specifications

The component matches the exact styling from wireframes:

```css
background: white;
padding: 12px 24px;
border-bottom: 1px solid #e5e7eb;
font-size: 14px;
color: #6b7280; /* links */
color: #6366f1; /* current page */
```

## Installation

The component is already included in the LifeDash project at `components/ui/wireframe-breadcrumb.tsx`.

## Basic Usage

```tsx
import { WireframeBreadcrumb } from '@/components/ui/wireframe-breadcrumb'

// Auto-generated breadcrumb from current pathname
function MyPage() {
  return (
    <div>
      <WireframeBreadcrumb />
      {/* Your page content */}
    </div>
  )
}
```

## Advanced Usage

### Custom Breadcrumb Items

```tsx
import { WireframeBreadcrumb, type BreadcrumbItem } from '@/components/ui/wireframe-breadcrumb'

const customItems: BreadcrumbItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Investeringer', href: '/investments' },
  { label: 'Aksjer', href: '/stocks', isActive: true },
]

function StocksPage() {
  return <WireframeBreadcrumb items={customItems} />
}
```

### Custom Route Mapping

```tsx
const customRouteMap = {
  dashboard: 'Hjem',
  investments: 'Mine Investeringer',
  stocks: 'Aksjeportefølje',
  crypto: 'Kryptovaluta',
}

function MyPage() {
  return <WireframeBreadcrumb routeMap={customRouteMap} />
}
```

### Click Handler

```tsx
import { useRouter } from 'next/navigation'

function MyPage() {
  const router = useRouter()
  
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    console.log('Navigating to:', item.href)
    router.push(item.href)
  }
  
  return (
    <WireframeBreadcrumb onItemClick={handleBreadcrumbClick} />
  )
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | `undefined` | Custom breadcrumb items. If not provided, auto-generates from pathname |
| `className` | `string` | `undefined` | Custom CSS class for the container |
| `routeMap` | `Record<string, string>` | `DEFAULT_ROUTE_MAP` | Custom Norwegian route mappings |
| `separator` | `string` | `' › '` | Custom separator between breadcrumb items |
| `onItemClick` | `(item: BreadcrumbItem) => void` | `undefined` | Click handler for breadcrumb items |

### BreadcrumbItem Interface

```typescript
interface BreadcrumbItem {
  label: string      // Display text
  href: string       // Navigation URL
  isActive?: boolean // Whether this is the current page
}
```

## Default Route Mappings

The component includes Norwegian translations for common routes:

| Route | Norwegian Label |
|-------|-----------------|
| `dashboard` | Dashboard |
| `investments` | Investeringer |
| `stocks` | Aksjer |
| `portfolio` | Portefølje |
| `transactions` | Transaksjoner |
| `settings` | Innstillinger |
| `tools` | Verktøy |
| `reports` | Rapporter |
| `analysis` | Analyse |
| `holdings` | Beholdninger |
| `performance` | Ytelse |
| `alerts` | Varsler |
| `profile` | Profil |

## Wireframe Examples

Based on the wireframes, here are the expected breadcrumb patterns:

### Dashboard Page
```
Dashboard
```

### Investments Page
```
Dashboard › Investeringer
```

### Stocks Page
```
Dashboard › Investeringer › Aksjer
```

## Integration in LifeDash

To integrate into existing LifeDash pages:

1. Import the component
2. Add it to your page layout
3. Optionally customize route mappings
4. Test on both desktop and mobile

```tsx
// In your page.tsx or layout.tsx
import { WireframeBreadcrumb } from '@/components/ui/wireframe-breadcrumb'

export default function InvestmentsPage() {
  return (
    <div>
      <WireframeBreadcrumb />
      {/* Your page content */}
    </div>
  )
}
```

## Accessibility

The component follows WCAG 2.1 guidelines:

- ✅ Proper ARIA labels (`aria-label="Breadcrumb navigation"`)
- ✅ Current page indication (`aria-current="page"`)
- ✅ Keyboard navigation support
- ✅ Focus management with visible focus indicators
- ✅ Semantic HTML structure

## Performance

- **Lightweight** - Simple implementation focused on wireframe requirements
- **Memoization** - Uses React.useMemo for efficient re-renders
- **No external dependencies** - Only uses Next.js Link and React
- **Fast rendering** - Minimal DOM manipulation

## Comparison with NorwegianBreadcrumb

| Feature | WireframeBreadcrumb | NorwegianBreadcrumb |
|---------|-------------------|-------------------|
| Wireframe compliance | ✅ Exact match | ⚠️ Enhanced styling |
| Complexity | ✅ Simple | ❌ Complex |
| File size | ✅ Small (~4KB) | ❌ Large (~15KB) |
| Features | ✅ Essential only | ✅ Full-featured |
| Performance | ✅ Fast | ⚠️ Slower |
| Animations | ❌ None | ✅ Framer Motion |
| Mobile handling | ✅ Responsive | ✅ Advanced |

## When to Use

Use `WireframeBreadcrumb` when:
- You want exact wireframe compliance
- You need a lightweight solution
- You don't need advanced features like animations
- You're building new pages that must match wireframes exactly

Use `NorwegianBreadcrumb` when:
- You need advanced features like animations
- You want mobile-specific optimizations
- You're working with existing complex navigation flows

## Demo

See `wireframe-breadcrumb-demo.tsx` for a complete example showing all features and usage patterns.

## Contributing

When modifying this component:
1. Ensure wireframe compliance is maintained
2. Test all props and edge cases
3. Update TypeScript definitions
4. Add tests for new features
5. Update this README