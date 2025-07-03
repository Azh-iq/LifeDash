'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  FinancialTable,
  useSortableTable,
} from '@/components/ui'
import {
  LineChart,
  MetricCard,
  FinancialMetricCard,
  MetricGrid,
  AmountDisplay,
  PercentageDisplay,
  DifferenceDisplay,
  ChartSkeleton,
  MetricChartSkeleton,
  DashboardChartSkeleton,
} from '@/components/shared'

// Sample data for demonstrations
const sampleFinancialData = [
  { month: 'Jan', revenue: 12500, expenses: 8200, profit: 4300 },
  { month: 'Feb', revenue: 15800, expenses: 9600, profit: 6200 },
  { month: 'Mar', revenue: 13200, expenses: 8800, profit: 4400 },
  { month: 'Apr', revenue: 18500, expenses: 11200, profit: 7300 },
  { month: 'May', revenue: 16800, expenses: 10400, profit: 6400 },
  { month: 'Jun', revenue: 19200, expenses: 12100, profit: 7100 },
]

const sampleTransactions = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Salary Payment',
    amount: 5000,
    category: 'Income',
    type: 'credit',
  },
  {
    id: '2',
    date: '2024-01-14',
    description: 'Grocery Shopping',
    amount: -120.5,
    category: 'Food',
    type: 'debit',
  },
  {
    id: '3',
    date: '2024-01-13',
    description: 'Gas Station',
    amount: -65.0,
    category: 'Transportation',
    type: 'debit',
  },
  {
    id: '4',
    date: '2024-01-12',
    description: 'Freelance Work',
    amount: 800,
    category: 'Income',
    type: 'credit',
  },
  {
    id: '5',
    date: '2024-01-11',
    description: 'Electric Bill',
    amount: -180.75,
    category: 'Utilities',
    type: 'debit',
  },
  {
    id: '6',
    date: '2024-01-10',
    description: 'Coffee Shop',
    amount: -12.5,
    category: 'Food',
    type: 'debit',
  },
  {
    id: '7',
    date: '2024-01-09',
    description: 'Online Purchase',
    amount: -89.99,
    category: 'Shopping',
    type: 'debit',
  },
  {
    id: '8',
    date: '2024-01-08',
    description: 'Investment Dividend',
    amount: 150,
    category: 'Investment',
    type: 'credit',
  },
]

const transactionColumns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    numeric: true,
    render: (value: number) => (
      <AmountDisplay
        amount={value}
        variant={value >= 0 ? 'success' : 'danger'}
        showSign={value >= 0}
      />
    ),
  },
]

export default function DataDemo() {
  const [loadingChart, setLoadingChart] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar' | 'pie'>(
    'line'
  )

  const simulateLoading = (setter: (loading: boolean) => void) => {
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Financial Data Display Components
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Comprehensive showcase of specialized components for displaying
            financial data with clarity and precision.
          </p>
        </div>

        <div className="space-y-12">
          {/* Metrics Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Financial Metrics
                </h2>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  Key performance indicators with trend analysis and visual
                  feedback.
                </p>
              </div>
              <Button
                onClick={() => simulateLoading(setLoadingMetrics)}
                variant="outline"
                size="sm"
              >
                Simulate Loading
              </Button>
            </div>

            <MetricGrid columns={4} gap="default">
              <FinancialMetricCard
                title="Total Revenue"
                value={125000}
                type="currency"
                change={12.5}
                period="vs last month"
                loading={loadingMetrics}
                icon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                }
              />

              <FinancialMetricCard
                title="Net Profit"
                value={18500}
                type="currency"
                change={-5.2}
                period="vs last month"
                loading={loadingMetrics}
                icon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                }
              />

              <FinancialMetricCard
                title="Growth Rate"
                value={8.3}
                type="percentage"
                change={2.1}
                period="vs last quarter"
                loading={loadingMetrics}
                icon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              />

              <FinancialMetricCard
                title="Total Transactions"
                value={1247}
                type="count"
                change={89}
                changeType="amount"
                period="this month"
                loading={loadingMetrics}
                icon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                }
              />
            </MetricGrid>
          </section>

          {/* Charts Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Financial Charts
                </h2>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  Interactive charts for visualizing financial trends and
                  patterns.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => simulateLoading(setLoadingChart)}
                  variant="outline"
                  size="sm"
                >
                  Simulate Loading
                </Button>
                <select
                  value={selectedChart}
                  onChange={e =>
                    setSelectedChart(e.target.value as 'line' | 'bar' | 'pie')
                  }
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            </div>

            {loadingChart ? (
              <ChartSkeleton
                size="lg"
                chartType={selectedChart}
                showTitle={true}
                showLegend={true}
                showAxes={true}
              />
            ) : (
              <LineChart
                data={sampleFinancialData}
                xAxisDataKey="month"
                lines={[
                  { dataKey: 'revenue', name: 'Revenue', color: '#3b82f6' },
                  { dataKey: 'expenses', name: 'Expenses', color: '#ef4444' },
                  { dataKey: 'profit', name: 'Profit', color: '#10b981' },
                ]}
                title="Monthly Financial Performance"
                description="Revenue, expenses, and profit trends over time"
                size="lg"
                formatYAxis={value => `$${(value / 1000).toFixed(0)}K`}
                formatTooltip={(value, name) => [
                  `$${value.toLocaleString()}`,
                  name,
                ]}
              />
            )}
          </section>

          {/* Data Table Section */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Transaction Data Table
              </h2>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Sortable financial data table with proper formatting and visual
                hierarchy.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialTable
                  data={sampleTransactions}
                  columns={transactionColumns}
                  caption="Last 8 transactions from your account"
                />
              </CardContent>
            </Card>
          </section>

          {/* Amount Display Variants */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Amount Display Components
              </h2>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Specialized components for displaying monetary values with
                proper formatting.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Currency Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Positive Amount:
                    </p>
                    <AmountDisplay amount={1250.75} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Negative Amount:
                    </p>
                    <AmountDisplay amount={-89.99} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Abbreviated:
                    </p>
                    <AmountDisplay amount={1250000} size="lg" abbreviate />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Percentage Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Growth Rate:
                    </p>
                    <PercentageDisplay value={12.5} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Decline Rate:
                    </p>
                    <PercentageDisplay value={-5.2} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      No Change:
                    </p>
                    <PercentageDisplay value={0} size="lg" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Difference Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      vs Last Month:
                    </p>
                    <DifferenceDisplay
                      current={1500}
                      previous={1200}
                      showArrow
                      size="lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Percentage Change:
                    </p>
                    <DifferenceDisplay
                      current={1500}
                      previous={1200}
                      showPercentage
                      showArrow
                      size="lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Decrease:
                    </p>
                    <DifferenceDisplay
                      current={900}
                      previous={1200}
                      showArrow
                      size="lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Loading States */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Loading States
              </h2>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Skeleton components for better perceived performance during data
                loading.
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Metric Chart Loading
                </h3>
                <MetricChartSkeleton
                  metrics={3}
                  size="default"
                  chartType="line"
                />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Dashboard Chart Loading
                </h3>
                <DashboardChartSkeleton
                  size="lg"
                  chartType="bar"
                  showControls={true}
                  showFilters={true}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
