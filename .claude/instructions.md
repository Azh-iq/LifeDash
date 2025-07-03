# Instructions

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without fixing

**Pre-commit Quality Checks**: All commits automatically run `lint:fix`, `type-check`, and `lint-staged` via Husky hooks.

## Project Architecture

This is a Next.js 14+ project using the App Router with TypeScript 5+. The project follows a modern React development setup with strict linting and formatting rules.

### Next.js Development Approach

- **Server-First**: Default to server components for better performance and SEO
- **Context-Aware Development**: Provide complete context when generating code
- **App Router**: Leverage file-based routing with layouts and nested routes
- **Component Navigation**: Efficient navigation between server/client components
- **Data Fetching**: Use async server components and proper error handling

### TypeScript Development Principles

- **Strict Type Safety**: Always use strict TypeScript configuration with no `any` types
- **Context-Aware Code Generation**: Provide complete module context with imports and type definitions
- **Type-First Design**: Define interfaces and types before implementing functionality
- **Proper Error Handling**: Use custom error types with comprehensive type safety
- **TSDoc Documentation**: Include clear documentation for complex functions and types

### Key Technologies

- **Next.js 14+** with App Router
- **TypeScript 5+** with strict configuration
- **Tailwind CSS** for styling with custom design tokens
- **ESLint + Prettier** for code quality and formatting
- **Husky** for pre-commit hooks with lint-staged

### Directory Structure

- `app/` - Next.js App Router pages and layouts
- `lib/` - Utility functions and shared code
- `components/` - React components (to be created)
- `types/` - TypeScript type definitions (to be created)

### Code Style & Quality

- **Prettier**: Single quotes, no semicolons, Tailwind class sorting enabled
- **ESLint**: Strict TypeScript rules with Next.js optimizations
- **TypeScript**: Strict mode enabled with `noEmit: true`
- **Pre-commit hooks**: Automatic linting, type checking, and formatting
- **Lint-staged**: Processes only staged files for faster commits

### Path Aliases

- `@/*` - Root directory
- `@/components/*` - Components directory
- `@/lib/*` - Library/utilities directory
- `@/app/*` - App directory
- `@/types/*` - Types directory

### Development Environment

- Environment variables are defined in `.env.example` and should be copied to `.env.local`
- Git hooks are set up via Husky to enforce code quality
- The project uses CSS variables for theming with built-in dark mode support
- **Node.js**: Requires version 18.0.0 or higher

### Task List Management Workflow

- **Before Implementation**: Always check existing task list files (e.g., `TASKS.md`, `FEATURE_NAME.md`)
- **During Development**: Update "Relevant Files" section with created/modified files
- **After Completion**: Mark tasks as completed `[x]` and move to "Completed Tasks" section
- **Progress Tracking**: Use status indicators (✅ 🚧 📋) for file progress in documentation
- **AI Instructions**: Always reference and update task lists when implementing features

### Styling System

- **Tailwind CSS**: Custom design system using CSS variables for theming
- **Design tokens**: Semantic color system (primary, secondary, muted, accent, destructive)
- **Dark mode**: Built-in support via CSS variables
- **Utility function**: `cn()` utility combines `clsx` and `tailwind-merge` for conditional classes
- **Border radius**: Consistent system using `--radius` CSS variable
