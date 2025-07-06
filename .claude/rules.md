# LifeDash Coding Rules and Standards

## PROJECT OVERVIEW: LifeDash - Life Management System

**LifeDash** is a comprehensive life management system designed with "Bold Simplicity" principles. While our MVP focuses on investment/stock tracking, the broader vision encompasses health, finance, goals, and other life management aspects. This is NOT just an investment tracker - it's a holistic life dashboard platform.

### Core LifeDash Principles

- **Mobile-First Design**: Touch-optimized with 44px minimum tap targets
- **Bold Simplicity**: Clean, sophisticated design with minimal cognitive load
- **Real-Time Features**: Live data updates throughout the platform
- **Dark Theme Primary**: Dark mode as the default with light mode support
- **Engaging Onboarding**: Smooth user experience flows with proper animations
- **Data-Driven Insights**: Smart analytics and AI-powered recommendations

### MVP Focus: Investment Tracking

Our current implementation focuses on:

- Portfolio management with real-time updates
- Stock analysis with interactive charts
- P&L tracking with lot-level detail
- CSV import workflows
- Tax optimization features
- Multi-currency support

### Future LifeDash Modules

- Health & Fitness tracking
- Goal setting and progress monitoring
- Budget and expense management
- Project and task management
- Social features and sharing
- AI insights across all life areas

## CRITICAL: Style Guide Requirements

**MANDATORY: Always consult `/style-guide/style-guide.md` and `.claude/style-guide-rules.md` before making any UI/UX design decisions.**

### Design System Enforcement

- **Color System**: Use only approved LifeDash colors from the design system
  - Primary Dark: #1A1D29, Primary Light: #FFFFFF
  - Secondary Blue: #4169E1, Secondary Gray: #8B91A7
  - Accent Green: #00C853, Accent Red: #F44336
  - Background Primary: #0F1115, Secondary: #1A1D29, Tertiary: #242837
- **Typography**: Inter for UI text, JetBrains Mono for numerical data
- **Component Standards**: Follow exact specifications for buttons, cards, inputs
- **Animation Guidelines**: Use specified timing functions and durations
  - Smooth: cubic-bezier(0.4, 0, 0.2, 1) - 200ms
  - Responsive: cubic-bezier(0.2, 0, 0, 1) - 150ms
  - Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) - 300ms
- **Spacing System**: Adhere to 4px base unit spacing scale (4, 8, 12, 16, 20, 24, 32, 48px)

### Pre-Implementation Checklist

Before implementing any feature or component:

1. **MANDATORY**: Check `docs/FEATURE_SPECIFICATION.md` to ensure feature requirements are met
2. **MANDATORY**: Review `docs/PROJECT_SPECIFICATION.md` for technical alignment
3. **MANDATORY**: Verify `docs/ARCHITECTURE.md` for architectural compliance
4. Check `/style-guide/style-guide.md` for exact UI specifications
5. Verify color usage matches LifeDash design system
6. Confirm typography follows established scales
7. Ensure component sizing meets touch-friendly requirements (44px min)
8. Apply correct animation timing and easing curves
9. Consider mobile-first responsive breakpoints
10. Implement proper loading states and error handling
11. Follow LifeDash UX patterns and interactions
12. Cross-reference user stories and UX considerations from feature spec

### Feature Implementation Requirements

**CRITICAL**: When creating tasks or implementing features, always:

- Consult `docs/FEATURE_SPECIFICATION.md` for detailed user stories and UX requirements
- Ensure MVP features from the specification are prioritized
- Implement all UX/UI considerations specified for each feature
- Follow the mobile-first workflows and touch optimization requirements
- Align with the Life-First Hierarchical Navigation structure

## Code Quality Standards

### TypeScript Best Practices

- **Strict Mode**: Use strict TypeScript configuration - no `any` types unless absolutely necessary
- **Type Inference**: Prefer type inference over explicit typing when context is clear
- **Interfaces**: Use interface definitions for object shapes and component props
- **Type Organization**: Export types from dedicated `types/` directory when shared across components
- **Context-Aware Development**: Always provide complete module context with imports and type definitions
- **Type Safety**: Use proper type guards, type predicates, and discriminated unions
- **Generics**: Implement proper generic constraints and reusable type patterns
- **Error Handling**: Use custom error types with proper type safety
- **Documentation**: Include TSDoc comments for complex functions and types

### Security and Performance

- **Input Sanitization**: Always sanitize user input to prevent XSS attacks
- **Async/Await Handling**: Properly handle async operations with comprehensive error catching
- **Memory Management**: Use memoization for expensive computations
- **Bundle Optimization**: Implement code splitting and tree shaking for performance

### React/Next.js Patterns

- Use functional components with React hooks
- Prefer Server Components by default, add `'use client'` only when necessary
- Use Next.js App Router conventions for routing and layouts
- Implement proper error boundaries and loading states

### Next.js Architecture Rules

- **Server-First Approach**: Default to server components, use client components only when needed
- **Route Organization**: Follow App Router file-based routing conventions with `page.tsx` files
- **Data Fetching**: Use async server components for data fetching when possible
- **Component Separation**: Maintain clear separation between server and client components
- **Navigation**: Use Next.js navigation hooks and components (`useRouter`, `Link`, `redirect`)
- **Error Handling**: Implement proper error boundaries and `notFound()` handling
- **Metadata**: Use Next.js metadata API for SEO and page configuration

### Next.js Conventions

- **File Naming**: Use kebab-case for directories (`auth-form`) and PascalCase for components
- **Exports**: Prefer named exports over default exports (`export function Button()`)
- **Client Components**: Mark with `'use client'` directive only when interactivity is needed
- **State Management**: Use URL search params for shareable state, avoid unnecessary `useState`
- **Form Handling**: Use React Server Actions instead of client-side form handling
- **Suspense**: Wrap client components in `Suspense` with fallback UI

### Next.js Development Navigation

- Navigate efficiently between server and client components
- Use component hierarchy for better code organization
- Leverage route handlers for API endpoints
- Smart navigation between route segments and layouts
- Quick access to component imports and data fetching functions

### Styling Guidelines

- Use Tailwind CSS utility classes for styling
- Leverage the `cn()` utility for conditional styling
- Follow the design system color tokens (primary, secondary, muted, etc.)
- Use CSS variables for theming and maintain dark mode compatibility
- Prefer semantic color names over literal colors

### Tailwind CSS Best Practices

- **Mobile-First Design**: Use responsive prefixes (`md:`, `lg:`, `xl:`) for responsive layouts
- **State Variants**: Apply hover, focus, and active states (`hover:`, `focus:`, `active:`)
- **Component Patterns**: Use `@apply` directive for repeated utility combinations
- **Arbitrary Values**: Use bracket notation for specific requirements (`top-[117px]`)
- **Spacing Consistency**: Use spacing utilities (`space-y-4`, `gap-4`) for consistent layouts

### File Organization

- Group related files in feature-based directories
- Use index files for clean imports
- Keep components focused and single-responsibility
- Separate business logic from presentation components

### Performance Considerations

- Use Next.js Image component for optimized images
- Implement proper loading states and error handling
- Consider bundle size when adding new dependencies
- Use dynamic imports for code splitting when appropriate

### Code Formatting

- Let Prettier handle all formatting - don't fight it
- Use single quotes and no semicolons (configured in .prettierrc)
- Maintain consistent indentation and line length
- Sort Tailwind classes using the prettier plugin

### Git Workflow

- Write clear, descriptive commit messages
- Use conventional commit format when possible
- Let pre-commit hooks handle code quality checks
- Keep commits focused and atomic

### Task List Management (Project Tracking)

- **File Structure**: Use `TASKS.md` or feature-specific markdown files for project tracking
- **Sections**: Use "Completed Tasks", "In Progress Tasks", "Future Tasks", "Implementation Plan"
- **Progress Tracking**: Update `[ ]` to `[x]` when tasks are completed
- **File Maintenance**: Keep "Relevant Files" section updated with created/modified files
- **AI Workflow**: Always check task list before implementing, update progress after completion

## LifeDash Technical Architecture

### Database & Backend

- **Supabase PostgreSQL**: Primary database with Row Level Security (RLS)
- **Real-Time Subscriptions**: WebSocket integration for live updates
- **Authentication**: Supabase Auth with TOTP 2FA using Speakeasy
- **Database Schema**: Comprehensive tables for users, portfolios, stocks, holdings, transactions
- **Market Data**: Yahoo Finance API integration for real-time stock prices
- **Automation**: n8n workflows for data processing and automation

### Frontend Architecture

- **Framework**: Next.js 14+ with App Router and Server Actions
- **Styling**: TailwindCSS with custom LifeDash design system
- **Charts**: Recharts for interactive data visualization
- **State Management**: React hooks with Supabase real-time subscriptions
- **Type Safety**: TypeScript 5+ with strict mode configuration
- **Animations**: Framer Motion for sophisticated UI animations

### Development Workflow

- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Type Generation**: Automated Supabase type generation
- **Testing**: Component testing with focus on user interactions
- **Deployment**: Optimized for production with proper error boundaries
- **Performance**: Code splitting, lazy loading, and optimization strategies

### Key Features Implemented

- ✅ **Authentication System**: Complete with 2FA and secure session management
- ✅ **Portfolio Management**: CRUD operations with real-time updates
- ✅ **CSV Import Workflow**: Drag-drop upload with column mapping
- ✅ **Responsive Navigation**: Desktop sidebar and mobile bottom nav
- ✅ **Interactive Charts**: Loading states and animations
- ✅ **Real-Time Updates**: WebSocket integration for live data
- 🚧 **Stock Analysis Pages**: Currently in planning phase (Step 12)
- ⏳ **Tax Optimization**: Future implementation
- ⏳ **Multi-Currency**: Planned enhancement

### Integration Points

- **Navigation System**: Unified routing between desktop and mobile
- **Real-Time Data**: Live portfolio updates across all components
- **CSV Import**: Integrated with portfolio management
- **Authentication**: Protected routes with proper session handling
- **Error Handling**: Comprehensive error boundaries and user feedback

## Performance Optimization Patterns (July 2025)

### Infinite Loop Prevention

- **Stable Refs Pattern**: Use `useRef` to store values that should not trigger useEffect dependencies
- **Debounced Updates**: Implement timeouts and delays for high-frequency operations
- **Dependency Isolation**: Separate concerns to avoid circular dependencies in useEffect
- **Memoized Callbacks**: Use `useCallback` for event handlers to prevent re-render cycles
- **Proper Cleanup**: Always cleanup timers, subscriptions, and abort controllers

### Error Boundary Guidelines

- **Component Isolation**: Wrap feature components in error boundaries
- **Graceful Degradation**: Provide meaningful fallback UI for errors
- **Error Recovery**: Implement retry mechanisms and user-friendly error messages
- **Norwegian Localization**: Use Norwegian text for all user-facing error messages
- **Development Details**: Show technical error details only in development mode

### Memory Management Rules

- **Mounted Refs**: Use `mountedRef` to prevent setState on unmounted components
- **Abort Controllers**: Cancel ongoing requests when components unmount
- **Cleanup Patterns**: Clear all timers, intervals, and subscriptions in useEffect cleanup
- **Cache TTL**: Implement proper cache expiration and cleanup intervals
- **Subscription Management**: Track and properly unsubscribe from real-time channels

### Performance Monitoring

- **Connection Quality**: Monitor real-time connection health with ping history
- **Cache Statistics**: Track cache hit rates and memory usage
- **Re-render Tracking**: Use React DevTools Profiler to verify optimization effectiveness
- **Bundle Analysis**: Regularly check for unused imports and dependencies

## Anti-Patterns to Avoid

### General Anti-Patterns

- Don't bypass TypeScript strict mode with `any` or `@ts-ignore`
- Don't use inline styles when Tailwind classes are available
- Don't create deeply nested component structures
- Don't ignore ESLint warnings without good reason
- Don't commit code that fails type checking or linting
- Don't implement features without consulting LifeDash design specifications
- Don't create components that don't follow mobile-first principles
- Don't skip real-time functionality where live updates are expected
- Don't implement UI without proper loading states and error handling

### Performance Anti-Patterns (July 2025)

- **Don't create infinite loops**: Always use stable refs for useEffect dependencies
- **Don't ignore memory leaks**: Always implement proper cleanup in useEffect
- **Don't skip error boundaries**: Isolate components with error boundaries
- **Don't use inline functions**: Memoize event handlers with useCallback
- **Don't forget abort controllers**: Cancel requests on component unmount
- **Don't skip debouncing**: Debounce high-frequency operations (price updates, API calls)
- **Don't ignore cache TTL**: Implement proper cache expiration strategies
- **Don't mix concerns**: Separate data fetching, caching, and UI rendering logic
