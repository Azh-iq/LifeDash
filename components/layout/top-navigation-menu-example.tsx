// Example usage of TopNavigationMenu with functional CSV import
// This file shows how to integrate the TopNavigationMenu in a page

import TopNavigationMenu from './top-navigation-menu'
import { usePortfolioState } from '@/lib/hooks/use-portfolio-state'

export function ExamplePageWithTopNavigation() {
  const portfolioId = 'your-portfolio-id'
  const { refresh } = usePortfolioState(portfolioId)

  const handleImportComplete = async () => {
    // Refresh portfolio data after CSV import
    await refresh()

    // Additional logic like refetching other data
    console.log('CSV import completed and portfolio refreshed')
  }

  return (
    <div className="min-h-screen">
      <TopNavigationMenu
        portfolioId={portfolioId}
        onImportComplete={handleImportComplete}
        className="border-b border-gray-200"
      />

      {/* Your page content here */}
      <main className="container mx-auto px-4 py-6">
        <h1>Your Page Content</h1>
        <p>The top navigation includes a working CSV import modal.</p>
      </main>
    </div>
  )
}
