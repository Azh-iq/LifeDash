'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import MultiBrokerAggregation from '@/components/portfolio/multi-broker-aggregation'

export default function AggregationPage() {
  return (
    <DashboardLayout>
      <NorwegianBreadcrumb />
      
      <div className="p-6">
        <MultiBrokerAggregation />
      </div>
    </DashboardLayout>
  )
}