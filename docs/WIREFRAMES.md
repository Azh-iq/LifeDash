# LifeDash Wireframes - Norwegian Investment Portfolio App

## 🎯 **CRITICAL: FINAL IMPLEMENTATION AUTHORITY**

**These wireframes are the DEFINITIVE specification for LifeDash implementation. All development MUST match these designs exactly.**

## Overview

This document contains the final wireframes for the LifeDash Norwegian investment portfolio management application. The wireframes are based on Frame0 design specifications and represent the exact user interface that must be implemented.

## 📋 **Final Wireframe Files (v2)**

Located in `/wireframes/` directory:

- **00-login-v2.html** - Login/registration page with sign up form
- **01-hovedside-v2.html** - Main dashboard with 2x2 grid layout
- **02-investeringer-v2.html** - Investments overview with breadcrumb navigation
- **03-aksjer-v2.html** - Stocks page with top menu and holdings table
- **04-aksjekort-v2.html** - Stock detail modal with tabs and breadcrumbs

## Design Requirements for Frame0

### Global Design Principles

- **Widget-centric layout**: All components are self-contained widgets
- **Chart-first approach**: Charts are primary focus, data tables secondary
- **Category theming**: Each investment type has unique color scheme
- **Desktop-optimized**: Rich data display with mobile responsive fallbacks
- **Norwegian localization**: All text in Norwegian

### Color Themes by Category

```
📈 Stocks: #6366f1 (Deep Amethyst)
₿ Crypto: #f59e0b (Bitcoin Gold)
🎨 Art: #ec4899 (Rose Pink)
📦 Other: #10b981 (Emerald Green)
```

### Widget Size Standards

- **Hero Widgets**: 400px height (main dashboard charts)
- **Large Widgets**: 300-350px height (category charts)
- **Medium Widgets**: 200-250px height (metrics)
- **Small Widgets**: 100-150px height (mini charts)

## Page Wireframes

### 1. Main Investment Dashboard

**Route**: `/investments`
**Purpose**: Overall portfolio overview with hero chart and category widgets

**Layout Structure**:

```
┌─ Sticky Navigation Bar (60px height) ────────────────────┐
├─ Hero Portfolio Chart Widget (400px height) ────────────┤
│  • Total portfolio value over time                       │
│  • Time range selector (1D, 1W, 1M, 3M, 1Y, ALL)       │
│  • Interactive hover with crosshair and tooltips        │
│  • Multi-category colored areas/lines                   │
├─ Category Performance Grid (4-column, 250px height) ────┤
│  [Stocks Widget] [Crypto Widget] [Art Widget] [Other]   │
│  Each with: Value, Change%, Mini-chart, Allocation      │
├─ Quick Actions Bar (80px height) ───────────────────────┤
│  [Import CSV] [Add Transaction] [Export Reports]        │
├─ Performance Metrics Row (120px height) ────────────────┤
│  [Today] [7D] [30D] [YTD] with trend arrows            │
└─ Recent Activity Feed Widget (300px height) ────────────┘
```

**Key Features**:

- Hero chart dominates top half of screen
- Category widgets use respective theme colors
- Real-time price updates with smooth animations
- Norwegian currency formatting (NOK)

### 2. Stocks Page (Aksjer)

**Route**: `/investments/stocks`
**Purpose**: Detailed stock portfolio management with purple theme
**Theme**: Deep Amethyst (#6366f1)

**Layout Structure**:

```
┌─ Enhanced Navigation + Portfolio Selector ───────────────┐
├─ Stock Portfolio Performance Chart (350px height) ──────┤
│  • Purple gradient theme (#6366f1)                      │
│  • Volume indicators below main chart                   │
│  • Technical indicators toggle (RSI, MACD)              │
│  • Time range selector                                  │
├─ Portfolio Summary Metrics (100px height) ──────────────┤
│  [Total Value] [Day Change] [Holdings Count] [Sectors] │
├─ Holdings Table Widget (400px+ height) ─────────────────┤
│  • Sortable columns with purple-themed headers          │
│  • In-cell micro-charts (50px width trend lines)       │
│  • Real-time price updates with color coding           │
│  • Expandable rows for detailed stock view             │
│  • Sector grouping with expand/collapse                │
├─ Advanced Filters Panel (collapsible) ──────────────────┤
│  • Search, sector, currency, value range filters       │
└─ AI Insights Panel (200px height) ──────────────────────┘
```

**Key Features**:

- Purple theme throughout (#6366f1 gradients)
- Rich data table with micro-charts in cells
- Technical indicators overlays
- Sector-based organization
- Real-time updates with smooth animations

### 3. Individual Stock Detail Modal

**Route**: Modal overlay from stocks page
**Purpose**: Deep dive stock analysis with advanced charts
**Theme**: Inherits from stocks purple theme

**Layout Structure**:

```
┌─ Stock Header Widget (80px height) ──────────────────────┐
│  Company Name, Ticker, Current Price, Change            │
├─ Advanced Chart Widget (450px height) ──────────────────┤
│  • Candlestick + Line chart toggle                      │
│  • Technical indicators sidebar (RSI, MACD, Bollinger) │
│  • Volume chart below main chart (synchronized)         │
│  • News events marked on timeline                       │
│  • Zoom and pan functionality                          │
├─ Key Metrics Grid (150px height) ───────────────────────┤
│  [P/E Ratio] [Market Cap] [Dividend] [Beta]            │
│  Each metric with small trend micro-chart              │
├─ Your Position Widget (120px height) ───────────────────┤
│  Shares Owned, Cost Basis, Current Value, P&L         │
├─ Transaction Timeline Widget (200px height) ────────────┤
│  Visual timeline with buy/sell markers                 │
└─ Related Stocks/Sector Performance (180px height) ─────┘
```

**Key Features**:

- Advanced charting with technical analysis
- Multiple chart types (candlestick, line, volume)
- Position tracking and P&L calculation
- Related stocks recommendations

### 4. Crypto Page (Krypto)

**Route**: `/investments/crypto`
**Purpose**: Cryptocurrency portfolio management
**Theme**: Bitcoin Gold (#f59e0b)

**Layout Structure**:

```
┌─ Crypto Navigation with DeFi Toggle ────────────────────┐
├─ Crypto Portfolio Chart (350px height) ────────────────┤
│  • Gold gradient theme (#f59e0b to #fbbf24)            │
│  • Market cap display                                  │
│  • BTC/ETH dominance indicators                        │
├─ Crypto Holdings Table (400px height) ─────────────────┤
│  • Coin logos and symbols                              │
│  • Staking rewards tracking                            │
│  • DeFi protocol integration                           │
├─ Market Heatmap Widget (250px height) ─────────────────┤
│  • Top cryptocurrencies by market cap                  │
│  • Color-coded performance                             │
└─ DeFi Tracker Widget (200px height) ───────────────────┘
```

### 5. Art Page (Kunst)

**Route**: `/investments/art`
**Purpose**: Art and collectibles tracking
**Theme**: Rose Pink (#ec4899)

**Layout Structure**:

```
┌─ Art Portfolio Navigation ───────────────────────────────┐
├─ Art Valuation Chart (350px height) ───────────────────┤
│  • Rose gradient theme (#ec4899 to #f472b6)            │
│  • Auction data integration                            │
│  • Trend analysis                                      │
├─ Art Collection Grid (300px height) ───────────────────┤
│  • Visual thumbnails of artworks                       │
│  • Valuation estimates                                 │
│  • Provenance tracking                                 │
└─ Market Analysis Widget (200px height) ────────────────┘
```

## Widget Component Specifications

### Base Widget Container

```
┌─ Widget Header ──────────────────────────────────────────┐
│  [Icon] Title                    [Refresh] [Export] [⋮] │
├─ Widget Content Area ───────────────────────────────────┤
│  Main content based on widget type                      │
│  - Charts: Recharts components                         │
│  - Tables: Enhanced data tables                        │
│  - Metrics: Number displays with trends               │
└─ Widget Footer (optional) ──────────────────────────────┘
```

### Interactive Elements

- **Time Range Buttons**: Styled tabs (1D, 1W, 1M, 3M, 1Y, ALL)
- **Dropdown Filters**: Category-themed dropdowns
- **Hover States**: Subtle elevation and border color changes
- **Loading States**: Skeleton screens with pulsing animation
- **Error States**: Retry buttons with error messages

## Technical Implementation Notes

### Responsive Breakpoints

- **Desktop (≥1024px)**: Full widget layout as described
- **Tablet (768-1023px)**: 2-column grid for category widgets
- **Mobile (<768px)**: Single column, stacked widgets

### Animation Specifications

- **Widget Entrance**: Staggered fade-in with slide-up (300ms)
- **Chart Animations**: Line drawing and value counting
- **Hover Effects**: 150ms ease-out transitions
- **Real-time Updates**: Smooth value changes without jarring

### Accessibility Requirements

- **Keyboard Navigation**: Tab order through all interactive elements
- **Screen Readers**: ARIA labels and semantic markup
- **Color Contrast**: WCAG AA compliance for all text
- **Focus Indicators**: Clear focus rings on all focusable elements

## Usage with Frame0

When using Frame0 MCP server to generate these wireframes:

1. **Reference this document** for layout specifications
2. **Use the color themes** specified for each category
3. **Include widget sizing** as specified (Hero: 400px, Large: 350px, etc.)
4. **Show interactive elements** like buttons, dropdowns, charts
5. **Indicate responsive behavior** where relevant
6. **Use Norwegian labels** for all UI text

## Next Steps

1. Generate wireframes using Frame0 MCP server
2. Review and iterate on layouts
3. Create detailed component specifications
4. Begin widget system implementation
