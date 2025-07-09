# Stock Card Widget Board Implementation Plan

## 🎯 Project Overview
Transform the stock detail modal into a customizable widget dashboard where users can add, remove, resize, and arrange widgets according to their preferences. This will provide a personalized investment analysis experience similar to Bloomberg Terminal or TradingView.

## 🏗️ Core Widget System Architecture

### 1. Base Widget Framework
- **WidgetContainer**: Base wrapper with drag-and-drop, resize, and theme support
- **WidgetGrid**: Grid layout system with responsive breakpoints
- **WidgetStore**: State management for widget positions and configurations
- **WidgetRegistry**: Central registry for all available widgets

### 2. Core Widget Library
- **StockChart**: Interactive price charts with technical indicators (RSI, MACD, Bollinger Bands)
- **NewsFeed**: Real-time news and market updates from Finnhub
- **TransactionsList**: User's transaction history for the stock
- **Fundamentals**: Key financial metrics (P/E, market cap, EPS, dividend yield)
- **Holdings**: Current positions across brokers (Nordnet, DNB, etc.)
- **Performance**: P&L analysis and performance metrics
- **Alerts**: Price alerts and notifications
- **SectorAnalysis**: Sector comparison and analysis
- **SocialSentiment**: Social media sentiment tracking
- **TechnicalIndicators**: Advanced technical analysis tools

### 3. Widget Configuration System
- **Widget Picker**: Modal for adding new widgets
- **Widget Settings**: Individual widget configuration panels
- **Layout Persistence**: Save user layouts to database
- **Default Layouts**: Pre-configured templates for different user types

## 📋 Implementation Phases

### Phase 1: Foundation (High Priority)
1. **Analyze existing widget architecture** - Study current patterns in /components/widgets/
2. **Create base widget system** - Grid layout with drag-and-drop using react-grid-layout
3. **Build core widget library** - Essential widgets (Chart, News, Transactions, Fundamentals)
4. **Integrate with Finnhub API** - Real data for all widgets

### Phase 2: User Experience (Medium Priority)
1. **Widget marketplace/selector** - User-friendly widget addition
2. **Resize and positioning system** - Flexible layout management
3. **Configuration system** - Widget settings and preferences
4. **Database persistence** - Save user layouts
5. **Mobile responsive design** - Touch-friendly mobile experience

### Phase 3: Advanced Features (Low Priority)
1. **Advanced widget features** - Alerts, portfolio tracking, sector analysis
2. **Consistent theming** - Apply stock category themes
3. **Comprehensive testing** - Bug fixes and performance optimization

## 🛠️ Technical Requirements

### Dependencies to Install
```bash
npm install react-grid-layout @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install zustand # For widget state management
npm install recharts # Enhanced chart widgets
npm install lucide-react # Icons for widgets
```

### Database Schema
```sql
-- Widget layouts table
CREATE TABLE widget_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stock_symbol VARCHAR(10),
  layout JSONB, -- Grid positions and sizes
  widgets JSONB, -- Widget configurations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Widget preferences table
CREATE TABLE widget_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  widget_type VARCHAR(50),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### File Structure
```
/components/widgets/
├── base/
│   ├── widget-container.tsx        # Base widget wrapper
│   ├── widget-grid.tsx            # Grid layout system
│   ├── widget-registry.tsx        # Widget catalog
│   └── widget-types.ts            # TypeScript interfaces
├── stock/
│   ├── stock-chart-widget.tsx     # Interactive price charts
│   ├── news-feed-widget.tsx       # Real-time news
│   ├── transactions-widget.tsx    # Transaction history
│   ├── fundamentals-widget.tsx    # Financial metrics
│   ├── holdings-widget.tsx        # Broker positions
│   ├── performance-widget.tsx     # P&L analysis
│   ├── alerts-widget.tsx          # Price alerts
│   └── sector-analysis-widget.tsx # Sector comparison
├── ui/
│   ├── widget-picker.tsx          # Add widgets modal
│   ├── widget-settings.tsx        # Widget configuration
│   ├── widget-toolbar.tsx         # Widget actions
│   └── widget-marketplace.tsx     # Widget library
├── hooks/
│   ├── use-widget-layout.ts       # Layout management
│   ├── use-widget-config.ts       # Configuration handling
│   └── use-widget-data.ts         # Data fetching
└── stores/
    ├── widget-store.ts             # Widget state management
    └── layout-store.ts             # Layout persistence
```

## 🎨 User Experience Flow

1. **Open Stock Modal**: Default widgets load based on user preferences
2. **Customize Layout**: Click "+" to add widgets from marketplace
3. **Drag & Drop**: Rearrange widgets on grid
4. **Resize Widgets**: Adjust widget sizes as needed
5. **Configure Widgets**: Access settings for each widget
6. **Save Layout**: Automatically persist user preferences

## 🔧 Development Commands

```bash
# Start development
npm run dev

# Build and test
npm run build
npm run lint
npm run type-check

# Database migrations
npx supabase migration new widget_layouts
npx supabase db push
```

## 📊 Success Metrics
- **User Engagement**: Time spent in stock modal increases
- **Customization Adoption**: % of users who customize layouts
- **Widget Usage**: Most popular widgets and configurations
- **Performance**: Load time and responsiveness benchmarks

## 🚀 Getting Started for Next Session

### Immediate Next Steps:
1. Run `npm install react-grid-layout @dnd-kit/core zustand`
2. Analyze existing widget architecture in `/components/widgets/`
3. Create base widget system with WidgetContainer and WidgetGrid
4. Build first core widget (StockChart)
5. Implement basic drag-and-drop functionality

### Key Files to Start With:
- `/components/widgets/base/widget-container.tsx`
- `/components/widgets/base/widget-grid.tsx`
- `/components/widgets/stock/stock-chart-widget.tsx`
- `/components/stocks/stock-detail-modal-v2.tsx` (to be replaced)

### Context from CLAUDE.md:
- Project uses Next.js 14 with App Router
- TypeScript with strict mode
- Tailwind CSS with shadcn/ui (New York style)
- Supabase for database and auth
- Finnhub API for stock data
- Norwegian localization required
- Category-specific theming (stocks: purple/indigo)

This widget board will transform the stock modal into a powerful, personalized investment analysis tool that adapts to each user's workflow and preferences.