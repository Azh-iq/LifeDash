import WidgetSystemDemo from '@/components/widgets/widget-demo'

export default function WidgetDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Widget System Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the complete widget board system with real-time updates, drag & drop, and database persistence.
          </p>
        </div>
        
        <WidgetSystemDemo />
      </div>
    </div>
  )
}