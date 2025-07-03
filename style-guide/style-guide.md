LifeDash Design Brief
Color Palette
Primary Colors
Primary Dark - #1A1D29 (Deep charcoal for main backgrounds)
Primary Light - #FFFFFF (Pure white for cards and contrast)
Secondary Colors
Secondary Blue - #4169E1 (Royal blue for primary actions and positive trends)
Secondary Gray - #8B91A7 (Muted gray for secondary text and inactive states)
Accent Colors
Accent Green - #00C853 (Vibrant green for gains and success states)
Accent Red - #F44336 (Clear red for losses and alerts)
Accent Amber - #FFA726 (Warm amber for warnings and highlights)
Accent Purple - #7C4DFF (Deep purple for premium features)
Functional Colors
Success - #00C853 (Matches accent green for consistency)
Error - #F44336 (Matches accent red for consistency)
Warning - #FFA726 (Matches accent amber for consistency)
Info - #2196F3 (Sky blue for informational elements)
Background Colors
Background Primary - #0F1115 (Near-black for main app background)
Background Secondary - #1A1D29 (Dark charcoal for cards in dark mode)
Background Tertiary - #242837 (Lighter charcoal for elevated surfaces)
Background Light - #F8F9FA (Off-white for light mode background)
Typography
Font Family
Primary Font: Inter (All platforms)
Monospace Font: JetBrains Mono (For numbers and data)
System Fallback: -apple-system, BlinkMacSystemFont, Segoe UI
Font Weights
Light: 300
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
Text Styles
Display
Display Large: 48px/56px, Bold, Letter spacing -0.5px
Used for hero numbers and major portfolio values
Display Medium: 36px/44px, Bold, Letter spacing -0.3px
Used for section totals and key metrics
Headings
H1: 32px/40px, Bold, Letter spacing -0.3px
Screen titles and major headers
H2: 24px/32px, Semibold, Letter spacing -0.2px
Section headers and card titles
H3: 20px/28px, Semibold, Letter spacing -0.1px
Subsection headers
Body Text
Body Large: 16px/24px, Regular, Letter spacing 0px
Primary content and descriptions
Body: 14px/20px, Regular, Letter spacing 0px
Standard UI text
Body Small: 12px/16px, Regular, Letter spacing 0.1px
Supporting text and metadata
Data Text
Data Large: 24px/28px, JetBrains Mono Medium, Letter spacing 0px
Major financial figures
Data Medium: 18px/24px, JetBrains Mono Regular, Letter spacing 0px
Portfolio values and prices
Data Small: 14px/18px, JetBrains Mono Regular, Letter spacing 0px
Percentages and smaller metrics
Special Text
Label: 12px/16px, Medium, Letter spacing 0.5px, Uppercase
Form labels and categories
Button: 14px/20px, Medium, Letter spacing 0.2px
Button text
Caption: 11px/14px, Regular, Letter spacing 0.2px
Timestamps and fine print
Component Styling
Buttons
Primary Button
Background: Secondary Blue (#4169E1)
Text: White (#FFFFFF)
Height: 48px
Corner Radius: 12px
Padding: 16px horizontal
Hover: 10% lighter
Active: 10% darker
Secondary Button
Background: Transparent
Border: 1.5px Secondary Gray (#8B91A7)
Text: Secondary Gray (#8B91A7)
Height: 48px
Corner Radius: 12px
Hover: Background rgba(139, 145, 167, 0.1)
Ghost Button
Background: None
Text: Secondary Blue (#4169E1)
Height: 44px
No border
Hover: Background rgba(65, 105, 225, 0.08)
Cards
Background: Background Secondary (#1A1D29)
Border: 1px solid rgba(139, 145, 167, 0.1)
Corner Radius: 16px
Padding: 20px
Shadow: None (rely on borders for depth)
Hover: Border color rgba(65, 105, 225, 0.3)
Input Fields
Height: 52px
Background: Background Tertiary (#242837)
Border: 1px solid transparent
Corner Radius: 12px
Padding: 16px horizontal
Text: Primary Light (#FFFFFF)
Placeholder: Secondary Gray (#8B91A7)
Focus Border: 2px Secondary Blue (#4169E1)
Focus Background: rgba(65, 105, 225, 0.05)
Data Visualization Elements
Chart Grid: rgba(139, 145, 167, 0.1)
Chart Text: Secondary Gray (#8B91A7)
Positive Trend: Accent Green (#00C853)
Negative Trend: Accent Red (#F44336)
Neutral: Secondary Blue (#4169E1)
Icons
Navigation Icons: 24px × 24px
Action Icons: 20px × 20px
Status Icons: 16px × 16px
Primary Icon Color: Primary Light (#FFFFFF)
Secondary Icon Color: Secondary Gray (#8B91A7)
Active Icon Color: Secondary Blue (#4169E1)
Spacing System
4px - Micro (between related inline elements)
8px - Tiny (compact spacing)
12px - Small (internal component padding)
16px - Default (standard spacing)
20px - Medium (between sections)
24px - Large (major section breaks)
32px - Extra Large (page margins)
48px - Huge (between major page sections)
Motion & Animation
Timing Functions
Smooth: cubic-bezier(0.4, 0, 0.2, 1) - 200ms
Responsive: cubic-bezier(0.2, 0, 0, 1) - 150ms
Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) - 300ms
Animation Types
Micro-interactions: 150ms, Responsive curve
Hover states, button presses, toggles
State Transitions: 200ms, Smooth curve
Card expansions, tab switches
Data Updates: 300ms, Smooth curve
Chart refreshes, value changes
Page Transitions: 350ms, Smooth curve
Navigation between screens
Animation Principles
Stagger list items by 50ms
Fade + scale for modals (0.95 → 1.0)
Slide + fade for page transitions
Number transitions use counting animation
Charts draw from left to right
Light Mode Variants
Background Primary: #FFFFFF
Background Secondary: #F8F9FA
Background Tertiary: #E9ECEF
Text Primary: #1A1D29
Text Secondary: #495057
Card Shadows: 0 1px 3px rgba(0, 0, 0, 0.08)
Accessibility Guidelines
Minimum contrast ratio 4.5:1 for normal text
Minimum contrast ratio 3:1 for large text
Focus indicators on all interactive elements
Sufficient touch targets (44px minimum)
Support for reduced motion preferences
Clear visual hierarchy without relying solely on color
Component-Specific Guidelines
Portfolio Cards
Use monospace font for all numerical values
Right-align numbers for easy scanning
Show percentage changes with color coding
Include subtle trend sparklines where appropriate
Navigation
Bottom tab bar on mobile (5 items max)
Side navigation on desktop
Clear active state indicators
Smooth transitions between sections
Data Tables
Alternating row backgrounds (subtle)
Sticky headers when scrolling
Sortable columns with clear indicators
Responsive design that prioritizes key data
Charts
Minimal grid lines
Clear axis labels
Interactive tooltips on hover/tap
Consistent color usage across all charts
Support for pan and zoom on mobile
Brand Personality
The design should communicate:
Sophistication: Through careful use of space and typography
Reliability: Via consistent patterns and clear hierarchy
Intelligence: With smart data visualization and insights
Efficiency: Through streamlined interactions and clear CTAs
Trustworthiness: Via professional aesthetics and attention to detail
—----------------------------------------------------------------------------------------------------------------------------
Authentication & User Management
Login Screen
Login Screen - Initial State
Dark background (#0F1115) with subtle gradient overlay fading to #1A1D29 at bottom
Centered card (#1A1D29) with 1px border rgba(139, 145, 167, 0.1), 16px radius
LifeDash logo at top, animated with subtle pulse on load (scale 0.95→1.0, 300ms)
"Welcome back" in Display Medium (36px, Bold, #FFFFFF)
Email input field with "Email" label (12px, Medium, uppercase, #8B91A7)
Password input with toggle visibility icon (eye icon transitions with 150ms fade)
"Forgot password?" ghost button aligned right (#4169E1, hover background appears)
Primary "Sign In" button (#4169E1, full width, disabled until fields valid)
Divider with "or" text (centered, #8B91A7)
"Create Account" secondary button with border
Subtle particle animation in background, moving upward at 0.5 opacity
Login Screen - Loading State
Button transforms: text fades out, width animates to circle (200ms)
Circular loading spinner appears (white, 2px stroke, rotating)
Input fields become read-only with 0.5 opacity
Background particles slow down to 0.25 speed
Success: checkmark animates in with bounce curve, then fade entire screen
Login Screen - Error State
Shake animation on card (150ms, 10px horizontal)
Error message slides down from top of card (#F44336 background, white text)
Input fields get red border (2px, #F44336) with subtle glow
Password field auto-focuses with cursor blink animation
Error message auto-dismisses after 5 seconds with fade out
Create Account Screen
Create Account - Initial State
Similar layout to login but taller card to accommodate extra fields
"Join LifeDash" as header (Display Medium)
"Start your financial journey" subtitle (#8B91A7, Body Large)
Email, Password, Confirm Password fields stack vertically
Password strength indicator below password field:
Animated bar that fills based on strength
Color transitions: #F44336 → #FFA726 → #00C853
Requirements checklist appears on focus (slide down, 200ms)
Terms checkbox with custom styling (animated checkmark on click)
"Create Account" primary button (disabled until all valid)
"Already have account? Sign in" link at bottom
Create Account - Success State
Inputs fade out (200ms stagger, 50ms between)
Success animation: circle expands from button center
Checkmark draws in with SVG path animation (300ms)
"Account created!" message fades in
Auto-redirect after 2 seconds with page slide transition
Password Reset Screen
Password Reset - Request State
Minimal card design with single email input
"Reset your password" header
"We'll send you instructions" helper text
Email input with enhanced focus state (blue glow)
"Send Reset Link" primary button
"Back to login" ghost button with arrow icon
Password Reset - Confirmation State
Card content fades out and new content fades in (cross-fade, 200ms)
Animated email icon (envelope that opens)
"Check your email" message with user's email highlighted
"Didn't receive it?" link appears after 10 seconds (fade in)
Resend cooldown timer if clicked (60 second countdown)
Navigation & Dashboard Structure
Main Dashboard
Dashboard - Initial Load State
Skeleton screens for each card with shimmer animation (left to right gradient)
Navigation bar loads immediately with user avatar placeholder
Cards stagger in as data loads (50ms delay between, slide up + fade)
Numbers count up from 0 to actual values (1 second duration)
Smooth transition from skeleton to real content (no layout shift)
Dashboard - Default State
Top navigation bar (#1A1D29) with subtle bottom border
User avatar (right) with hover state (scale 1.05, shadow appears)
"Good evening, [Name]" with time-based greeting (fade transition between)
Total portfolio value in Display Large (48px, counts when updating)
Performance indicator with arrow animation (rotates based on direction)
Grid of life category cards (2 columns mobile, 4 columns desktop):
Investments: Shows total value, daily change, mini sparkline
Projects: Active count, progress bars for top 3
Budget: Monthly spend, remaining, circular progress
Health: Latest metrics, trend indicators
Each card has hover state: border color transitions to blue, slight scale (1.02)
Pull-to-refresh on mobile with custom spinner animation
Dashboard - Expanded Investment Card State
Card expands to full width with smooth height animation (300ms)
Sub-categories fade in with stagger (Stocks, Crypto, Art, etc.)
Each sub-category shows:
Icon with subtle bounce animation on appear
Current value with live updates (number transitions)
Allocation percentage with animated pie slice
24h change with color coding
"View All" arrow animates on hover (slides right 4px)
Other cards fade to 0.7 opacity during expansion
Investment Navigation
Investment Hub - Main State
Breadcrumb trail animates in from left ("Home → Investments")
Hero section with total investment value (Display Large)
Tab navigation for asset classes (underline slides between selections)
Active tab has blue underline that animates width and position
Grid of asset class cards with:
Large icon with subtle float animation (2s loop, 4px vertical)
Asset class name in H2
Total value with currency symbol
Number of holdings in Body Small
Performance percentage with trend arrow
Floating action button for adding new investment (mobile only)
Cards lift on hover with shadow animation (0 → 8px elevation)
Investment Hub - Asset Class Selected State
Smooth page transition (slide left with parallax effect)
Breadcrumb updates with fade transition
Asset-specific header with icon and total
Filter bar slides down from top:
Platform selector (dropdown with custom styling)
Time period buttons (pill style, active state fills)
Sort options with animated chevron
List/Grid view toggle with morphing animation between icons
Content area updates with fade transition when filters change
Platform & Account Management
Platform Management Screen
Platform List - Default State
"Connected Platforms" header with count badge
Card-based layout for each platform:
Platform logo with subtle shadow
Platform name in H3
Number of accounts in Body Small
Last sync time with relative formatting
Sync button with rotation animation when clicked
Settings gear with smooth rotation on hover
"Add Platform" card with dashed border:
Plus icon with pulse animation on hover
Border animates to solid on hover
Card scales up slightly (1.02) on hover
Empty state: Illustration with floating animation, CTA button
Platform List - Add Platform Modal State
Background blurs with overlay fade in (200ms)
Modal slides up from bottom (mobile) or fades in with scale (desktop)
Search bar at top with live filtering
Platform grid with logos and names:
Supported platforms in full color
Coming soon platforms at 0.5 opacity with "Soon" badge
Hover state: card lifts, logo scales 1.1
Selected platform: checkmark badge appears with bounce animation
"Connect" button appears at bottom when platform selected
Platform Configuration - Settings State
Slide transition from platform list
Platform header with logo and name
Tabbed interface (Accounts, Fees, Advanced):
Tab indicator slides between selections
Content cross-fades between tabs
Accounts tab:
List of connected accounts with toggle switches
Account nicknames (editable on click, inline edit transition)
Remove button appears on hover with fade in
Fees tab:
Trading fee input with currency symbol
Spread percentage with info tooltip (appears on hover)
Other fees section that expands accordion-style
Save button becomes sticky on scroll with smooth transition
Investment Portfolio Management
Portfolio Overview Screen
Portfolio Overview - Main State
Total portfolio value in Display Large with live updates
Value changes with smooth number transitions (no jump)
Toggle switch for P&L view mode:
Switch animates position with spring physics
Labels fade in/out on toggle
Content below morphs between states
Performance chart (line) with:
Gradient fill under line (blue to transparent)
Hover state shows tooltip with fade in
Touch and drag on mobile for time selection
Axis labels fade in on load with stagger
Time period selector (1D, 1W, 1M, 3M, 1Y, ALL):
Active period has filled background
Background slides between selections
Chart animates data transition (morph, not redraw)
Allocation donut chart:
Draws in clockwise on load (1s duration)
Segments separate on hover with labels
Center shows selected segment details
Legend items highlight on hover
Portfolio Overview - Detailed P&L State
Toggle animates additional content in (slide down, 300ms)
P&L breakdown cards appear with stagger:
Investment P&L with stock icon
Currency Impact with exchange icon
Fees Paid with receipt icon
Each card has subtle gradient background
Numbers count up/down to values
Percentage badges with appropriate colors
Info icons with tooltips on hover
Performance Metrics Screen
Performance Metrics - Dashboard State
Grid layout of metric cards (responsive columns)
Each metric card has:
Metric name in Label style (uppercase)
Large value with appropriate formatting
Change indicator with arrow animation
Mini chart or visual indicator
Hover reveals detailed tooltip
Key metrics with unique visualizations:
Total Return: Large percentage with arrow
Sharpe Ratio: Gauge chart that animates on load
Win Rate: Pie chart with win/loss segments
Max Drawdown: Area chart with danger zone
Holding period analysis section:
Three cards for Short/Medium/Long
Color-coded borders (red/amber/green)
Performance bars that animate width on load
Success rate as circular progress
Performance Metrics - Detailed Analysis State
Clicking metric expands to full screen analysis
Smooth transition with content morph (not page change)
Detailed chart with multiple data series
Interactive legend (click to show/hide series)
Time range selector specific to metric
Export button with download animation
Insights section with AI-generated observations:
Typewriter effect for text appearance
Highlight key numbers with background animation
Stock Investment Tracking
Stock List View
Stock List - Default State
Search bar with real-time filtering:
Search icon animates to X when typing
Results update with fade transition
"No results" state with illustration
Grouped by stock with accordion behavior:
Stock symbol in H3 with company name
Total shares and average price
Current value with live price updates
P&L with color coding and percentage
Holding period badge (color-coded)
Expand chevron rotates on click
Expanded state shows:
Individual lots with purchase details
Mini chart for stock performance
Quick actions (Buy more, Sell, Details)
Sort dropdown with animated reordering
Floating filter button on mobile
Stock List - Live Update State
Price updates highlight briefly (background flash)
Numbers transition smoothly (no jump)
P&L colors transition if crossing zero
Sparklines update with new data point sliding in
Total portfolio value updates in header
"Last updated" timestamp counts up
Stock Detail View
Stock Detail - Overview Tab
Hero section with stock info:
Large symbol with company name
Current price in Display Medium
Change amount and percentage with arrow
Real-time updates with pulse animation
Key stats grid (responsive):
Shares owned across accounts
Average cost with currency
Total invested amount
Current value with live updates
Unrealized P&L with breakdown toggle
Holding period with strategy indicator
Performance chart:
Line chart with gradient fill
Toggle for 1D/1W/1M/3M/1Y/ALL
Overlay cost basis line (dashed)
Pinch to zoom on mobile
Crosshair on hover/touch
Quick actions bar:
Record Buy/Sell buttons
Share button with copy animation
Alert settings with bell icon
Stock Detail - Transactions Tab
Transaction list with:
Type badge (BUY/SELL) with colors
Date and time (relative on mobile)
Shares and price per share
Total amount in original currency
Platform badge
Swipe actions on mobile (Edit, Delete)
Grouped by month with sticky headers
Load more on scroll with spinner
Edit mode:
Inline editing with smooth transitions
Save/Cancel buttons appear
Validation feedback in real-time
Stock Detail - Analytics Tab
Performance metrics specific to stock:
Total return percentage and amount
Best/worst day performance
Volatility gauge with animation
Beta vs market (when available)
Holding period analysis:
Timeline visualization of all lots
Color-coded by holding period
Interactive (click for lot details)
P&L attribution chart:
Waterfall chart showing components
Animates in sequence on load
Interactive segments
Tax implications section:
Estimated tax on sale
Optimal lots to sell
Holding period until long-term
Data Import & Management
Import Screen
Import - Initial State
Large drop zone with dashed border:
Border animates (marching ants effect)
"Drop CSV here" with icon
Supported formats listed below
Hover state: border solid, background shift
Drag over: scale up slightly, color change
Alternative "Browse" button below
Recent imports section:
List of past imports with status
Re-import button on hover
Delete with confirmation
Import - Processing State
Drop zone morphs to progress view:
Circular progress with percentage
File name and size displayed
"Parsing..." status text
Cancel button (X) with hover state
Preview appears below as parsing completes:
Table slides in from bottom
Rows appear with stagger animation
Column headers with identified types
Mapping suggestions with confidence badges
Import - Review State
Full preview table with:
Scrollable area with sticky headers
Row numbers on left
Validation status per row (check/warning/error)
Hover highlights entire row
Click row for detailed view
Summary statistics:
Total transactions
Date range
Detected accounts
Total value
Field mapping section:
Dropdown for each column
Auto-detected mappings highlighted
Drag to reorder columns
Action buttons:
"Import All" (primary)
"Import Selected" (secondary)
"Cancel" (ghost)
Import - Success State
Success animation (checkmark draws in)
Summary of imported data:
Number of transactions
Stocks affected
Accounts updated
Quick actions:
"View Transactions" button
"Import Another" button
"Go to Portfolio" button
Confetti animation for first import
Multi-Currency & P&L Tracking
Currency Settings Screen
Currency Settings - Main State
Display mode toggle (prominent placement):
Visual toggle with icons
Mode explanation below each option
Animated transition between selections
Base currency selector:
Current flag and code
Dropdown with search
Popular currencies at top
Exchange rate settings:
Live rates toggle with status indicator
Manual rate override section (expands)
Rate source selector
Historical rates section:
Chart showing rate trends
Key dates marked (purchases)
Hover shows exact rates
P&L Display Components
P&L Toggle - Compact View
Pill-shaped toggle in card headers
Icons for each mode (Σ and ≡)
Smooth slide animation between
Tooltip on hover explains modes
Remembers preference per session
P&L Breakdown - Expanded View
Appears below totals when detailed mode active
Three columns with icons:
Investment P&L (trending icon)
Currency Impact (exchange icon)
Fees (receipt icon)
Each value animates in with count up
Color coding for positive/negative
Subtle background gradients
Mobile-Specific Optimizations
Mobile Navigation
Bottom Tab Bar
Five tabs with icons and labels
Active tab:
Icon scales up (1.2x)
Label appears with fade in
Background pill shape appears
Tap feedback: ripple effect from touch point
Swipe between tabs with page transition
Tab bar hides on scroll down, reappears on up
Mobile Gestures
Swipe Actions
List items:
Swipe right: Quick action (customizable)
Swipe left: Delete with confirmation
Rubber band effect at limits
Action buttons reveal with parallax
Cards:
Swipe down: Refresh with custom spinner
Swipe up: Expand details
Pinch: Toggle between views
Mobile Data Density
Responsive Tables
Critical columns only on mobile
Tap row for full details (slide panel)
Horizontal scroll with fade indicators
Sticky first column when scrolling
Column priorities adjustable in settings
