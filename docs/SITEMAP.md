# Site Map - Universal Portfolio Management App

## Information Architecture

This site map defines the complete navigation structure and page hierarchy for the universal portfolio management application supporting stocks, cryptocurrencies, and alternative assets.

## Primary Navigation Structure

```
├── 🏠 Dashboard (/)
├── 📊 Holdings (/holdings)
├── 💸 Transactions (/transactions)
├── 📈 Analytics (/analytics)
├── 🔗 Connections (/connections)
├── ⚙️ Settings (/settings)
└── 👤 Profile (/profile)
```

## Detailed Page Hierarchy

### 🏠 Dashboard (/)
**Main landing page showing portfolio overview**

```
Dashboard /
├── Portfolio Summary
│   ├── Total Value Widget
│   ├── Day Change Widget
│   └── Asset Allocation Chart
├── Quick Actions
│   ├── Add Transaction Modal
│   ├── Sync Accounts
│   └── Quick Buy/Sell
├── Performance Chart
│   ├── Time Period Selector
│   ├── Benchmark Comparison
│   └── Asset Class Toggle
├── Top Holdings (5-10 items)
│   ├── Individual Holding Cards
│   └── "View All Holdings" Link
├── Recent Activity Feed
│   ├── Latest Transactions
│   ├── Price Alerts
│   └── News Items
└── Market Overview
    ├── Indices Performance
    ├── Crypto Market
    └── Trending Assets
```

### 📊 Holdings (/holdings)
**Complete portfolio holdings management**

```
Holdings /
├── Holdings Overview
│   ├── Total Portfolio Value
│   ├── Allocation Breakdown
│   └── Performance Summary
├── Holdings Table
│   ├── Asset Information
│   ├── Quantity & Value
│   ├── Cost Basis & P&L
│   ├── Performance Metrics
│   └── Action Buttons
├── Filtering & Grouping
│   ├── Asset Class Filter
│   ├── Account Filter
│   ├── Performance Filter
│   └── Search Function
├── Bulk Actions
│   ├── Export Holdings
│   ├── Update Prices
│   └── Bulk Tagging
└── Asset Detail Pages
    ├── /holdings/stocks/[symbol]
    ├── /holdings/crypto/[symbol]
    └── /holdings/alternatives/[id]
```

#### Asset Detail Sub-pages

```
/holdings/stocks/[symbol]
├── Stock Overview
│   ├── Price Chart
│   ├── Key Metrics
│   ├── Company Information
│   └── News Feed
├── Your Position
│   ├── Holding Summary
│   ├── Transaction History
│   ├── Cost Basis Analysis
│   └── Performance Attribution
├── Fundamentals
│   ├── Financial Metrics
│   ├── Ratios Analysis
│   ├── Earnings History
│   └── Analyst Estimates
└── Actions
    ├── Buy More
    ├── Sell Position
    ├── Set Price Alert
    └── Add Notes

/holdings/crypto/[symbol]
├── Crypto Overview
│   ├── Price Chart
│   ├── Market Data
│   ├── Token Information
│   └── News & Updates
├── Your Position
│   ├── Holding Summary
│   ├── Transaction History
│   ├── Staking Rewards
│   └── DeFi Positions
├── On-Chain Analysis
│   ├── Address Tracking
│   ├── Network Activity
│   ├── Supply Metrics
│   └── Protocol Data
└── DeFi Integration
    ├── Staking Options
    ├── Yield Farming
    ├── Liquidity Pools
    └── Bridge Options

/holdings/alternatives/[id]
├── Asset Overview
│   ├── Image Gallery
│   ├── Asset Details
│   ├── Valuation History
│   └── Market Comparables
├── Your Ownership
│   ├── Purchase Details
│   ├── Current Valuation
│   ├── Appreciation
│   └── Insurance Info
├── Authentication
│   ├── Provenance
│   ├── Certificates
│   ├── Appraisals
│   └── Documentation
└── Management
    ├── Storage Details
    ├── Insurance
    ├── Maintenance
    └── Sale Options
```

### 💸 Transactions (/transactions)
**Transaction history and management**

```
Transactions /
├── Transaction Overview
│   ├── Monthly Summary
│   ├── Transaction Types
│   └── Cash Flow Analysis
├── Transaction History Table
│   ├── Date & Time
│   ├── Asset & Account
│   ├── Type & Details
│   ├── Amount & Fees
│   └── Actions
├── Add Transaction
│   ├── /transactions/add
│   ├── Asset Selection
│   ├── Transaction Details
│   ├── Fee Calculation
│   └── Review & Submit
├── Bulk Import
│   ├── /transactions/import
│   ├── CSV Upload
│   ├── Field Mapping
│   ├── Validation
│   └── Import Results
├── Transaction Analytics
│   ├── /transactions/analytics
│   ├── Monthly Trends
│   ├── Fee Analysis
│   ├── Trading Patterns
│   └── Performance Impact
└── Export Options
    ├── CSV Export
    ├── Tax Reports
    ├── Broker Statements
    └── Custom Reports
```

### 📈 Analytics (/analytics)
**Portfolio performance and analytics**

```
Analytics /
├── Performance Dashboard
│   ├── Portfolio Performance
│   ├── Benchmark Comparison
│   ├── Risk Metrics
│   └── Attribution Analysis
├── Asset Allocation
│   ├── /analytics/allocation
│   ├── Current Allocation
│   ├── Target vs. Actual
│   ├── Rebalancing Suggestions
│   └── Historical Changes
├── Risk Analysis
│   ├── /analytics/risk
│   ├── Portfolio Volatility
│   ├── Correlation Matrix
│   ├── Value at Risk
│   └── Stress Testing
├── Tax Analytics
│   ├── /analytics/tax
│   ├── Tax-Loss Harvesting
│   ├── Capital Gains/Losses
│   ├── Dividend Income
│   └── Tax-Efficient Strategies
├── Sector Analysis
│   ├── /analytics/sectors
│   ├── Sector Allocation
│   ├── Sector Performance
│   ├── Geographic Distribution
│   └── Industry Exposure
└── Custom Reports
    ├── /analytics/reports
    ├── Report Builder
    ├── Scheduled Reports
    ├── Report Library
    └── Export Options
```

### 🔗 Connections (/connections)
**Platform integrations and data sources**

```
Connections /
├── Connected Accounts
│   ├── Active Connections
│   ├── Sync Status
│   ├── Last Updated
│   └── Connection Health
├── Available Platforms
│   ├── /connections/browse
│   ├── Broker Integrations
│   ├── Crypto Exchanges
│   ├── Alternative Platforms
│   └── Coming Soon
├── Broker Connections
│   ├── /connections/brokers
│   ├── Interactive Brokers
│   ├── Charles Schwab
│   ├── Alpaca
│   └── Other Brokers
├── Crypto Exchanges
│   ├── /connections/crypto
│   ├── Binance
│   ├── Coinbase
│   ├── Kraken
│   └── Other Exchanges
├── Alternative Assets
│   ├── /connections/alternatives
│   ├── Art Platforms
│   ├── Collectibles
│   ├── Real Estate
│   └── Other Assets
├── Manual Accounts
│   ├── /connections/manual
│   ├── Add Manual Account
│   ├── Account Types
│   ├── CSV Import
│   └── Data Entry
└── Sync Management
    ├── Sync Schedule
    ├── Data Mapping
    ├── Error Handling
    └── Sync History
```

### ⚙️ Settings (/settings)
**Application configuration and preferences**

```
Settings /
├── Profile Settings
│   ├── /settings/profile
│   ├── Personal Information
│   ├── Contact Details
│   ├── Profile Picture
│   └── Account Status
├── Portfolio Settings
│   ├── /settings/portfolio
│   ├── Default Currency
│   ├── Default Portfolio
│   ├── Display Preferences
│   └── Calculation Methods
├── Notification Settings
│   ├── /settings/notifications
│   ├── Price Alerts
│   ├── Portfolio Updates
│   ├── News & Events
│   └── Email Preferences
├── Security Settings
│   ├── /settings/security
│   ├── Change Password
│   ├── Two-Factor Auth
│   ├── API Keys
│   └── Login History
├── Data & Privacy
│   ├── /settings/privacy
│   ├── Data Export
│   ├── Data Deletion
│   ├── Privacy Controls
│   └── Cookie Preferences
├── Subscription & Billing
│   ├── /settings/billing
│   ├── Current Plan
│   ├── Usage Statistics
│   ├── Payment Methods
│   └── Billing History
└── Advanced Settings
    ├── /settings/advanced
    ├── API Access
    ├── Webhook Configuration
    ├── Data Sources
    └── Developer Tools
```

### 👤 Profile (/profile)
**User profile and account management**

```
Profile /
├── Profile Overview
│   ├── User Information
│   ├── Account Summary
│   ├── Recent Activity
│   └── Quick Actions
├── Investment Profile
│   ├── /profile/investment
│   ├── Risk Tolerance
│   ├── Investment Goals
│   ├── Time Horizon
│   └── Preferences
├── Tax Information
│   ├── /profile/tax
│   ├── Tax Jurisdiction
│   ├── Tax Status
│   ├── Filing Preferences
│   └── Tax Documents
├── Achievements
│   ├── /profile/achievements
│   ├── Portfolio Milestones
│   ├── Investment Streaks
│   ├── Goal Completions
│   └── Badges Earned
└── Support & Help
    ├── /profile/support
    ├── Help Center
    ├── Contact Support
    ├── Feature Requests
    └── Community Forum
```

## Authentication Flow

```
Authentication /
├── Login (/auth/login)
│   ├── Email/Password
│   ├── Social Login (Google, Apple)
│   ├── Two-Factor Authentication
│   └── Remember Device
├── Register (/auth/register)
│   ├── Account Creation
│   ├── Email Verification
│   ├── Profile Setup
│   └── Initial Portfolio
├── Password Reset (/auth/reset)
│   ├── Email Request
│   ├── Reset Link
│   ├── New Password
│   └── Confirmation
└── Account Verification (/auth/verify)
    ├── Email Verification
    ├── Phone Verification
    ├── Identity Verification
    └── Account Activation
```

## Legal & Support Pages

```
Legal & Support /
├── Terms of Service (/legal/terms)
├── Privacy Policy (/legal/privacy)
├── Cookie Policy (/legal/cookies)
├── Security (/legal/security)
├── API Documentation (/docs/api)
├── Help Center (/help)
│   ├── Getting Started
│   ├── Account Management
│   ├── Portfolio Tracking
│   ├── Integrations
│   └── Troubleshooting
├── Contact Us (/contact)
├── About Us (/about)
└── Release Notes (/releases)
```

## Mobile-Specific Navigation

```
Mobile Navigation (Bottom Tabs) /
├── 🏠 Home (Dashboard)
├── 📊 Holdings
├── 💸 Activity (Transactions)
├── 📈 Charts (Analytics)
└── ⚙️ More (Settings/Profile)
```

## Search & Discovery

```
Search (/search)
├── Universal Search
│   ├── Assets (Stocks, Crypto, Alternatives)
│   ├── Transactions
│   ├── Holdings
│   └── News & Information
├── Advanced Search
│   ├── Filter by Asset Class
│   ├── Filter by Exchange
│   ├── Price Range
│   └── Market Cap Range
├── Watchlists (/watchlists)
│   ├── Create Watchlist
│   ├── Manage Lists
│   ├── Price Alerts
│   └── Performance Tracking
└── Market Discovery
    ├── Trending Assets
    ├── Top Gainers/Losers
    ├── Most Active
    └── New Listings
```

## API & Developer Tools

```
Developer (/developer)
├── API Documentation
├── Webhook Configuration
├── Rate Limits
├── Authentication
├── SDKs & Libraries
└── Testing Tools
```

## Error & Status Pages

```
Error Pages /
├── 404 - Not Found
├── 500 - Server Error
├── 503 - Maintenance
├── 401 - Unauthorized
├── 403 - Forbidden
└── Network Error
```

This comprehensive site map provides the foundation for creating detailed wireframes and implementing the complete universal portfolio management application.