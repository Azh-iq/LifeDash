# LifeDash Main Investment Dashboard - Detailed Wireframe Specifications

## Overview

This document provides comprehensive specifications for the LifeDash Main Investment Dashboard wireframe, designed for desktop-optimized viewing (1200px+ width) with a widget-based architecture and category-specific theming.

## Layout Structure

### 1. Sticky Navigation Bar (60px height)

**Position**: Fixed at top of viewport
**Background**: White (#ffffff)
**Border**: 1px solid #e5e7eb

**Components**:

- **Logo**: "LifeDash" (20px, bold, #1f2937)
- **Navigation Items**: Dashboard, Aksjer, Krypto, Kunst, Andre
  - Active state: #6366f1 color, bold weight
  - Hover state: Background #f0f9ff
- **User Avatar**: Circular, 40px diameter, #6366f1 background
  - Displays user initials (e.g., "AH")
  - White text, 12px font size

### 2. Hero Portfolio Chart Widget (400px height)

**Position**: Below navigation, 20px margin
**Background**: White (#ffffff)
**Border**: 1px solid #e5e7eb, 8px border radius
**Shadow**: 0 1px 3px rgba(0, 0, 0, 0.1)

**Components**:

- **Widget Header**:
  - Title: "Total Porteføljesverdi" (18px, bold)
  - Value: "2,450,000 NOK" (24px, bold, right-aligned)
  - Change: "+24,500 NOK (+1.01%)" (14px, #10b981, right-aligned)

- **Chart Area** (250px height):
  - Background: #f8fafc
  - Border: 1px solid #e5e7eb
  - Mock multi-line chart with category colors:
    - Stocks: #6366f1 (primary line, 3px width)
    - Crypto: #f59e0b (secondary line, 2px width)
    - Art: #ec4899 (secondary line, 2px width)
    - Other: #10b981 (secondary line, 2px width)

- **Time Range Selector**:
  - Buttons: 1D, 1W, 1M, 3M, 1Y, ALL
  - Active state: #6366f1 background, white text
  - Inactive state: #f3f4f6 background, #374151 text
  - Button size: 50px width, 25px height, 4px border radius

### 3. Category Performance Grid (4-column, 250px height)

**Layout**: CSS Grid with 4 equal columns, 20px gap
**Position**: Below hero chart, 20px margin

#### 3.1 Stocks Widget (Deep Amethyst Theme)

- **Theme Color**: #6366f1
- **Accent Bar**: 4px height, full width at top
- **Title**: "📈 Aksjer" (16px, bold)
- **Allocation**: "60%" (14px, #6b7280, right-aligned)
- **Value**: "1,470,000 NOK" (18px, bold)
- **Change**: "+18,500 NOK (+1.27%)" (12px, #10b981)
- **Mini Chart**: 80px height, #f8fafc background, theme-colored trend line

#### 3.2 Crypto Widget (Bitcoin Gold Theme)

- **Theme Color**: #f59e0b
- **Title**: "₿ Krypto"
- **Allocation**: "25%"
- **Value**: "612,500 NOK"
- **Change**: "+4,200 NOK (+0.69%)"
- **Mini Chart**: Theme-colored trend line

#### 3.3 Art Widget (Rose Pink Theme)

- **Theme Color**: #ec4899
- **Title**: "🎨 Kunst"
- **Allocation**: "10%"
- **Value**: "245,000 NOK"
- **Change**: "+1,200 NOK (+0.49%)"
- **Mini Chart**: Theme-colored trend line

#### 3.4 Other Widget (Emerald Green Theme)

- **Theme Color**: #10b981
- **Title**: "📦 Andre"
- **Allocation**: "5%"
- **Value**: "122,500 NOK"
- **Change**: "+600 NOK (+0.49%)"
- **Mini Chart**: Theme-colored trend line

### 4. Quick Actions Bar (80px height)

**Background**: #f9fafb
**Border**: 1px solid #e5e7eb, 8px border radius
**Layout**: Flexbox, center-aligned, 20px gap

**Buttons**:

- **Primary Button**: "📤 Importer CSV"
  - Background: #6366f1
  - Text: White
  - Size: 180px width, 40px height
  - Border radius: 6px

- **Secondary Buttons**: "➕ Legg til Transaksjon", "📥 Eksporter Rapport"
  - Background: White
  - Text: #6366f1
  - Border: 1px solid #6366f1
  - Size: 180px width, 40px height
  - Border radius: 6px

**Hover Effects**:

- Transform: translateY(-1px)
- Box shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)

### 5. Performance Metrics Row (120px height)

**Background**: White (#ffffff)
**Border**: 1px solid #e5e7eb, 8px border radius
**Layout**: CSS Grid, 4 equal columns, 20px gap
**Padding**: 20px

**Metrics**:

1. **I dag**: +24,500 NOK (+1.01% ↗)
2. **7 dager**: +67,800 NOK (+2.84% ↗)
3. **30 dager**: +156,300 NOK (+6.81% ↗)
4. **Hittil i år**: +289,400 NOK (+13.38% ↗)

**Styling**:

- Label: 14px, #6b7280
- Value: 18px, bold, #1f2937
- Change: 14px, #10b981 (green for positive)
- Trend arrow: 12px, included in change text

### 6. Recent Activity Feed Widget (300px height)

**Background**: White (#ffffff)
**Border**: 1px solid #e5e7eb, 8px border radius
**Padding**: 20px

**Header**:

- Title: "Nylige Aktiviteter" (18px, bold)

**Activity Items**:
Each activity item includes:

- **Indicator Circle**: 12px diameter, color-coded by type
  - Buy: #10b981 (green)
  - Sell: #ef4444 (red)
  - Dividend: #6366f1 (blue)
  - Crypto: #f59e0b (orange)
- **Activity Content**:
  - Title: Transaction type + symbol (14px, bold)
  - Amount: NOK value (12px, #6b7280)
- **Timestamp**: Right-aligned (12px, #9ca3af)

**Sample Activities**:

1. KJØP AAPL - 25,000 NOK (2 timer siden)
2. SALG TSLA - 18,500 NOK (5 timer siden)
3. UTBYTTE MSFT - 1,200 NOK (1 dag siden)
4. KJØP BTC - 50,000 NOK (3 dager siden)

**Footer**:

- "Se alle aktiviteter →" link (14px, #6366f1, center-aligned)

## Interactive Elements

### Hover States

- **Widgets**: Subtle elevation with box shadow
- **Buttons**: Slight upward transform (-1px) with enhanced shadow
- **Navigation**: Background color change to #f0f9ff
- **Links**: Underline decoration

### Loading States

- **Skeleton screens**: Pulsing animation placeholders
- **Chart areas**: Shimmer effect during data loading
- **Buttons**: Disabled state with reduced opacity

### Responsive Behavior

- **Desktop (≥1200px)**: Full layout as specified
- **Large Tablet (1024-1199px)**: Maintain 4-column grid, reduce margins
- **Medium Tablet (768-1023px)**: 2-column grid for category widgets
- **Mobile (<768px)**: Single column, stacked layout

## Color Palette

### Primary Colors

- **Background**: #f8fafc (page background)
- **White**: #ffffff (widget backgrounds)
- **Border**: #e5e7eb (subtle borders)
- **Text Primary**: #1f2937 (headings, values)
- **Text Secondary**: #6b7280 (labels, descriptions)
- **Text Tertiary**: #9ca3af (timestamps, metadata)

### Category Theme Colors

- **Stocks**: #6366f1 (Deep Amethyst)
- **Crypto**: #f59e0b (Bitcoin Gold)
- **Art**: #ec4899 (Rose Pink)
- **Other**: #10b981 (Emerald Green)

### Status Colors

- **Positive**: #10b981 (green for gains)
- **Negative**: #ef4444 (red for losses)
- **Neutral**: #6b7280 (gray for neutral states)

## Typography

### Font Family

- Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Fallback: System font stack for optimal performance

### Font Sizes

- **Large Headers**: 24px (hero values)
- **Headers**: 18px (widget titles)
- **Subheaders**: 16px (category titles)
- **Body**: 14px (labels, buttons)
- **Small**: 12px (metadata, timestamps)

### Font Weights

- **Bold**: 600-700 (headers, values)
- **Medium**: 500 (button text)
- **Regular**: 400 (body text)

## Accessibility Features

### Keyboard Navigation

- **Tab Order**: Logical flow through interactive elements
- **Focus Indicators**: Clear visual focus rings
- **Skip Links**: For screen reader navigation

### Screen Reader Support

- **ARIA Labels**: Descriptive labels for all interactive elements
- **Semantic HTML**: Proper heading hierarchy and landmark roles
- **Alt Text**: Descriptive text for all visual elements

### Color Contrast

- **WCAG AA Compliance**: Minimum 4.5:1 contrast ratio
- **Text on Background**: High contrast for readability
- **Interactive Elements**: Clear visual states

## Animation Specifications

### Entrance Animations

- **Widget Stagger**: 100ms delay between widgets
- **Fade In**: 300ms ease-out transition
- **Slide Up**: 20px vertical offset with opacity

### Micro-Interactions

- **Button Hover**: 150ms ease-out transform
- **Chart Drawing**: 800ms ease-in-out line animation
- **Value Counting**: 600ms number increment animation

### Loading States

- **Skeleton Pulse**: 1.5s ease-in-out infinite
- **Shimmer Effect**: 2s linear infinite for chart areas
- **Spinner**: 1s linear infinite rotation

## Implementation Notes

### CSS Framework

- **Tailwind CSS**: Primary styling framework
- **Custom Properties**: CSS variables for theme colors
- **Grid System**: CSS Grid for complex layouts
- **Flexbox**: For component alignment

### Component Architecture

- **Widget Base**: Reusable widget container component
- **Chart Components**: Recharts or similar library
- **Button System**: Consistent button variants
- **Icon Library**: Heroicons or Lucide React

### Data Integration

- **Real-time Updates**: WebSocket or polling for live data
- **Currency Formatting**: Norwegian locale (NOK)
- **Date Formatting**: Norwegian date format
- **Number Formatting**: Proper thousands separators

### Performance Optimization

- **Virtual Scrolling**: For large transaction lists
- **Lazy Loading**: For chart components
- **Memoization**: React.memo for expensive components
- **Bundle Splitting**: Code splitting for better loading

## File Structure

```
/components/
  /dashboard/
    dashboard-layout.tsx
    hero-chart.tsx
    category-grid.tsx
    category-widget.tsx
    quick-actions.tsx
    performance-metrics.tsx
    recent-activity.tsx
  /ui/
    button.tsx
    widget-container.tsx
    chart-container.tsx
```

This wireframe specification provides a comprehensive foundation for implementing the LifeDash Main Investment Dashboard with all interactive elements, styling details, and technical considerations clearly defined.
