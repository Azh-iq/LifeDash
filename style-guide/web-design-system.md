# LifeDash Web Design System - Untitled UI + Financial Dashboard Integration

## Overview

LifeDash is now enhanced with professional UI kits - Untitled UI as the primary component library and Financial Dashboard UI Kit for specialized financial components. The system emphasizes four key life areas with distinct color-coded themes.

## UI Kit Integration

### Primary UI Kit: Untitled UI

- **10,000+ components** with Auto Layout 5.0 and smart variants
- **4,600+ icons** with 2px stroke weight for visual balance
- **WCAG accessibility** compliance built-in
- **Dark mode support** with powerful color variables
- **Component categories**: Buttons, inputs, avatars, modals, tables, alerts

### Secondary UI Kit: Financial Dashboard

- **Specialized financial components**: Charts, metrics cards, KPI displays
- **Data visualizations**: Pie charts, bar charts, line graphs, portfolio trackers
- **Financial UI patterns**: Transaction lists, account summaries, performance metrics
- **Responsive design** optimized for financial data presentation

## Widget-Based Color System - Investment Categories

### 📈 Stocks (Aksjer) - Deep Amethyst Theme

- **Primary**: #6366f1 (Deep Amethyst)
- **Secondary**: #a855f7 (Purple accent)
- **Light Background**: #f3f4ff (Light purple background)
- **Gradient**: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
- **Chart Gradient**: linear-gradient(to bottom, #6366f1/20 0%, #8b5cf6/5 100%)
- **Usage**: Stock portfolios, equity charts, stock analysis, holdings tables

### ₿ Crypto - Bitcoin Gold Theme

- **Primary**: #f59e0b (Bitcoin Gold)
- **Secondary**: #fbbf24 (Gold accent)
- **Light Background**: #fffbeb (Light amber background)
- **Gradient**: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)
- **Chart Gradient**: linear-gradient(to bottom, #f59e0b/20 0%, #fbbf24/5 100%)
- **Usage**: Cryptocurrency portfolios, crypto charts, DeFi tracking, coin metrics

### 🎨 Art (Kunst) - Rose Pink Theme

- **Primary**: #ec4899 (Rose Pink)
- **Secondary**: #f472b6 (Pink accent)
- **Light Background**: #fdf2f8 (Light pink background)
- **Gradient**: linear-gradient(135deg, #ec4899 0%, #f472b6 100%)
- **Chart Gradient**: linear-gradient(to bottom, #ec4899/20 0%, #f472b6/5 100%)
- **Usage**: Art investments, collectibles, valuation trends, auction data

### 📦 Other (Annet) - Emerald Green Theme

- **Primary**: #10b981 (Emerald Green)
- **Secondary**: #34d399 (Green accent)
- **Light Background**: #ecfdf5 (Light green background)
- **Gradient**: linear-gradient(135deg, #10b981 0%, #34d399 100%)
- **Chart Gradient**: linear-gradient(to bottom, #10b981/20 0%, #34d399/5 100%)
- **Usage**: Alternative investments, bonds, commodities, misc assets

### Neutral Foundation (Untitled UI Standard)

- **Gray-50**: #f9fafb (Light page backgrounds)
- **Gray-100**: #f3f4f6 (Card backgrounds)
- **Gray-200**: #e5e7eb (Borders and dividers)
- **Gray-500**: #6b7280 (Secondary text)
- **Gray-900**: #111827 (Primary text)

### Semantic Colors

- **Success**: #22c55e (Chart positive/bullish)
- **Error**: #ef4444 (Chart negative/bearish)
- **Warning**: #f59e0b (Chart neutral/amber)
- **Info**: #3b82f6 (Information and guidance)

## Widget System Specifications

### Widget Container Standards

#### Widget Sizes

- **Hero**: 400px height (main dashboard chart)
- **Large**: 300-350px height (category charts)
- **Medium**: 200-250px height (metrics widgets)
- **Small**: 100-150px height (mini charts)

#### Widget Structure

```typescript
interface WidgetProps {
  title: string
  category?: 'stocks' | 'crypto' | 'art' | 'other'
  size: 'hero' | 'large' | 'medium' | 'small'
  refreshable?: boolean
  exportable?: boolean
  loading?: boolean
  error?: string
}
```

#### Widget Styling Pattern

```css
.widget-base {
  @apply rounded-xl border bg-white shadow-sm;
  @apply transition-all duration-200;
  @apply hover:shadow-md;
}

.widget-hero {
  @apply min-h-[400px] p-6;
}

.widget-large {
  @apply min-h-[300px] p-4;
}

.widget-medium {
  @apply min-h-[200px] p-4;
}

.widget-small {
  @apply min-h-[100px] p-3;
}
```

### Chart Component Standards

#### Chart Color Mapping

- **Category Primary**: Use category primary color for main data lines
- **Category Secondary**: Use secondary color for supporting elements
- **Chart Gradient**: Use chart gradient for area fills
- **Success/Error**: Use semantic colors for positive/negative values

#### Chart Interaction Standards

- **Hover**: Show crosshair and tooltip with exact values
- **Time Range**: Include 1D, 1W, 1M, 3M, 1Y, ALL buttons
- **Zoom**: Enable zoom and pan for detailed analysis
- **Real-time**: Smooth animations for live data updates

### Data Display Standards

#### Norwegian Formatting

- **Currency**: NOK 123.456,78 (Norwegian number format)
- **Percentage**: +12,3% / -4,5% (Norwegian decimal comma)
- **Dates**: dd.mm.yyyy (Norwegian date format)
- **Large Numbers**: 1 234 567 (space thousands separator)

## Layout System

### Dashboard Grid

The main dashboard uses a 2x2 grid layout:

```
┌─────────────────┬─────────────────┐
│   Investments   │    Projects     │
│     (Green)     │    (Purple)     │
├─────────────────┼─────────────────┤
│     Hobby       │     Health      │
│   (Orange)      │     (Pink)      │
└─────────────────┴─────────────────┘
```

### Responsive Breakpoints

- **Desktop (≥1024px)**: 2x2 grid
- **Tablet (768-1023px)**: 2x1 grid (stacked pairs)
- **Mobile (<768px)**: Single column stack

### Navigation

- **Top Navigation**: Horizontal header with logo, search, and user menu
- **No Sidebar**: Removed collapsible sidebar in favor of clean top nav
- **No Bottom Nav**: Removed mobile bottom navigation

## Typography

### Font Stack

- **Primary**: Inter (UI text)
- **Monospace**: JetBrains Mono (numbers and data)
- **Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI

### Type Scale

- **Display Large**: 48px/56px, Bold (Hero metrics)
- **Display Medium**: 36px/44px, Bold (Section headers)
- **H1**: 32px/40px, Bold (Page titles)
- **H2**: 24px/32px, Semibold (Card titles)
- **H3**: 20px/28px, Semibold (Sub-headers)
- **Body**: 14px/20px, Regular (Standard text)
- **Caption**: 12px/16px, Regular (Supporting text)

## Component Specifications - Untitled UI Enhanced

### Life Area Cards (Enhanced with Financial Dashboard Patterns)

Each category card follows this enhanced structure:

- **Header**: Untitled UI icon + Category title + Performance indicator
- **Main Metric**: Large financial number (JetBrains Mono font)
- **Secondary Info**: Count, change percentage, trend arrow
- **Visual Element**: Category-specific gradient background
- **Interaction**: Hover effects with category color borders

### Card Specifications (Untitled UI Standard)

- **Size**: Minimum 320px width, 280px height (enhanced from 300x250)
- **Padding**: 24px all sides (Untitled UI spacing standard)
- **Border Radius**: 16px (modern rounded corners)
- **Background**: White (#ffffff) with subtle shadow
- **Border**: 1px solid Gray-200 (#e5e7eb), hover: category color
- **Shadow**: 0 1px 3px rgba(0, 0, 0, 0.08), hover: 0 4px 12px rgba(0, 0, 0, 0.12)
- **Hover Effects**:
  - Border transitions to category color
  - Subtle scale transform (1.02)
  - Enhanced shadow elevation

### Financial Components (From Financial Dashboard UI Kit)

- **Metric Cards**: KPI displays with large numbers and trend indicators
- **Chart Cards**: Integrated chart components with responsive design
- **Performance Cards**: Progress bars, percentage indicators, comparison metrics
- **Transaction Lists**: Formatted financial transaction displays
- **Portfolio Summaries**: Multi-metric dashboard cards with category breakdowns

### Interactive States

- **Default**: Gray border, white background
- **Hover**: Colored border, slight elevation
- **Active**: Colored background (light), colored border
- **Disabled**: 50% opacity, no interaction

## Spacing System

- **4px**: Micro spacing (tight elements)
- **8px**: Small spacing (related items)
- **16px**: Default spacing (standard gap)
- **24px**: Medium spacing (card padding)
- **32px**: Large spacing (section gaps)
- **48px**: Extra large spacing (major sections)

## Iconography - Untitled UI Icon System

### Icon Library Integration

- **Total Available**: 4,600+ essential UI icons from Untitled UI
- **Stroke Weight**: 2px (optimized for visual balance across sizes)
- **Styles**: Minimal line, duocolor, duotone, solid variants
- **Sizes**: 16px, 20px, 24px, 32px (responsive scaling)

### Category-Specific Icon Sets

Each life area uses dedicated Untitled UI icons:

#### 🔵 Investeringer (Investments)

- **Primary Icons**: trending-up, chart-line, dollar-sign, portfolio
- **Supporting Icons**: bar-chart, pie-chart, growth, calculator
- **Usage**: Financial displays, portfolio cards, investment metrics

#### 🟣 Hobby Prosjekter (Hobby Projects)

- **Primary Icons**: heart, star, bookmark, palette
- **Supporting Icons**: camera, music, paintbrush, creative tools
- **Usage**: Project cards, hobby tracking, creative workflows

#### 🟢 Økonomi (Economy)

- **Primary Icons**: credit-card, wallet, savings, bank
- **Supporting Icons**: receipt, coins, budget, financial-growth
- **Usage**: Budget tracking, expense management, savings goals

#### 🟠 Verktøy (Tools)

- **Primary Icons**: settings, wrench, grid, tool
- **Supporting Icons**: calculator, converter, utility, gear
- **Usage**: Utility pages, tools section, system settings

### Icon Implementation Guidelines

- **Color Application**: Use category colors for themed sections
- **Consistency**: Maintain 2px stroke weight across all icons
- **Accessibility**: Ensure sufficient contrast ratios
- **Responsive**: Scale appropriately for different screen sizes

## Animation & Motion

- **Micro-interactions**: 150ms ease-out
- **Card hovers**: 200ms ease-out
- **Page transitions**: 300ms ease-in-out
- **Number animations**: Count-up effects for metrics

## Accessibility

- **Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Focus**: Visible focus indicators on all interactive elements
- **Screen Readers**: Proper ARIA labels and semantic markup
- **Keyboard Navigation**: Full keyboard accessibility

## Usage Guidelines

### Do's

- Use life area colors consistently within their domains
- Maintain generous whitespace for readability
- Keep card content focused and scannable
- Use data visualization to enhance understanding

### Don'ts

- Don't mix life area colors across domains
- Don't overcrowd cards with too much information
- Don't use more than 3 colors in a single visualization
- Don't sacrifice accessibility for visual appeal

## Implementation Notes

- All components should be built with TypeScript
- Use Tailwind CSS classes based on the design tokens
- Implement responsive design mobile-first, then enhance for web
- Follow React best practices for component composition

## Migration from Previous Design

- Replace dark theme with light theme as default
- Update all color references to new palette
- Simplify navigation structure
- Redesign dashboard cards with new grid layout
- Update documentation and component library
