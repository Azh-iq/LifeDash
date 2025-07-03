# LifeDash 📊

> **Your Personal Life Dashboard** - A modern, feature-rich web application for tracking and managing various aspects of your daily life.

![LifeDash](https://img.shields.io/badge/LifeDash-Personal%20Dashboard-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Features

### 🎨 **Complete UI Component Library**

- **9+ Production-Ready Components**: Buttons, Inputs, Cards, Modals, Tables, Charts, and more
- **Real-time Form Validation**: Using Zod schemas with React Hook Form
- **Accessible Design**: ARIA attributes and keyboard navigation throughout
- **Dark Mode Support**: Seamless light/dark theme switching
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

### 🔐 **Authentication System**

- **Complete Auth Flow**: Login, Register, Password Reset, 2FA
- **Password Strength Meter**: Real-time feedback with security requirements
- **Two-Factor Authentication**: QR code setup and backup codes
- **Social Login Ready**: Google and Facebook integration prepared
- **Secure Validation**: Server-side validation with comprehensive error handling

### 📈 **Data Visualization**

- **Interactive Charts**: Built with Recharts for financial data
- **Sortable Tables**: Advanced data tables with filtering and sorting
- **Metric Cards**: Beautiful KPI displays with trend indicators
- **Currency Formatting**: Professional financial data presentation
- **Loading States**: Skeleton components for better UX

### 🏗️ **Enterprise Architecture**

- **Scalable Database**: PostgreSQL with Row Level Security (RLS)
- **Performance Optimized**: Materialized views and indexing strategies
- **Type Safety**: Full TypeScript coverage with generated database types
- **Modern Stack**: Next.js 14 App Router with Server Components

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Supabase Account** (for database)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Azh-iq/LifeDash.git
   cd LifeDash
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run database migrations** (if using Supabase)

   ```bash
   npx supabase migration up
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🎯 Demo Pages

Explore all the components and features through our comprehensive demo pages:

- **🏠 Homepage**: Overview and navigation (`/`)
- **🧩 UI Components**: Complete component library (`/ui-demo`)
- **📊 Data Display**: Charts, tables, and metrics (`/data-demo`)
- **🔐 Authentication**: Login, register, 2FA flows (`/auth-demo`)
- **🗄️ Database Test**: Connection and setup verification (`/test-connection`)

### Live Authentication Pages

- **Login**: `/auth/login` - Try `user@2fa.com` for 2FA demo
- **Register**: `/auth/register` - See password strength in action
- **Forgot Password**: `/auth/forgot-password`
- **Reset Password**: `/auth/reset-password?token=valid-token`

## 🛠️ Technology Stack

### Frontend

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms
- **[Zod](https://zod.dev/)** - Schema validation
- **[Recharts](https://recharts.org/)** - Data visualization

### Backend & Database

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **Row Level Security (RLS)** - Data access control
- **Real-time subscriptions** - Live data updates

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[Claude AI](https://claude.ai/)** - AI-assisted development

## 📁 Project Structure

```
LifeDash/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 (auth)/                   # Auth pages group
│   │   ├── 📄 layout.tsx           # Auth layout
│   │   ├── 📁 login/               # Login page
│   │   ├── 📁 register/            # Register page
│   │   └── 📁 forgot-password/     # Password reset
│   ├── 📄 auth-demo/               # Auth demo page
│   ├── 📄 data-demo/               # Data display demo
│   ├── 📄 ui-demo/                 # UI components demo
│   ├── 📄 globals.css              # Global styles
│   ├── 📄 layout.tsx               # Root layout
│   └── 📄 page.tsx                 # Homepage
├── 📁 components/                   # React components
│   ├── 📁 ui/                      # Base UI components
│   │   ├── 📄 button.tsx           # Button component
│   │   ├── 📄 input.tsx            # Input component
│   │   ├── 📄 card.tsx             # Card component
│   │   ├── 📄 modal.tsx            # Modal component
│   │   ├── 📄 table.tsx            # Table component
│   │   └── 📄 index.ts             # Component exports
│   ├── 📁 features/                # Feature-specific components
│   │   └── 📁 auth/                # Authentication components
│   └── 📁 shared/                  # Shared components
│       ├── 📁 charts/              # Chart components
│       ├── 📁 metrics/             # Metric components
│       ├── 📁 currency/            # Currency formatting
│       └── 📁 loading/             # Loading components
├── 📁 lib/                         # Utility libraries
│   ├── 📁 supabase/                # Supabase integration
│   ├── 📁 validation/              # Validation schemas
│   ├── 📁 utils/                   # Utility functions
│   └── 📁 types/                   # TypeScript types
├── 📁 supabase/                    # Database configuration
│   ├── 📁 migrations/              # Database migrations
│   └── 📄 seed.sql                 # Seed data
├── 📁 .claude/                     # AI assistant configuration
└── 📄 README.md                    # This file
```

## 🎨 Design System

LifeDash implements a comprehensive design system with:

### Color Palette

- **Primary**: Professional blues for branding
- **Secondary**: Functional grays for interface elements
- **Accent**: Green (success), Red (error), Amber (warning), Purple (info)
- **Semantic**: Success, error, warning, info variants

### Typography

- **Font Stack**: Inter (UI), JetBrains Mono (code/data)
- **Scale**: Display, Heading, Body, Data, Label, Button, Caption
- **Responsive**: Fluid typography that scales with screen size

### Components

- **Interactive States**: Hover, focus, active, disabled
- **Loading States**: Skeleton animations and spinners
- **Accessibility**: WCAG 2.1 AA compliant
- **Animations**: Smooth transitions and micro-interactions

## 🔧 Development

### Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier

# Database
npm run db:generate  # Generate TypeScript types
npm run db:reset     # Reset database
npm run db:seed      # Seed with test data
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Demo Credentials

Test the authentication system with these demo scenarios:

### Login Demo

- **Regular Login**: Any email + any password
- **2FA Demo**: `user@2fa.com` + any password (code: `123456`, backup: `BACKUP123`)
- **Error Demo**: `error@test.com` + any password

### Registration Demo

- **Success**: Any valid email and strong password
- **Email Exists**: `existing@test.com`
- **Error Demo**: `error@test.com`

### Password Reset Demo

- **Success**: Any valid email
- **Not Found**: `notfound@test.com`
- **Error Demo**: `error@test.com`

## 📊 Current Implementation Status

### ✅ Completed Phases

- **Phase 1**: Project Foundation & Setup
- **Phase 2**: Database & Backend Architecture
- **Phase 3**: Core UI Component Library
- **Phase 4**: Data Display Components
- **Phase 5**: Authentication & Navigation

### 🚧 Next Steps

- **Phase 6**: Dashboard Implementation
- **Phase 7**: Advanced Features & Analytics
- **Phase 8**: Deployment & Production

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Next.js Team](https://nextjs.org/)** - Amazing React framework
- **[Supabase Team](https://supabase.com/)** - Excellent backend platform
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Recharts Team](https://recharts.org/)** - Beautiful data visualization
- **[Claude AI](https://claude.ai/)** - AI-assisted development

---

<div align="center">

**[🏠 Homepage](http://localhost:3000)** •
**[🧩 UI Demo](http://localhost:3000/ui-demo)** •
**[📊 Data Demo](http://localhost:3000/data-demo)** •
**[🔐 Auth Demo](http://localhost:3000/auth-demo)**

Made with ❤️ and ☕ by [Azhar](https://github.com/Azh-iq)

</div>
