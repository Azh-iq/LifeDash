# LifeDash Component Guidelines

## Button Components

### Primary Button
```tsx
<button className="btn-primary focus-ring">
  Sign In
</button>
```
- Height: 48px
- Background: `#4169E1` (secondary-blue)
- Text: White
- Radius: 12px
- Hover: 10% lighter
- Active: 10% darker

### Secondary Button
```tsx
<button className="btn-secondary focus-ring">
  Create Account
</button>
```
- Height: 48px
- Background: Transparent
- Border: 1.5px `#8B91A7` (secondary-gray)
- Hover: Background rgba(139, 145, 167, 0.1)

### Ghost Button
```tsx
<button className="btn-ghost focus-ring">
  Forgot Password?
</button>
```
- Height: 44px
- Background: None
- Text: `#4169E1` (secondary-blue)
- Hover: Background rgba(65, 105, 225, 0.08)

## Card Components

### Standard Card
```tsx
<div className="card">
  <h2 className="text-h2">Card Title</h2>
  <p className="text-body text-secondary-gray">Card content</p>
</div>
```
- Background: `#1A1D29` (background-secondary)
- Border: 1px solid rgba(139, 145, 167, 0.1)
- Radius: 16px
- Padding: 20px
- Hover: Border rgba(65, 105, 225, 0.3)

### Portfolio Card
```tsx
<div className="card">
  <h3 className="text-h3">Investments</h3>
  <div className="text-data-lg trend-positive">$45,250.30</div>
  <div className="text-data-sm trend-positive">+2.4%</div>
</div>
```
- Use monospace font for all numerical values
- Right-align numbers
- Color-code performance indicators

## Input Components

### Text Input
```tsx
<input 
  className="input-field focus-ring" 
  type="email" 
  placeholder="Email"
/>
```
- Height: 52px
- Background: `#242837` (background-tertiary)
- Border: 1px solid transparent
- Radius: 12px
- Focus: 2px `#4169E1` border

### Input with Label
```tsx
<div className="space-y-2">
  <label className="text-label text-secondary-gray">Email</label>
  <input className="input-field focus-ring" type="email" />
</div>
```

## Typography Components

### Display Text
```tsx
<h1 className="text-display-lg">$125,430.50</h1>
<h2 className="text-display-md">Portfolio Overview</h2>
```

### Data Display
```tsx
<div className="text-data-lg trend-positive">$45,250.30</div>
<div className="text-data-md font-mono">18.5 BTC</div>
<div className="text-data-sm font-mono">+2.4%</div>
```

### Body Text
```tsx
<p className="text-body-lg">Primary content and descriptions</p>
<p className="text-body">Standard UI text</p>
<p className="text-body-sm text-secondary-gray">Supporting text</p>
```

## Navigation Components

### Bottom Tab Bar (Mobile)
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-secondary-gray/10">
  <div className="flex justify-around py-2">
    <button className="flex flex-col items-center p-2 text-secondary-blue">
      <Icon className="w-6 h-6" />
      <span className="text-caption">Home</span>
    </button>
  </div>
</nav>
```

### Side Navigation (Desktop)
```tsx
<nav className="w-64 bg-background-secondary border-r border-secondary-gray/10">
  <div className="p-4 space-y-2">
    <a href="#" className="flex items-center p-3 text-primary-light hover:bg-secondary-blue/10 rounded-sm">
      <Icon className="w-5 h-5 mr-3" />
      <span className="text-body">Dashboard</span>
    </a>
  </div>
</nav>
```

## Loading & Animation Components

### Skeleton Loading
```tsx
<div className="animate-shimmer bg-background-tertiary h-4 rounded-sm"></div>
```

### Floating Animation
```tsx
<div className="animate-float">
  <Icon className="w-8 h-8 text-secondary-blue" />
</div>
```

### Staggered List Animation
```tsx
<div className="space-y-4">
  {items.map((item, index) => (
    <div 
      key={item.id}
      className="card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {item.content}
    </div>
  ))}
</div>
```

## Chart Components

### Performance Chart
```tsx
<div className="chart-container">
  <svg className="w-full h-64">
    <g className="chart-grid">
      {/* Grid lines */}
    </g>
    <path className="stroke-secondary-blue stroke-2 fill-none" />
  </svg>
</div>
```

### Trend Indicators
```tsx
<div className="flex items-center space-x-2">
  <span className="text-data-md font-mono">$45,250.30</span>
  <span className="text-data-sm trend-positive">+2.4%</span>
  <TrendUpIcon className="w-4 h-4 text-accent-green" />
</div>
```

## Form Components

### Login Form
```tsx
<form className="space-y-4">
  <div>
    <label className="text-label text-secondary-gray">Email</label>
    <input className="input-field focus-ring w-full" type="email" />
  </div>
  <div>
    <label className="text-label text-secondary-gray">Password</label>
    <input className="input-field focus-ring w-full" type="password" />
  </div>
  <button className="btn-primary w-full">Sign In</button>
</form>
```

### Search Input
```tsx
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-gray" />
  <input 
    className="input-field focus-ring pl-10 w-full" 
    placeholder="Search stocks..."
  />
</div>
```

## Modal Components

### Modal Overlay
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
  <div className="bg-background-secondary rounded-md p-6 max-w-md w-full">
    <h2 className="text-h2 mb-4">Modal Title</h2>
    <p className="text-body text-secondary-gray mb-6">Modal content</p>
    <div className="flex justify-end space-x-3">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

## State Components

### Success State
```tsx
<div className="text-center p-6">
  <CheckCircleIcon className="w-16 h-16 text-accent-green mx-auto mb-4" />
  <h3 className="text-h3 mb-2">Success!</h3>
  <p className="text-body text-secondary-gray">Account created successfully</p>
</div>
```

### Error State
```tsx
<div className="text-center p-6">
  <XCircleIcon className="w-16 h-16 text-accent-red mx-auto mb-4" />
  <h3 className="text-h3 mb-2">Error</h3>
  <p className="text-body text-secondary-gray">Something went wrong</p>
</div>
```

### Empty State
```tsx
<div className="text-center p-12">
  <div className="w-24 h-24 bg-secondary-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
    <Icon className="w-12 h-12 text-secondary-gray" />
  </div>
  <h3 className="text-h3 mb-2">No data available</h3>
  <p className="text-body text-secondary-gray mb-6">Get started by adding your first investment</p>
  <button className="btn-primary">Add Investment</button>
</div>
```

## Accessibility Guidelines

### Focus Management
- All interactive elements must have focus states
- Use `focus-ring` utility class
- Ensure keyboard navigation works properly

### Color Contrast
- Verify 4.5:1 contrast ratio for normal text
- Verify 3:1 contrast ratio for large text
- Never rely solely on color to convey information

### Touch Targets
- Minimum 44px touch target size
- Ensure adequate spacing between interactive elements
- Optimize for thumb navigation on mobile

## Animation Guidelines

### Timing Functions
- Micro-interactions: 150ms with `ease-responsive`
- State transitions: 200ms with `ease-smooth`
- Data updates: 300ms with `ease-smooth`
- Page transitions: 350ms with `ease-smooth`

### Animation Types
- Hover states: Instant feedback
- Button presses: Subtle scale/color change
- Modal appearance: Fade + scale from 0.95 to 1.0
- List items: Stagger with 50ms delay
- Number changes: Count animation over 1 second