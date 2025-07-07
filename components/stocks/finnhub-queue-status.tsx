'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface FinnhubQueueStatusProps {
  queueStatus: {
    total: number
    processing: number
    completed: number
    failed: number
  }
  pricesCount: number
}

export default function FinnhubQueueStatus({
  queueStatus,
  pricesCount,
}: FinnhubQueueStatusProps) {
  const { total, processing, completed, failed } = queueStatus
  const remaining = total - completed - failed
  const progress = total > 0 ? ((completed + failed) / total) * 100 : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          📊 Aksjekurser Status
          <Badge variant="outline" className="text-xs">
            Finnhub API
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Henting av kurser</span>
            <span>
              {completed + failed} / {total}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span>💾 Hentet:</span>
            <Badge variant="secondary" className="text-xs">
              {pricesCount}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>✅ Fullført:</span>
            <Badge
              variant="default"
              className="bg-green-100 text-xs text-green-800"
            >
              {completed}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>⏳ Behandler:</span>
            <Badge
              variant="default"
              className="bg-blue-100 text-xs text-blue-800"
            >
              {processing}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>⏸️ Venter:</span>
            <Badge variant="outline" className="text-xs">
              {remaining}
            </Badge>
          </div>
        </div>

        {/* Failed Status */}
        {failed > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span>❌ Feilet:</span>
            <Badge variant="destructive" className="text-xs">
              {failed}
            </Badge>
          </div>
        )}

        {/* Rate Limit Info */}
        <div className="border-t pt-2 text-xs text-gray-500">
          <p>Rate limit: 60 kall/minutt (gratis plan)</p>
          <p>Oppdateres automatisk hver 60. sekund</p>
        </div>
      </CardContent>
    </Card>
  )
}
