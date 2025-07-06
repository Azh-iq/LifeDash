/**
 * Example usage of MobilePortfolioDashboard component
 * This file demonstrates how to integrate the mobile portfolio dashboard
 * into your application pages.
 */

'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { MobilePortfolioDashboard } from '@/components/mobile'
import { LoadingPortfolioState } from '@/components/states'

// Example: Portfolio page component
export function PortfolioPage() {
  const params = useParams()
  const portfolioId = params.id as string

  if (!portfolioId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Portfolio ID ikke funnet</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingPortfolioState type="initial" />}>
      <MobilePortfolioDashboard
        portfolioId={portfolioId}
        initialView="overview"
        showNavigation={true}
        showTopBar={true}
        className="min-h-screen"
      />
    </Suspense>
  )
}

// Example: Embedded dashboard component
export function EmbeddedPortfolioDashboard({
  portfolioId,
}: {
  portfolioId: string
}) {
  return (
    <div className="mx-auto max-w-md">
      <MobilePortfolioDashboard
        portfolioId={portfolioId}
        initialView="overview"
        showNavigation={false}
        showTopBar={false}
        className="rounded-lg bg-white shadow-lg"
      />
    </div>
  )
}

// Example: With custom handlers
export function CustomPortfolioDashboard({
  portfolioId,
}: {
  portfolioId: string
}) {
  return (
    <div className="mobile-container">
      <MobilePortfolioDashboard
        portfolioId={portfolioId}
        initialView="holdings"
        showNavigation={true}
        showTopBar={true}
      />
    </div>
  )
}

export default PortfolioPage
