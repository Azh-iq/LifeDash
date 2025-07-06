'use client'

import { useState } from 'react'
import {
  PortfolioPerformanceChart,
  AssetAllocationChart,
  TimeRangeSelector,
  ChartControls,
  PerformanceComparisonChart,
  useTimeRange,
  useChartConfig,
  createPortfolioComparison,
  createBenchmarkComparison,
} from './index'

// Example data
const mockPortfolioData = [
  {
    date: '2024-01-01',
    value: 100000,
    change: 0,
    changePercent: 0,
    timestamp: Date.now(),
  },
  {
    date: '2024-01-15',
    value: 102000,
    change: 2000,
    changePercent: 2,
    timestamp: Date.now(),
  },
  {
    date: '2024-02-01',
    value: 98000,
    change: -2000,
    changePercent: -2,
    timestamp: Date.now(),
  },
  {
    date: '2024-02-15',
    value: 105000,
    change: 5000,
    changePercent: 5,
    timestamp: Date.now(),
  },
  {
    date: '2024-03-01',
    value: 107000,
    change: 7000,
    changePercent: 7,
    timestamp: Date.now(),
  },
]

const mockAllocationData = [
  { name: 'Equinor', value: 45000, percentage: 45, color: '#1e40af' },
  { name: 'DNB', value: 25000, percentage: 25, color: '#3b82f6' },
  { name: 'Telenor', value: 20000, percentage: 20, color: '#60a5fa' },
  { name: 'Norsk Hydro', value: 10000, percentage: 10, color: '#93c5fd' },
]

const mockComparisonData = [
  createPortfolioComparison(
    'my-portfolio',
    'Min portefølje',
    mockPortfolioData,
    '#1e40af',
    {
      currentValue: 107000,
      totalReturn: 7000,
      totalReturnPercent: 7,
    }
  ),
  createBenchmarkComparison(
    'OSEBX',
    [
      { date: '2024-01-01', 'benchmark-osebx': 100000, timestamp: Date.now() },
      { date: '2024-01-15', 'benchmark-osebx': 101000, timestamp: Date.now() },
      { date: '2024-02-01', 'benchmark-osebx': 99000, timestamp: Date.now() },
      { date: '2024-02-15', 'benchmark-osebx': 103000, timestamp: Date.now() },
      { date: '2024-03-01', 'benchmark-osebx': 104000, timestamp: Date.now() },
    ],
    '#6b7280'
  ),
]

export const ChartExample = () => {
  const { selectedRange, setSelectedRange } = useTimeRange()
  const { config, updateConfig } = useChartConfig()
  const [showChartControls, setShowChartControls] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio Charts Example</h1>
        <button
          onClick={() => setShowChartControls(!showChartControls)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showChartControls ? 'Hide' : 'Show'} Controls
        </button>
      </div>

      {/* Chart Controls */}
      {showChartControls && (
        <ChartControls
          config={config}
          onConfigChange={updateConfig}
          className="mb-6"
        />
      )}

      {/* Time Range Selector */}
      <div className="flex justify-center">
        <TimeRangeSelector
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      {/* Portfolio Performance Chart */}
      <PortfolioPerformanceChart
        data={mockPortfolioData}
        title="Portfolio Performance"
        height={400}
        showArea={config.showArea}
        showGrid={config.showGrid}
        showLegend={config.showLegend}
        timeRange={selectedRange}
      />

      {/* Asset Allocation Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AssetAllocationChart
          data={mockAllocationData}
          title="Asset Allocation (Donut)"
          chartType="donut"
          height={300}
        />
        <AssetAllocationChart
          data={mockAllocationData}
          title="Asset Allocation (Bar)"
          chartType="bar"
          height={300}
        />
      </div>

      {/* Performance Comparison Chart */}
      <PerformanceComparisonChart
        comparisons={mockComparisonData}
        title="Portfolio vs Benchmark"
        height={400}
        showGrid={config.showGrid}
        showLegend={config.showLegend}
        timeRange={selectedRange}
      />
    </div>
  )
}

export default ChartExample
