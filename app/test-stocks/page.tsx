'use client'

import { StockChartWidget } from '@/components/stocks/stock-chart-widget'
import { NorwegianHoldingsTable } from '@/components/stocks/norwegian-holdings-table'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { Button } from '@/components/ui/button'

export default function TestStocksPage() {
  // Generate sample chart data
  const generateSampleChartData = () => {
    const now = new Date()
    const data = []
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      const baseValue = 1847250 + Math.random() * 100000 - 50000
      const change = Math.random() * 20000 - 10000
      data.push({
        timestamp: timestamp.toISOString(),
        value: baseValue + change,
        change: change,
        changePercent: (change / baseValue) * 100,
        volume: Math.floor(Math.random() * 100000) + 50000,
      })
    }
    return data
  }

  const sampleChartData = generateSampleChartData()
  const currentValue = 1847250
  const changePercent = 2.4

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <NorwegianBreadcrumb />
      </div>

      {/* Top Menu Bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Test Aksjer</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              🧙‍♂️ Platform Wizard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              📥 Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              📤 Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Column - Chart and Holdings */}
          <div className="space-y-6 lg:col-span-3">
            {/* Stock Chart Widget */}
            <StockChartWidget
              title="Portefølje Utvikling"
              data={sampleChartData}
              currentValue={currentValue}
              changePercent={changePercent}
              onTimeRangeChange={() => {}}
            />

            {/* Norwegian Holdings Table */}
            <NorwegianHoldingsTable
              onHoldingClick={() => {}}
              onTimeRangeChange={() => {}}
            />
          </div>

          {/* Right Column - Feed and KPI */}
          <div className="space-y-6 lg:col-span-1">
            {/* Feed Panel */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Feed (Patreon)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">
                    Tesla Q3 resultater
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">
                    Equinor dividend
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-600">
                    DNB banknotater
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Panel */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Nøkkeltall
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Verdi</p>
                  <p className="text-lg font-bold text-gray-900">
                    NOK 1.847.250
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Dagens Endring</p>
                  <p className="text-lg font-bold text-green-600">+2.4%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Årets Avkastning</p>
                  <p className="text-lg font-bold text-purple-600">+15.8%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Antall Posisjoner</p>
                  <p className="text-lg font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}