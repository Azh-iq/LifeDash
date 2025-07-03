# LifeDash Style Guide Rules

**CRITICAL: Always consult `/style-guide/style-guide.md` before making any UI/UX design decisions.**

## Design System Requirements

### Color Usage

- **Primary Colors**: Use `#1A1D29` (primary-dark) for main backgrounds, `#FFFFFF` (primary-light) for cards and contrast
- **Secondary Colors**: Use `#4169E1` (secondary-blue) for primary actions, `#8B91A7` (secondary-gray) for secondary text
- **Accent Colors**:
  - Green `#00C853` for gains/success
  - Red `#F44336` for losses/alerts
  - Amber `#FFA726` for warnings
  - Purple `#7C4DFF` for premium features
- **Backgrounds**:
  - Primary: `#0F1115` (near-black)
  - Secondary: `#1A1D29` (dark charcoal for cards)
  - Tertiary: `#242837` (elevated surfaces)

### Typography Rules

- **Primary Font**: Inter for all UI text
- **Monospace Font**: JetBrains Mono for all numerical values and data
- **Display Text**: 48px/36px for hero numbers and major values
- **Data Text**: Always right-align numbers for easy scanning
- **Headers**: Follow strict hierarchy (H1: 32px, H2: 24px, H3: 20px)

### Component Standards

- **Buttons**:
  - Primary: 48px height, 12px radius, secondary-blue background
  - Secondary: 48px height, 1.5px border, transparent background
  - Ghost: 44px height, no border, hover background appears
- **Cards**: 16px radius, 20px padding, subtle border (not shadows)
- **Input Fields**: 52px height, 12px radius, focus with blue border
- **Icons**: 24px navigation, 20px actions, 16px status

### Animation Guidelines

- **Micro-interactions**: 150ms with responsive curve
- **State Transitions**: 200ms with smooth curve
- **Data Updates**: 300ms with smooth curve
- **Page Transitions**: 350ms with smooth curve
- **Stagger Effects**: 50ms delay between list items

### Spacing System

- Use 4px base unit: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px
- Standard spacing: 16px default, 20px between sections, 32px page margins

### Data Visualization

- **Charts**: Minimal grid lines, consistent colors, interactive tooltips
- **Numbers**: Use monospace font, show percentage changes with color coding
- **Trends**: Green for positive, red for negative, blue for neutral
- **Sparklines**: Include in portfolio cards where appropriate

## Implementation Requirements

### Before Any UI Implementation:

1. **ALWAYS** check `/style-guide/style-guide.md` first
2. Verify color usage matches design system
3. Confirm typography follows established scales
4. Ensure component sizing meets specifications
5. Apply correct animation timing and easing

### CSS Class Usage:

- Use predefined component classes: `.btn-primary`, `.card`, `.input-field`
- Apply typography classes: `.text-display-lg`, `.text-data-md`, `.text-h2`
- Use semantic color classes: `.trend-positive`, `.trend-negative`
- Apply animation classes: `.animate-float`, `.animate-shimmer`

### Responsive Design:

- Mobile: Bottom tab bar (5 items max)
- Desktop: Side navigation
- Tables: Show critical columns only on mobile, tap for details
- Cards: Hover states on desktop, tap feedback on mobile

### Accessibility:

- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Focus indicators on all interactive elements
- 44px minimum touch targets
- Support reduced motion preferences

### Brand Personality:

Design should communicate:

- **Sophistication**: Through careful spacing and typography
- **Reliability**: Via consistent patterns and clear hierarchy
- **Intelligence**: With smart data visualization
- **Efficiency**: Through streamlined interactions
- **Trustworthiness**: Via professional aesthetics

## Common Patterns

### Authentication Screens:

- Dark background with gradient overlay
- Centered cards with subtle borders
- Animated loading states
- Error states with shake animation
- Success states with checkmark animation

### Dashboard Components:

- Skeleton loading with shimmer animation
- Staggered card appearance (50ms delay)
- Number counting animations
- Pull-to-refresh on mobile
- Hover states with border transitions

### Data Display:

- Monospace font for all numbers
- Right-aligned numerical values
- Color-coded performance indicators
- Interactive tooltips
- Responsive table designs

### Navigation:

- Smooth transitions between sections
- Clear active state indicators
- Breadcrumb animations
- Tab underline sliding effects

## Error Prevention

### Common Mistakes to Avoid:

- Using wrong fonts (must be Inter for UI, JetBrains Mono for data)
- Incorrect color usage (check design system first)
- Wrong component sizing (buttons must be 48px height)
- Missing animations (all interactions should have transitions)
- Poor contrast ratios (always test accessibility)
- Inconsistent spacing (use 4px base system)

### Quality Checklist:

- [ ] Colors match design system specification
- [ ] Typography uses correct fonts and scales
- [ ] Component sizing follows guidelines
- [ ] Animations use proper timing functions
- [ ] Accessibility requirements met
- [ ] Responsive design implemented
- [ ] Brand personality reflected in design choices
