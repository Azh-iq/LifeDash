# React Grid Layout Integration

## Overview

This document describes the integration of `react-grid-layout` with the existing WidgetGrid component, providing enhanced drag and resize capabilities while maintaining backward compatibility with the existing `@dnd-kit` system.

## Installation

```bash
npm install react-grid-layout
npm install @types/react-grid-layout
```

## Key Features

### 1. Enhanced WidgetGrid with Grid Layout
- **Drag and Drop**: Widgets can be dragged to reposition
- **Resize**: Widgets can be resized by dragging the corner handles
- **Responsive**: Grid adapts to different screen sizes
- **Breakpoint Support**: Different layouts for desktop, tablet, and mobile
- **Real-time Updates**: Layout changes trigger callbacks

### 2. Backward Compatibility
- **Classic Mode**: Original @dnd-kit implementation still available
- **Toggle Mode**: Users can switch between grid and classic layouts
- **API Compatibility**: All existing props and callbacks work unchanged

## Components

### WidgetGrid
Main component that supports both grid and classic layouts.

```typescript
interface WidgetGridProps {
  layoutId: string
  widgets: Widget[]
  onWidgetUpdate?: (widgets: Widget[]) => void
  onWidgetRemove?: (widgetId: string) => void
  onWidgetConfigure?: (widget: Widget) => void
  onAddWidget?: () => void
  className?: string
  isEditable?: boolean
  columns?: number
  gap?: 'sm' | 'md' | 'lg'
  maxWidgets?: number
  
  // New props for react-grid-layout
  useGridLayout?: boolean
  gridConfig?: Partial<GridLayoutConfig>
  onLayoutChange?: (layout: GridLayoutItem[], layouts: Record<string, GridLayoutItem[]>) => void
  enableResponsive?: boolean
  currentBreakpoint?: string
}
```

### EnhancedWidgetGrid
Pre-configured component with grid layout enabled by default.

```typescript
<EnhancedWidgetGrid
  layoutId="dashboard"
  widgets={widgets}
  onWidgetUpdate={handleUpdate}
  // ... other props
/>
```

### ClassicWidgetGrid
Pre-configured component with classic @dnd-kit layout.

```typescript
<ClassicWidgetGrid
  layoutId="dashboard"
  widgets={widgets}
  onWidgetUpdate={handleUpdate}
  // ... other props
/>
```

## Usage Examples

### Basic Usage
```typescript
import { EnhancedWidgetGrid } from './components/widgets/base/widget-grid'

function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: '1',
      type: 'HERO_PORTFOLIO_CHART',
      category: 'STOCKS',
      title: 'Portfolio Performance',
      size: 'HERO',
      position: { row: 0, column: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])

  const handleLayoutChange = (layout, layouts) => {
    console.log('Layout changed:', layout, layouts)
  }

  return (
    <EnhancedWidgetGrid
      layoutId="main-dashboard"
      widgets={widgets}
      onWidgetUpdate={setWidgets}
      onLayoutChange={handleLayoutChange}
    />
  )
}
```

### Custom Grid Configuration
```typescript
const customGridConfig = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 120,
  margin: [20, 20],
  containerPadding: [20, 20]
}

<WidgetGrid
  layoutId="custom-dashboard"
  widgets={widgets}
  useGridLayout={true}
  gridConfig={customGridConfig}
  onLayoutChange={handleLayoutChange}
/>
```

### Responsive Breakpoints
The grid automatically adapts to different screen sizes:

- **lg (≥1200px)**: 12 columns
- **md (≥996px)**: 8 columns  
- **sm (≥768px)**: 6 columns
- **xs (≥480px)**: 4 columns
- **xxs (<480px)**: 2 columns

## Widget Size Mappings

```typescript
const WIDGET_SIZE_MAPPINGS = {
  SMALL: { w: 1, h: 1 },   // 1x1 grid units
  MEDIUM: { w: 2, h: 2 },  // 2x2 grid units
  LARGE: { w: 3, h: 3 },   // 3x3 grid units
  HERO: { w: 4, h: 4 }     // 4x4 grid units
}
```

## Grid Layout Configuration

```typescript
const DEFAULT_GRID_CONFIG = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 100,
  margin: [16, 16],
  containerPadding: [16, 16],
  draggableHandle: '.widget-drag-handle',
  resizeHandle: '.widget-resize-handle',
  preventCollision: false
}
```

## Drag and Resize Handles

### Drag Handle
Widgets can be dragged by the drag handle (grip icon) in the widget header:
```typescript
<Button className="widget-drag-handle">
  <GripVertical className="h-3 w-3" />
</Button>
```

### Resize Handle
Widgets can be resized by dragging the corner handle (enabled in edit mode):
```typescript
<div className="widget-resize-handle">
  {/* Resize handle styling */}
</div>
```

## Features

### 1. Layout Mode Toggle
Users can switch between grid and classic layouts:
```typescript
const [layoutMode, setLayoutMode] = useState<'grid' | 'classic'>('grid')

const toggleLayoutMode = () => {
  setLayoutMode(prev => prev === 'grid' ? 'classic' : 'grid')
}
```

### 2. Responsive Breakpoint Indicator
Shows current breakpoint with device icons:
```typescript
const renderBreakpointIndicator = () => {
  const breakpointIcons = {
    lg: Monitor,
    md: Monitor,
    sm: Tablet,
    xs: Smartphone,
    xxs: Smartphone
  }
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
      <IconComponent className="h-4 w-4 text-gray-600" />
      <span className="text-xs text-gray-600">
        {currentBreakpoint.toUpperCase()}
      </span>
    </div>
  )
}
```

### 3. History Management
Supports undo/redo functionality:
```typescript
const [history, setHistory] = useState<Widget[][]>([])
const [historyIndex, setHistoryIndex] = useState(-1)

const handleUndo = () => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    onWidgetUpdate(history[newIndex])
  }
}
```

## Styling

### CSS Requirements
```css
/* Import required CSS files */
@import 'react-grid-layout/css/styles.css';
@import 'react-resizable/css/styles.css';
```

### Custom Styling
```css
.widget-drag-handle {
  cursor: grab;
}

.widget-drag-handle:active {
  cursor: grabbing;
}

.widget-resize-handle {
  cursor: se-resize;
}
```

## Performance Considerations

### 1. Memoization
```typescript
const gridLayout = useMemo(() => {
  const layouts: Record<string, GridLayoutItem[]> = {}
  Object.keys(mergedGridConfig.breakpoints).forEach(breakpoint => {
    layouts[breakpoint] = widgets.map(widgetToGridItem)
  })
  return layouts
}, [widgets, mergedGridConfig])
```

### 2. Callback Optimization
```typescript
const handleGridLayoutChange = useCallback((layout, layouts) => {
  // Optimized change handler
}, [widgets, isEditable, editMode, addToHistory, onWidgetUpdate])
```

## Testing

### Test Component
```typescript
import { EnhancedWidgetGrid } from './components/widgets/base/widget-grid'

function TestWidgetGrid() {
  const testWidgets = [
    {
      id: '1',
      type: 'HERO_PORTFOLIO_CHART',
      category: 'STOCKS',
      title: 'Portfolio Performance',
      size: 'HERO',
      position: { row: 0, column: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  return (
    <EnhancedWidgetGrid
      layoutId="test"
      widgets={testWidgets}
      onWidgetUpdate={console.log}
    />
  )
}
```

## Migration Guide

### From Classic to Enhanced
1. Replace `WidgetGrid` with `EnhancedWidgetGrid`
2. Add layout change handler if needed
3. Update CSS imports
4. Test responsive behavior

### Backward Compatibility
- All existing props work unchanged
- Classic mode available via `useGridLayout={false}`
- No breaking changes to existing APIs

## Troubleshooting

### Common Issues

1. **CSS not loading**: Ensure react-grid-layout CSS is imported
2. **Drag handle not working**: Check for correct className on drag handle
3. **Resize not working**: Verify edit mode is enabled
4. **Layout not saving**: Check if onLayoutChange callback is provided

### Debug Mode
```typescript
{process.env.NODE_ENV === 'development' && (
  <div className="debug-info">
    <div>Layout Mode: {layoutMode}</div>
    <div>Current Breakpoint: {currentBreakpoint}</div>
    <div>Grid Layout Enabled: {useGridLayout ? 'Yes' : 'No'}</div>
  </div>
)}
```

## Future Enhancements

1. **Persistence**: Save layouts to localStorage/database
2. **Templates**: Pre-defined layout templates
3. **Constraints**: Widget placement constraints
4. **Animations**: Smooth transitions during layout changes
5. **Touch Support**: Enhanced mobile touch interactions

## Files Modified

- `components/widgets/base/widget-grid.tsx` - Main grid component
- `components/widgets/base/widget-container.tsx` - Added drag handle class
- `components/widgets/base/simple-widget-types.ts` - Type definitions
- `components/widgets/base/widget-store.ts` - Updated imports
- `test-widget-grid.tsx` - Test component

## Dependencies

- `react-grid-layout` - Grid layout library
- `@types/react-grid-layout` - TypeScript definitions
- `@dnd-kit/core` - Drag and drop (classic mode)
- `@dnd-kit/sortable` - Sortable functionality (classic mode)
- `framer-motion` - Animations
- `react` - React framework
- `lucide-react` - Icons