# LifeDash - Claude Development Documentation

## Project Overview
LifeDash is a Norwegian investment portfolio management application built with Next.js, TypeScript, and Supabase. The application provides comprehensive portfolio tracking with real-time updates, charts, and transaction management.

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion
- **UI Components**: Custom component library with shadcn/ui patterns
- **State Management**: React hooks with custom portfolio state management

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage

### Key Features
- Portfolio management across multiple accounts and platforms
- Real-time stock price updates
- Interactive charts and analytics
- CSV import for transactions
- Mobile-responsive design
- Platform integrations (Nordnet, Schwab)

## Recent Development

### Stock Detail Modal Feature (Jan 2025)
Implemented comprehensive stock detail cards that open when clicking on stocks in the holdings table.

#### Components Added/Modified:

1. **StockDetailModal** (`components/stocks/stock-detail-modal.tsx`)
   - Main modal component with tabbed interface
   - Three tabs: Overview, Transactions, Performance
   - Responsive design (full screen on mobile, modal on desktop)
   - Loading states and error handling
   - Norwegian UI text

2. **HoldingsSection** (`components/portfolio/holdings-section.tsx`)
   - Added `onStockClick` prop for modal integration
   - Click handlers that avoid checkbox conflicts
   - Visual feedback on hover

3. **MobileHoldingsSection** (`components/mobile/mobile-holdings-section.tsx`)
   - Mobile-specific click handlers
   - SwipeableHoldingCard integration
   - Touch-friendly interactions

4. **Format Utilities** (`lib/utils/format.ts`)
   - Norwegian locale formatting functions
   - Currency, percentage, and number formatting
   - Market cap and volume formatters
   - Error handling and fallbacks

#### Data Flow:
```
HoldingsSection row click → handleStockClick → setSelectedStock → StockDetailModal
```

#### Type Definitions:
- Uses existing `HoldingWithMetrics` interface from portfolio state
- Compatible with real-time data updates
- Properly typed for Norwegian currency (NOK)

## Development Commands

### Testing
```bash
npm run build          # Build and check for errors
npm run lint           # Lint code
npm run type-check     # TypeScript checks
npm test               # Run tests
```

### Development
```bash
npm run dev            # Start development server
npm run format         # Format code with Prettier
```

## File Structure

```
/app/
  /investments/
    /stocks/
      page.tsx                 # Main stocks page
/components/
  /stocks/
    stock-detail-modal.tsx     # Stock detail modal
  /portfolio/
    holdings-section.tsx       # Holdings table
  /mobile/
    mobile-holdings-section.tsx # Mobile holdings
  /ui/                         # Reusable UI components
  /charts/                     # Chart components
/lib/
  /actions/
    /stocks/
      crud.ts                  # Stock data operations
  /hooks/
    use-portfolio-state.ts     # Portfolio state management
  /utils/
    format.ts                  # Formatting utilities
```

## Code Patterns

### Component Structure
- Use TypeScript interfaces for all props
- Implement loading states and error handling
- Follow responsive design patterns
- Use Norwegian text for user-facing content

### State Management
- Custom hooks for complex state logic
- Real-time updates via Supabase subscriptions
- Optimistic updates for better UX

### Styling
- Tailwind CSS for all styling
- Custom component variants using `cva`
- Mobile-first responsive design
- Consistent spacing and typography

## Integration Points

### Database Schema
- `holdings` table links portfolios to stocks
- `stocks` table contains stock metadata
- `transactions` table tracks all trading activity
- Real-time subscriptions for live data

### External APIs
- Yahoo Finance for stock prices (planned)
- TradingView for charts (planned)
- Platform APIs for data import

## Future Enhancements

### Planned Features
1. **TradingView Integration**: Interactive charts in stock detail modal
2. **Patreon News Feed**: Curated news from subscribed channels
3. **StockTwits Integration**: Social sentiment data
4. **Advanced Analytics**: More sophisticated P&L calculations
5. **Transaction History**: Complete transaction display with user context

### Technical Debt
- Transaction fetching needs user context implementation
- Holding period calculations need proper date handling
- Mobile layout optimizations for tablet sizes

## Performance Considerations
- Virtual scrolling for large holding lists
- Lazy loading of chart components
- Optimized re-renders with React.memo
- Smart caching of portfolio data

## Accessibility
- Proper ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly components
- Touch-friendly mobile interactions

## Localization
- Norwegian text throughout the application
- Proper currency formatting (NOK)
- Date formatting in Norwegian locale
- Number formatting with Norwegian thousands separators