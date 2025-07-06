'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown, ZoomIn, ZoomOut } from 'lucide-react'

interface ChartDataPoint {
  date: string
  value: number
  timestamp: number
}

interface MobileChartProps {
  data: ChartDataPoint[]
  title: string
  className?: string
  height?: number
  showControls?: boolean
  enableGestures?: boolean
  onDataPointSelect?: (point: ChartDataPoint) => void
}

const MobileChart = memo(
  ({
    data,
    title,
    className,
    height = 200,
    showControls = true,
    enableGestures = true,
    onDataPointSelect,
  }: MobileChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 })
    const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(
      null
    )
    const [isLoading, setIsLoading] = useState(false)

    // Calculate chart metrics
    const chartData = data.length > 0 ? data : []
    const minValue = Math.min(...chartData.map(d => d.value))
    const maxValue = Math.max(...chartData.map(d => d.value))
    const valueRange = maxValue - minValue
    const isPositive =
      chartData.length > 1 &&
      chartData[chartData.length - 1].value > chartData[0].value

    // Draw chart function
    const drawChart = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas || chartData.length === 0) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size for retina displays
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Apply zoom and pan
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      // Chart dimensions
      const padding = 20
      const chartWidth = rect.width - 2 * padding
      const chartHeight = rect.height - 2 * padding

      // Draw grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
      ctx.lineWidth = 1

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, rect.height - padding)
        ctx.stroke()
      }

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (i / 5) * chartHeight
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(rect.width - padding, y)
        ctx.stroke()
      }

      // Draw chart line
      ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Create gradient
      const gradient = ctx.createLinearGradient(
        0,
        padding,
        0,
        rect.height - padding
      )
      gradient.addColorStop(
        0,
        isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
      )
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')

      // Draw area
      ctx.fillStyle = gradient
      ctx.beginPath()
      chartData.forEach((point, index) => {
        const x = padding + (index / (chartData.length - 1)) * chartWidth
        const y =
          rect.height -
          padding -
          ((point.value - minValue) / valueRange) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.lineTo(padding + chartWidth, rect.height - padding)
      ctx.lineTo(padding, rect.height - padding)
      ctx.closePath()
      ctx.fill()

      // Draw line
      ctx.beginPath()
      chartData.forEach((point, index) => {
        const x = padding + (index / (chartData.length - 1)) * chartWidth
        const y =
          rect.height -
          padding -
          ((point.value - minValue) / valueRange) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw data points
      ctx.fillStyle = isPositive ? '#22c55e' : '#ef4444'
      chartData.forEach((point, index) => {
        const x = padding + (index / (chartData.length - 1)) * chartWidth
        const y =
          rect.height -
          padding -
          ((point.value - minValue) / valueRange) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })

      // Highlight selected point
      if (selectedPoint) {
        const selectedIndex = chartData.findIndex(
          p => p.timestamp === selectedPoint.timestamp
        )
        if (selectedIndex !== -1) {
          const x =
            padding + (selectedIndex / (chartData.length - 1)) * chartWidth
          const y =
            rect.height -
            padding -
            ((selectedPoint.value - minValue) / valueRange) * chartHeight

          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }

      ctx.restore()
    }, [
      chartData,
      minValue,
      maxValue,
      valueRange,
      isPositive,
      zoom,
      pan,
      selectedPoint,
    ])

    // Handle touch events
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        if (!enableGestures) return

        e.preventDefault()
        const touch = e.touches[0]
        setLastTouch({ x: touch.clientX, y: touch.clientY })
        setIsDragging(true)

        // Handle tap to select data point
        if (e.touches.length === 1) {
          const canvas = canvasRef.current
          if (!canvas) return

          const rect = canvas.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top

          // Find closest data point
          const padding = 20
          const chartWidth = rect.width - 2 * padding
          const dataIndex = Math.round(
            ((x - padding) / chartWidth) * (chartData.length - 1)
          )

          if (dataIndex >= 0 && dataIndex < chartData.length) {
            const point = chartData[dataIndex]
            setSelectedPoint(point)
            onDataPointSelect?.(point)

            // Haptic feedback
            if ('vibrate' in navigator) {
              navigator.vibrate(50)
            }
          }
        }
      },
      [enableGestures, chartData, onDataPointSelect]
    )

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!enableGestures || !isDragging) return

        e.preventDefault()
        const touch = e.touches[0]
        const deltaX = touch.clientX - lastTouch.x
        const deltaY = touch.clientY - lastTouch.y

        // Handle pinch zoom
        if (e.touches.length === 2) {
          const touch1 = e.touches[0]
          const touch2 = e.touches[1]
          const distance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          )

          // Simple zoom implementation
          const newZoom = Math.max(0.5, Math.min(3, zoom * (distance / 100)))
          setZoom(newZoom)
        } else {
          // Pan
          setPan(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }))
        }

        setLastTouch({ x: touch.clientX, y: touch.clientY })
      },
      [enableGestures, isDragging, lastTouch, zoom]
    )

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (!enableGestures) return

        e.preventDefault()
        setIsDragging(false)
      },
      [enableGestures]
    )

    // Zoom controls
    const handleZoomIn = useCallback(() => {
      setZoom(prev => Math.min(3, prev * 1.2))
    }, [])

    const handleZoomOut = useCallback(() => {
      setZoom(prev => Math.max(0.5, prev / 1.2))
    }, [])

    const handleReset = useCallback(() => {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setSelectedPoint(null)
    }, [])

    // Redraw chart when data changes
    useEffect(() => {
      drawChart()
    }, [drawChart])

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        drawChart()
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [drawChart])

    return (
      <Card className={cn('touch-none p-4', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {chartData.length > 0 &&
                `${(((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value) * 100).toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div ref={containerRef} className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={height}
            className="w-full touch-none"
            style={{ height: `${height}px` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {selectedPoint && (
            <div className="absolute left-2 top-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
              {selectedPoint.date}: ${selectedPoint.value.toFixed(2)}
            </div>
          )}
        </div>

        {showControls && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Zoom: {zoom.toFixed(1)}x
            </div>
          </div>
        )}
      </Card>
    )
  }
)

MobileChart.displayName = 'MobileChart'

export default MobileChart
