'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FinancialDashboardLoader } from '@/components/ui/investment-page-loader'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to login on root access
    router.replace('/login')
  }, [router])

  // Amazing LifeDash loading screen
  return <FinancialDashboardLoader />
}
