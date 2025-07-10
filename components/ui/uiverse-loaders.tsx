'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Spinning Gradient Ring Loader (Based on popular uiverse.io pattern)
export const SpinningRingLoader = ({ className, size = "w-12 h-12" }: { className?: string, size?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div className={cn("relative", size)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900"></div>
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
    </div>
  </div>
)

// Glowing Dots Loader
export const GlowingDotsLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex space-x-2", className)}>
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-bounce"
        style={{
          animationDelay: `${index * 0.2}s`,
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
          filter: 'blur(0.5px)'
        }}
      ></div>
    ))}
  </div>
)

// Pulsing Circle Loader
export const PulsingCircleLoader = ({ className, size = "w-16 h-16" }: { className?: string, size?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div className={cn("relative", size)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-ping opacity-75"></div>
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-ping animation-delay-75 opacity-75"></div>
      <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
    </div>
  </div>
)

// Matrix Style Digital Rain Loader
export const DigitalRainLoader = ({ className }: { className?: string }) => (
  <div className={cn("relative w-20 h-16 bg-black rounded overflow-hidden", className)}>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="absolute top-0 w-1 h-full bg-gradient-to-b from-green-400 to-transparent opacity-80 animate-pulse"
        style={{
          left: `${i * 20}%`,
          animationDelay: `${i * 0.3}s`,
          animation: `matrix-rain 2s linear infinite ${i * 0.3}s`
        }}
      ></div>
    ))}
    <style jsx>{`
      @keyframes matrix-rain {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(100%); opacity: 0; }
      }
    `}</style>
  </div>
)

// Liquid Morph Loader
export const LiquidMorphLoader = ({ className, size = "w-12 h-12" }: { className?: string, size?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div 
      className={cn("bg-gradient-to-br from-violet-500 to-purple-600", size)}
      style={{
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        animation: 'morphing 2s ease-in-out infinite'
      }}
    ></div>
    <style jsx>{`
      @keyframes morphing {
        0% {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          transform: rotate(0deg);
        }
        50% {
          border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          transform: rotate(180deg);
        }
        100% {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
)

// Card Flip Loader
export const CardFlipLoader = ({ className }: { className?: string }) => (
  <div className={cn("relative w-12 h-16", className)}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg animate-pulse shadow-lg"></div>
    <div 
      className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg"
      style={{
        animation: 'cardFlip 1.5s ease-in-out infinite',
        transformStyle: 'preserve-3d'
      }}
    ></div>
    <style jsx>{`
      @keyframes cardFlip {
        0%, 100% { transform: rotateY(0deg); }
        50% { transform: rotateY(180deg); }
      }
    `}</style>
  </div>
)

// Financial Chart Bars Loader (Perfect for LifeDash!)
export const FinancialBarsLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-end space-x-1 h-12", className)}>
    {[0.4, 0.8, 0.6, 1, 0.7].map((height, index) => (
      <div
        key={index}
        className="w-2 bg-gradient-to-t from-emerald-500 to-green-400 rounded-t animate-bounce"
        style={{
          height: `${height * 100}%`,
          animationDelay: `${index * 0.1}s`,
          animationDuration: '1s'
        }}
      ></div>
    ))}
  </div>
)

// Hexagon Spinner Loader
export const HexagonSpinnerLoader = ({ className, size = "w-12 h-12" }: { className?: string, size?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div 
      className={cn("bg-gradient-to-r from-blue-500 to-purple-600", size)}
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        animation: 'hexSpin 2s linear infinite'
      }}
    ></div>
    <style jsx>{`
      @keyframes hexSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// Wave Loader
export const WaveLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center space-x-1", className)}>
    {[0, 1, 2, 3, 4].map((index) => (
      <div
        key={index}
        className="w-1 h-8 bg-gradient-to-t from-blue-500 to-purple-500 rounded animate-pulse"
        style={{
          animationDelay: `${index * 0.1}s`,
          animation: `wave 1.2s ease-in-out infinite ${index * 0.1}s`
        }}
      ></div>
    ))}
    <style jsx>{`
      @keyframes wave {
        0%, 40%, 100% { transform: scaleY(0.4); }
        20% { transform: scaleY(1); }
      }
    `}</style>
  </div>
)

// Orbital Loader
export const OrbitalLoader = ({ className, size = "w-16 h-16" }: { className?: string, size?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className={cn("relative", size)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500"
          style={{
            animation: `orbit 2s linear infinite`,
            animationDelay: `${index * 0.3}s`,
            transform: `scale(${1 - index * 0.2})`
          }}
        ></div>
      ))}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
    </div>
    <style jsx>{`
      @keyframes orbit {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// LifeDash Branded Loader - Modern Logo + Animation
export const LifeDashBrandedLoader = ({ 
  className, 
  showText = true, 
  text = "Laster LifeDash...",
  size = "w-20 h-20" 
}: { 
  className?: string
  showText?: boolean
  text?: string
  size?: string 
}) => (
  <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
    {/* Logo Container */}
    <div className={cn("relative flex items-center justify-center", size)}>
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin opacity-80"></div>
      
      {/* Inner Ring */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-spin animation-reverse opacity-60"></div>
      
      {/* Center Logo */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
        L
      </div>
      
      {/* Pulsing Effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-ping"></div>
    </div>
    
    {/* Loading Text */}
    {showText && (
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium animate-pulse">
          {text}
        </p>
        <div className="flex space-x-1 mt-2 justify-center">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-1 h-1 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: `${index * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    )}
    
    <style jsx>{`
      .animation-reverse {
        animation-direction: reverse;
      }
    `}</style>
  </div>
)

// Export all loaders as a collection
export const UiverseLoaders = {
  SpinningRingLoader,
  GlowingDotsLoader,
  PulsingCircleLoader,
  DigitalRainLoader,
  LiquidMorphLoader,
  CardFlipLoader,
  FinancialBarsLoader,
  HexagonSpinnerLoader,
  WaveLoader,
  OrbitalLoader,
  LifeDashBrandedLoader
}