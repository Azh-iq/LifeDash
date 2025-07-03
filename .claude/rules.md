# Coding Rules and Standards

## CRITICAL: Style Guide Requirements

**MANDATORY: Always consult `/style-guide/style-guide.md` and `.claude/style-guide-rules.md` before making any UI/UX design decisions.**

### Design System Enforcement

- **Color System**: Use only approved LifeDash colors from the design system
- **Typography**: Inter for UI text, JetBrains Mono for numerical data
- **Component Standards**: Follow exact specifications for buttons, cards, inputs
- **Animation Guidelines**: Use specified timing functions and durations
- **Spacing System**: Adhere to 4px base unit spacing scale

### Pre-Implementation Checklist

Before implementing any UI component:

1. Check `/style-guide/style-guide.md` for specifications
2. Verify color usage matches design system
3. Confirm typography follows established scales
4. Ensure component sizing meets requirements
5. Apply correct animation timing and easing

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

## Anti-Patterns to Avoid

- Don't bypass TypeScript strict mode with `any` or `@ts-ignore`
- Don't use inline styles when Tailwind classes are available
- Don't create deeply nested component structures
- Don't ignore ESLint warnings without good reason
- Don't commit code that fails type checking or linting
