'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { LifeDashLogo } from './uiverse-copied-loaders'

// Stock Chart Bouncing Bars Loader (From Uiverse.io by rushiraj_9882)
export const StockChartLoader = ({ 
  className, 
  showText = true, 
  text = "Laster investeringer..." 
}: { 
  className?: string
  showText?: boolean
  text?: string 
}) => (
  <div className={cn("w-full h-screen gap-1 pt-40 pb-40 relative flex flex-col items-center justify-center", className)}>
    {/* LifeDash Logo */}
    <div className="mb-8">
      <LifeDashLogo size={60} animated={true} showText={true} />
    </div>
    
    {/* Stock Chart Bars */}
    <div className="flex items-end gap-1 h-16 mb-6">
      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.1s]">
        <div className="w-1 h-6 bg-green-500"></div>
        <div className="w-3 h-12 bg-green-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-green-500"></div>
      </div>

      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.2s]">
        <div className="w-1 h-6 bg-red-500"></div>
        <div className="w-3 h-12 bg-red-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-red-500"></div>
      </div>

      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.3s]">
        <div className="w-1 h-6 bg-blue-500"></div>
        <div className="w-3 h-12 bg-blue-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-blue-500"></div>
      </div>

      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.1s]">
        <div className="w-1 h-6 bg-green-500"></div>
        <div className="w-3 h-12 bg-green-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-green-500"></div>
      </div>

      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.4s]">
        <div className="w-1 h-6 bg-purple-500"></div>
        <div className="w-3 h-12 bg-purple-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-purple-500"></div>
      </div>

      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.2s]">
        <div className="w-1 h-6 bg-emerald-500"></div>
        <div className="w-3 h-12 bg-emerald-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-emerald-500"></div>
      </div>

      <div className="flex flex-col items-center animate-[bounce_1s_ease-in-out_infinite_0.5s]">
        <div className="w-1 h-6 bg-cyan-500"></div>
        <div className="w-3 h-12 bg-cyan-500 rounded-sm"></div>
        <div className="w-1 h-6 bg-cyan-500"></div>
      </div>
    </div>
    
    {/* Loading Text */}
    {showText && (
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse mb-2">
          {text}
        </p>
        
        {/* Loading dots */}
        <div className="flex space-x-1 justify-center">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: `${index * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    )}
  </div>
)

// Compact version for smaller spaces
export const CompactStockLoader = ({ 
  className, 
  showText = false 
}: { 
  className?: string
  showText?: boolean 
}) => (
  <div className={cn("flex flex-col items-center justify-center p-8", className)}>
    {/* Smaller stock chart */}
    <div className="flex items-end gap-1 h-8 mb-4">
      {[
        { color: 'bg-green-500', delay: '0.1s' },
        { color: 'bg-red-500', delay: '0.2s' },
        { color: 'bg-blue-500', delay: '0.3s' },
        { color: 'bg-green-500', delay: '0.1s' },
        { color: 'bg-purple-500', delay: '0.4s' }
      ].map((bar, index) => (
        <div
          key={index}
          className={cn("w-2 h-6 rounded-sm", bar.color)}
          style={{
            animation: `bounce 1s ease-in-out infinite ${bar.delay}`
          }}
        />
      ))}
    </div>
    
    {showText && (
      <p className="text-sm text-gray-600 animate-pulse">Laster...</p>
    )}
  </div>
)

// Financial Dashboard Full Page Loader
export const FinancialDashboardLoader = ({ className }: { className?: string }) => (
  <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center", className)}>
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
    </div>
    
    <div className="relative z-10 text-center">
      {/* Main LifeDash Logo */}
      <div className="mb-12">
        <LifeDashLogo size={80} animated={true} showText={true} />
      </div>
      
      {/* Stock Chart Animation */}
      <div className="mb-8">
        <StockChartLoader showText={false} className="h-auto pt-0 pb-0" />
      </div>
      
      {/* Status Text */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Starter din portefølje
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Henter de nyeste markedsdataene og beregner porteføljemetrikker...
        </p>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{
                width: '60%',
                animation: 'progress 3s ease-in-out infinite'
              }}
            />
          </div>
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
        </div>
      </div>
    </div>
    
    <style jsx>{`
      @keyframes progress {
        0% { width: 10%; }
        50% { width: 80%; }
        100% { width: 10%; }
      }
    `}</style>
  </div>
)