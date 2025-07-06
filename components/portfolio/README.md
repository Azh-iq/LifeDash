# Portfolio Components

This directory contains the main portfolio management components for the LifeDash application.

## Components

### PortfolioHeader
Main header component for portfolio pages. Displays portfolio name, type, and action buttons.

**Props:**
- `portfolioId: string` - Portfolio identifier
- `onBack?: () => void` - Back navigation callback
- `onEdit?: () => void` - Edit portfolio callback
- `onDelete?: () => void` - Delete portfolio callback
- `onShare?: () => void` - Share portfolio callback

**Features:**
- Responsive design with mobile-first approach
- Real-time portfolio data display
- Action menu with share and edit options
- Loading and error states

### PortfolioMetrics
Displays key portfolio metrics with animated counters and performance indicators.

**Props:**
- `portfolioId: string` - Portfolio identifier

**Features:**
- Animated metric cards
- Real-time price updates
- Performance comparison (daily, weekly, monthly)
- Responsive grid layout
- Error boundaries for isolated failures

### PortfolioChartSection
Interactive chart component showing portfolio performance and allocation.

**Props:**
- `portfolioId: string` - Portfolio identifier

**Features:**
- Multiple chart types (performance, allocation, comparison)
- Configurable time ranges
- Fullscreen mode
- Real-time data updates
- Chart customization controls

### PortfolioSidebar
Side panel showing asset allocation and top movers.

**Props:**
- `portfolioId: string` - Portfolio identifier

**Features:**
- Asset allocation visualization
- Top gainers/losers display
- Responsive design
- Loading states

## Optimization Features

### Performance Optimizations
- **React.memo**: Components are memoized to prevent unnecessary re-renders
- **useCallback**: Event handlers are optimized with useCallback
- **Error Boundaries**: Each component is wrapped in error boundaries for isolated error handling
- **Code Splitting**: Components use dynamic imports where appropriate

### Bundle Optimization
- **Tree Shaking**: Imports are optimized to include only used functions
- **Icon Consolidation**: Both Heroicons and Lucide React are used strategically
- **Responsive Loading**: Mobile components are loaded conditionally

### Responsive Design
- **Mobile-First**: All components implement mobile-first responsive design
- **Touch Optimization**: Mobile interactions are optimized for touch
- **Adaptive Layout**: Components automatically adjust layout based on screen size

## Usage Example

```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import PortfolioMetrics from '@/components/portfolio/portfolio-metrics'

function PortfolioPage({ portfolioId }: { portfolioId: string }) {
  return (
    <div>
      <ErrorBoundary>
        <PortfolioHeader 
          portfolioId={portfolioId}
          onEdit={() => router.push('/edit')}
        />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <PortfolioMetrics portfolioId={portfolioId} />
      </ErrorBoundary>
    </div>
  )
}
```

## Performance Considerations

1. **Memoization**: All components use React.memo() for optimization
2. **Callback Optimization**: Event handlers use useCallback to prevent re-renders
3. **Error Isolation**: Error boundaries prevent cascading failures
4. **Responsive Loading**: Mobile-specific components load conditionally
5. **Bundle Splitting**: Large components can be code-split for better loading

## Testing

Components include:
- Unit tests for core functionality
- Integration tests for data flow
- Responsive design tests
- Error boundary tests
- Performance benchmarks

## Dependencies

- React 18+ with modern hooks
- Framer Motion for animations
- Heroicons/Lucide React for icons
- Tailwind CSS for styling
- Custom hooks for data management