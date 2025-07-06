# Error Boundaries Usage Guide

This application now includes comprehensive error boundaries to gracefully handle different types of errors without breaking the entire application.

## Error Boundary Types

### 1. PageErrorBoundary

For page-level errors that should show a full error page.

```tsx
import { PageErrorBoundary } from '@/components/ui/error-boundaries'

export default function MyPage() {
  return <PageErrorBoundary>{/* Your page content */}</PageErrorBoundary>
}
```

### 2. APIErrorBoundary

For components that make API calls or handle data fetching.

```tsx
import { APIErrorBoundary } from '@/components/ui/error-boundaries'

function DataComponent() {
  return (
    <APIErrorBoundary>
      <PortfolioMetrics portfolioId={portfolioId} />
    </APIErrorBoundary>
  )
}
```

### 3. RenderErrorBoundary

For UI components that might have rendering issues.

```tsx
import { RenderErrorBoundary } from '@/components/ui/error-boundaries'

function UIComponent() {
  return (
    <RenderErrorBoundary>
      <ComplexChart data={data} />
    </RenderErrorBoundary>
  )
}
```

### 4. MobileErrorBoundary

Specialized for mobile components with mobile-friendly error UI.

```tsx
import { MobileErrorBoundary } from '@/components/ui/error-boundaries'

function MobileComponent() {
  return (
    <MobileErrorBoundary>
      <MobileNavigation />
    </MobileErrorBoundary>
  )
}
```

## Error Boundary Provider (Universal)

For dynamic error boundary selection:

```tsx
import { ErrorBoundaryProvider } from '@/components/ui/error-boundaries'

function MyComponent() {
  return (
    <ErrorBoundaryProvider type="api">
      <DataFetchingComponent />
    </ErrorBoundaryProvider>
  )
}
```

## Higher-Order Components

For wrapping existing components:

```tsx
import { withAPIErrorBoundary } from '@/components/ui/error-boundaries'

const SafeDataComponent = withAPIErrorBoundary(DataComponent)
```

## Error Logging

All error boundaries automatically log errors to the console in development and can be configured to send to error reporting services in production.

### Using the Error Handler Hook

```tsx
import { useErrorHandler } from '@/components/ui/error-boundaries'

function MyComponent() {
  const handleError = useErrorHandler()

  const handleAsyncOperation = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      handleError(error, undefined, 'ASYNC_OPERATION')
    }
  }
}
```

## Implementation Strategy

### Current Implementation

1. **StocksPage**: Uses `PageErrorBoundary` for the entire page and specialized boundaries for different sections:
   - `APIErrorBoundary` for data-fetching components (PortfolioMetrics, HoldingsSection, etc.)
   - `RenderErrorBoundary` for UI components (PortfolioHeader, QuickActions)
   - `MobileErrorBoundary` for mobile dashboard

2. **Mobile Components**: All mobile components are wrapped with appropriate error boundaries:
   - Mobile navigation uses `RenderErrorBoundary`
   - Mobile portfolio dashboard uses `APIErrorBoundary` for data sections
   - Mobile-specific components use `MobileErrorBoundary`

3. **Stock Detail Modal**: Uses `APIErrorBoundary` for transaction data and `RenderErrorBoundary` for UI tabs

4. **Investments Page**: Uses `PageErrorBoundary` for the entire page and `RenderErrorBoundary` for the categories grid

## Error Boundary Features

### Norwegian User Interface

All error messages are in Norwegian for user-friendly experience.

### Development vs Production

- **Development**: Shows detailed error information and stack traces
- **Production**: Shows user-friendly messages only

### Error Types Detection

- **Network Errors**: Special handling for connectivity issues
- **API Errors**: Specific messaging for data fetching problems
- **Render Errors**: Component-specific error handling

### Retry Functionality

All error boundaries include retry buttons that allow users to attempt recovery.

### Context-Aware Logging

Errors are logged with context information including:

- Error boundary type
- Component stack
- User agent
- Current URL
- Timestamp

## Best Practices

1. **Use the Right Boundary**: Choose the error boundary type that matches your component's primary function
2. **Granular Wrapping**: Wrap components at an appropriate level - not too high (breaks too much) or too low (too many boundaries)
3. **Combine with Loading States**: Error boundaries work best when combined with proper loading and empty states
4. **Test Error Scenarios**: Use the error boundaries to test how your app handles different failure modes

## Testing Error Boundaries

In development, you can test error boundaries by:

1. Throwing errors in components
2. Using React DevTools to trigger errors
3. Simulating network failures for API boundaries

Example test component:

```tsx
function ErrorTestComponent() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('Test error for error boundary')
  }

  return <button onClick={() => setShouldError(true)}>Trigger Error</button>
}
```

This comprehensive error boundary system ensures that the LifeDash application remains stable and user-friendly even when unexpected errors occur.
