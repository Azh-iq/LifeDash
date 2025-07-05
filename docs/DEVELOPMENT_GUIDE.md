# LifeDash Development Guide

## Quick Start

### Prerequisites

- Node.js 20+ LTS
- npm or yarn package manager
- Git for version control
- Supabase account (free tier)
- Code editor (VS Code recommended)

### Development Setup

1. **Clone Repository**

   ```bash
   git clone https://github.com/Azh-iq/LifeDash.git
   cd LifeDash
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Database Setup**

   ```bash
   # Run all migrations
   npx supabase db push --linked

   # Generate TypeScript types
   npm run generate-types
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

6. **Open Application**
   Navigate to `http://localhost:3000`

## Development Workflow

### Before You Start

**MANDATORY CHECKS** - Always consult these documents before implementing:

1. **Feature Requirements**: Check `docs/FEATURE_SPECIFICATION.md`
2. **Technical Alignment**: Review `docs/PROJECT_SPECIFICATION.md`
3. **Architecture Compliance**: Verify `docs/ARCHITECTURE.md`
4. **Design System**: Follow `/style-guide/style-guide.md`

### Development Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Check Feature Specifications**
   - Review user stories in `docs/FEATURE_SPECIFICATION.md`
   - Identify UX/UI requirements
   - Plan mobile-first implementation

3. **Implement Feature**
   - Follow TypeScript strict mode
   - Use LifeDash design system colors/typography
   - Implement 44px minimum touch targets
   - Add proper loading states and error handling

4. **Test Implementation**

   ```bash
   # Type checking
   npm run type-check

   # Linting
   npm run lint

   # Build verification
   npm run build
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: implement feature following LifeDash specs"
   ```

## Project Structure

```
LifeDash/
├── docs/                          # 📋 Project documentation
│   ├── PROJECT_SPECIFICATION.md   # Complete technical spec
│   ├── ARCHITECTURE.md            # System architecture
│   ├── FEATURE_SPECIFICATION.md   # Feature requirements & UX
│   └── DEVELOPMENT_GUIDE.md       # This file
├── style-guide/                   # 🎨 Design system
│   └── style-guide.md            # Complete design specification
├── app/                           # 🚀 NextJS App Router
│   ├── (auth)/                   # Authentication pages
│   ├── (dashboard)/              # Main application
│   └── api/                      # API routes/webhooks
├── components/                    # 🧩 React components
│   ├── ui/                       # Base design system components
│   ├── features/                 # Feature-specific components
│   ├── layouts/                  # Page layouts
│   └── shared/                   # Shared utility components
├── lib/                          # 🛠️ Utilities and configuration
│   ├── actions/                  # Server Actions (API layer)
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript definitions
│   ├── utils/                    # Utility functions
│   └── supabase/                 # Database configuration
├── supabase/                     # 🗄️ Database schema
│   ├── migrations/               # Database migrations
│   └── seed.sql                  # Test data
└── .claude/                      # 🤖 AI assistant configuration
    ├── rules.md                  # Development rules & LifeDash context
    └── examples/                 # Code pattern examples
```

## Key Development Principles

### 1. LifeDash-First Development

**Always prioritize LifeDash vision:**

- This is a comprehensive life management system, not just investment tracking
- MVP focuses on stocks, but architecture supports future expansion
- Mobile-first design with 44px minimum touch targets
- "Bold Simplicity" in all UX decisions

### 2. Feature Specification Compliance

**Every feature must align with specifications:**

- User stories define the "why"
- UX considerations define the "how"
- Technical requirements define the "what"
- Mobile workflows are primary, desktop is enhancement

### 3. Mobile-First Implementation

**Touch-optimized experience:**

```typescript
// Example: Proper touch target sizing
<button className="min-h-[44px] min-w-[44px] p-3 touch-manipulation">
  Action
</button>

// Example: Swipe gesture support
const handlers = useSwipeGesture({
  onSwipeLeft: () => navigate('next'),
  onSwipeRight: () => navigate('previous'),
});
```

### 4. Real-Time by Default

**Implement live updates where expected:**

```typescript
// Example: Real-time portfolio updates
const { portfolio } = usePortfolioRealtime(portfolioId)

// Example: Live price updates
const { prices } = useStockPricesRealtime(symbols)
```

## Component Development

### Design System Usage

**Colors (from LifeDash specification):**

```typescript
// Primary colors
'bg-primary-dark' // #1A1D29
'bg-primary-light' // #FFFFFF

// Secondary colors
'bg-secondary-blue' // #4169E1
'text-secondary-gray' // #8B91A7

// Accent colors
'text-accent-green' // #00C853 (gains)
'text-accent-red' // #F44336 (losses)
'text-accent-amber' // #FFA726 (warnings)

// Background hierarchy
'bg-background-primary' // #0F1115 (main app)
'bg-background-secondary' // #1A1D29 (cards in dark mode)
'bg-background-tertiary' // #242837 (elevated surfaces)
```

**Typography (Inter + JetBrains Mono):**

```typescript
// UI text (Inter)
'font-sans text-body' // 14px/20px Regular
'font-sans text-body-lg' // 16px/24px Regular
'font-sans text-h1' // 32px/40px Bold
'font-sans text-h2' // 24px/32px Semibold

// Data/numbers (JetBrains Mono)
'font-mono text-data-lg' // 24px/28px Medium
'font-mono text-data-medium' // 18px/24px Regular
'font-mono text-data-small' // 14px/18px Regular
```

**Animations (consistent timing):**

```typescript
// Micro-interactions (150ms)
'transition-all duration-150 ease-responsive'

// State transitions (200ms)
'transition-colors duration-200 ease-smooth'

// Data updates (300ms)
'transition-transform duration-300 ease-smooth'
```

### Component Examples

**Button Component:**

```typescript
// Follow LifeDash button specifications
<Button
  variant="primary"          // #4169E1 background
  size="medium"              // 48px height
  className="min-h-[44px]"   // Touch target compliance
>
  Create Portfolio
</Button>
```

**Financial Data Display:**

```typescript
// NOK amounts first, percentage in parentheses
<div className="font-mono text-data-medium">
  <span className="text-accent-green">+1,250 NOK</span>
  <span className="text-secondary-gray ml-1">(+3.2%)</span>
</div>
```

**Mobile-Optimized Cards:**

```typescript
<Card className="p-4 touch-manipulation hover:border-secondary-blue/30">
  <h3 className="text-h3 mb-2">{portfolio.name}</h3>
  <div className="font-mono text-data-lg">
    {formatCurrency(portfolio.totalValue, 'NOK')}
  </div>
</Card>
```

## Database Development

### Schema Management

**Migration workflow:**

```bash
# Create new migration
npx supabase migration new feature_name

# Apply migrations
npx supabase db push --linked

# Generate types after schema changes
npm run generate-types
```

**RLS Policy Pattern:**

```sql
-- All user data must be isolated
CREATE POLICY "Users can access own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

### Server Actions (API Layer)

**Type-safe API pattern:**

```typescript
'use server'

export async function createPortfolio(data: CreatePortfolioInput) {
  // 1. Validate input
  const validated = portfolioSchema.parse(data)

  // 2. Check authentication
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // 3. Database operation with RLS
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error('Failed to create portfolio')

  // 4. Revalidate cache
  revalidatePath('/portfolios')

  return portfolio
}
```

### Real-Time Subscriptions

**Live data updates:**

```typescript
export function usePortfolioRealtime(portfolioId: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  useEffect(() => {
    const subscription = supabase
      .channel(`portfolio:${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `id=eq.${portfolioId}`,
        },
        payload => {
          setPortfolio(payload.new as Portfolio)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [portfolioId])

  return portfolio
}
```

## Testing Guidelines

### Component Testing

**Focus on user interactions:**

```typescript
// Test user workflows, not implementation details
test('user can create portfolio with valid data', async () => {
  render(<PortfolioForm />);

  await user.type(screen.getByLabelText(/portfolio name/i), 'My Portfolio');
  await user.selectOptions(screen.getByLabelText(/type/i), 'INVESTMENT');
  await user.click(screen.getByRole('button', { name: /create/i }));

  expect(screen.getByText(/portfolio created/i)).toBeInTheDocument();
});
```

### Mobile Testing

**Touch interaction testing:**

```typescript
// Test minimum touch target sizes
test('buttons meet 44px minimum touch target', () => {
  render(<Button>Test</Button>);
  const button = screen.getByRole('button');

  const styles = getComputedStyle(button);
  expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
  expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
});
```

## Performance Guidelines

### Loading States

**Always implement loading states:**

```typescript
// Skeleton loading for data-heavy components
{loading ? (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-secondary-gray/20 rounded w-3/4 mb-2" />
        <div className="h-6 bg-secondary-gray/20 rounded w-1/2" />
      </div>
    ))}
  </div>
) : (
  <DataComponent data={data} />
)}
```

### Caching Strategy

**Smart data fetching:**

```typescript
// Use React Query or SWR for client-side caching
const { data: portfolio, isLoading } = useSWR(
  `/api/portfolios/${portfolioId}`,
  fetcher,
  {
    refreshInterval: 15000, // 15 second refresh for price data
    revalidateOnFocus: true,
  }
)
```

## Common Patterns

### Error Handling

**Graceful error boundaries:**

```typescript
// Component-level error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <PortfolioSection />
</ErrorBoundary>

// Form validation with user feedback
const { errors } = useForm({
  resolver: zodResolver(portfolioSchema),
});

{errors.name && (
  <p className="text-accent-red text-sm mt-1">{errors.name.message}</p>
)}
```

### State Management

**Local state for UI, server state for data:**

```typescript
// UI state
const [isExpanded, setIsExpanded] = useState(false)

// Server state with real-time updates
const { portfolio } = usePortfolioRealtime(portfolioId)

// URL state for shareable views
const searchParams = useSearchParams()
const timeframe = searchParams.get('timeframe') || '1D'
```

## Deployment

### Pre-deployment Checklist

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Build verification
npm run build

# 4. Database migrations
npx supabase db push --linked

# 5. Environment variables verification
# Ensure all required env vars are set in production
```

### Production Considerations

**Performance optimization:**

- Enable Next.js optimizations in production
- Use Vercel Analytics for monitoring
- Implement proper error tracking with Sentry
- Set up health checks for external APIs

**Security checklist:**

- Verify RLS policies are enabled
- Check CORS configuration
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting

## Troubleshooting

### Common Issues

**TypeScript Errors:**

```bash
# Regenerate database types
npm run generate-types

# Clear Next.js cache
rm -rf .next/
npm run dev
```

**Supabase Connection Issues:**

```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Test connection
npx supabase status --linked
```

**Build Errors:**

```bash
# Clear all caches
rm -rf .next/ node_modules/
npm install
npm run build
```

### Getting Help

1. **Check documentation** in `docs/` folder
2. **Review feature specifications** for requirements
3. **Check design system** for UI guidelines
4. **Use TypeScript errors** as guidance
5. **Test on mobile devices** early and often

## Contributing

### Code Review Checklist

- [ ] Feature aligns with `docs/FEATURE_SPECIFICATION.md`
- [ ] Design follows LifeDash design system
- [ ] Mobile-first implementation with 44px touch targets
- [ ] Proper loading states and error handling
- [ ] TypeScript strict compliance
- [ ] Real-time updates where expected
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance considerations addressed

### Commit Message Format

```
feat: add portfolio performance comparison with benchmarks

- Implement time period toggle (Daily, Weekly, Monthly, YTD)
- Add market comparison cards for SPY, NASDAQ, OSEBX
- Display NOK amounts first with percentage in parentheses
- Ensure consistent time context across all metrics

Follows Feature Specification for Stock Investment Tracking
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Living Document - Updated as development practices evolve
