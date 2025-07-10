'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Blurred Gradient Spinner (From Uiverse.io by terenceodonoghue)
export const BlurredGradientSpinner = ({ className, size = 96 }: { className?: string, size?: number }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div
      className="absolute rounded-full animate-spin"
      style={{
        height: `${size}px`,
        width: `${size}px`,
        background: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
        animation: 'blurredSpin 1.2s linear infinite'
      }}
    >
      <span 
        className="absolute rounded-full h-full w-full"
        style={{
          background: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
          filter: 'blur(5px)'
        }}
      />
      <span 
        className="absolute rounded-full h-full w-full"
        style={{
          background: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
          filter: 'blur(10px)'
        }}
      />
      <span 
        className="absolute rounded-full h-full w-full"
        style={{
          background: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
          filter: 'blur(25px)'
        }}
      />
      <span 
        className="absolute rounded-full h-full w-full"
        style={{
          background: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
          filter: 'blur(50px)'
        }}
      />
      <div
        className="absolute bg-white border-white border-solid rounded-full"
        style={{
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          borderWidth: '5px'
        }}
      />
    </div>
    <style jsx>{`
      @keyframes blurredSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
)

// Neon Loading Dots (Popular on Uiverse.io)
export const NeonLoadingDots = ({ className }: { className?: string }) => (
  <div className={cn("flex space-x-2", className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-4 h-4 rounded-full"
        style={{
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          boxShadow: '0 0 20px #ff6b6b',
          animation: `neonPulse 1.4s ease-in-out infinite ${i * 0.2}s`
        }}
      />
    ))}
    <style jsx>{`
      @keyframes neonPulse {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `}</style>
  </div>
)

// Morphing Cube Loader (Inspired by Uiverse.io)
export const MorphingCubeLoader = ({ className, size = 40 }: { className?: string, size?: number }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        animation: 'morphCube 2s ease-in-out infinite',
        borderRadius: '10px'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '50%',
          animation: 'morphInner 2s ease-in-out infinite reverse'
        }}
      />
    </div>
    <style jsx>{`
      @keyframes morphCube {
        0%, 100% {
          border-radius: 10px;
          transform: rotate(0deg);
        }
        25% {
          border-radius: 50%;
          transform: rotate(45deg);
        }
        50% {
          border-radius: 10px;
          transform: rotate(90deg);
        }
        75% {
          border-radius: 50%;
          transform: rotate(135deg);
        }
      }
      
      @keyframes morphInner {
        0%, 100% {
          border-radius: 50%;
          transform: scale(0.8);
        }
        50% {
          border-radius: 10px;
          transform: scale(1.2);
        }
      }
    `}</style>
  </div>
)

// DNA Helix Loader (Creative Uiverse.io style)
export const DNAHelixLoader = ({ className }: { className?: string }) => (
  <div className={cn("relative w-12 h-16", className)}>
    <div className="absolute inset-0">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.sin((i * Math.PI) / 3) * 20 + 20}px`,
            top: `${i * 10}px`,
            background: i % 2 === 0 ? '#3b82f6' : '#8b5cf6',
            animation: `dnaMove 2s ease-in-out infinite ${i * 0.2}s`
          }}
        />
      ))}
    </div>
    <style jsx>{`
      @keyframes dnaMove {
        0%, 100% {
          transform: translateX(0px);
        }
        50% {
          transform: translateX(20px);
        }
      }
    `}</style>
  </div>
)

// Glitch Effect Loader
export const GlitchLoader = ({ className, text = "LOADING" }: { className?: string, text?: string }) => (
  <div className={cn("relative", className)}>
    <div
      className="text-2xl font-bold text-white relative"
      style={{
        textShadow: '0.05em 0 0 #00fffc, -0.03em -0.04em 0 #fc00ff, 0.025em 0.04em 0 #fffc00',
        animation: 'glitch 725ms infinite'
      }}
    >
      {text}
      <span
        className="absolute top-0 left-0"
        style={{
          animation: 'glitch 500ms infinite',
          color: '#00fffc',
          zIndex: -1
        }}
      >
        {text}
      </span>
      <span
        className="absolute top-0 left-0"
        style={{
          animation: 'glitch 375ms infinite',
          color: '#fc00ff',
          zIndex: -2
        }}
      >
        {text}
      </span>
    </div>
    <style jsx>{`
      @keyframes glitch {
        0%, 74%, 100% {
          transform: translate(0);
        }
        25% {
          transform: translate(-2px, 2px);
        }
        50% {
          transform: translate(2px, -2px);
        }
        75% {
          transform: translate(-1px, 1px);
        }
      }
    `}</style>
  </div>
)

// Liquid Loading Blob
export const LiquidBlob = ({ className, size = 60 }: { className?: string, size?: number }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        animation: 'liquidMove 8s ease-in-out infinite'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)',
          borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
          animation: 'liquidMove 6s ease-in-out infinite reverse'
        }}
      />
    </div>
    <style jsx>{`
      @keyframes liquidMove {
        0%, 100% {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          transform: translate(0px, 0px) scale(1);
        }
        25% {
          border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          transform: translate(5px, -5px) scale(1.1);
        }
        50% {
          border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
          transform: translate(-5px, 5px) scale(0.9);
        }
        75% {
          border-radius: 40% 70% 60% 30% / 40% 50% 60% 50%;
          transform: translate(2px, 2px) scale(1.05);
        }
      }
    `}</style>
  </div>
)

// Financial Growth Loader (Perfect for LifeDash!)
export const FinancialGrowthLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-end space-x-1 h-12", className)}>
    {[0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.7].map((height, index) => (
      <div
        key={index}
        className="w-2 rounded-t"
        style={{
          height: `${height * 100}%`,
          background: height > 0.6 ? 
            'linear-gradient(to top, #10b981, #34d399)' : 
            'linear-gradient(to top, #ef4444, #f87171)',
          animation: `growBar 2s ease-in-out infinite ${index * 0.1}s`
        }}
      />
    ))}
    <style jsx>{`
      @keyframes growBar {
        0%, 100% {
          transform: scaleY(0.5);
          opacity: 0.7;
        }
        50% {
          transform: scaleY(1);
          opacity: 1;
        }
      }
    `}</style>
  </div>
)

// Particle Orbit Loader
export const ParticleOrbitLoader = ({ className, size = 80 }: { className?: string, size?: number }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div
      className="relative"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `hsl(${i * 60}, 70%, 60%)`,
            top: '50%',
            left: '50%',
            transformOrigin: `0 ${size/4}px`,
            animation: `orbit 3s linear infinite ${i * 0.5}s`
          }}
        />
      ))}
      <div
        className="absolute inset-0 rounded-full border-2 border-dashed opacity-30"
        style={{
          borderColor: '#3b82f6',
          margin: `${size/4}px`
        }}
      />
    </div>
    <style jsx>{`
      @keyframes orbit {
        from {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `}</style>
  </div>
)

// LifeDash Logo Component
export const LifeDashLogo = ({ 
  className, 
  size = 40, 
  animated = false,
  showText = true 
}: { 
  className?: string
  size?: number
  animated?: boolean
  showText?: boolean 
}) => (
  <div className={cn("flex items-center space-x-3", className)}>
    <div
      className={cn("relative flex items-center justify-center rounded-xl", animated && "animate-pulse")}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)'
      }}
    >
      <div className="text-white font-bold" style={{ fontSize: `${size * 0.4}px` }}>
        L
      </div>
      {animated && (
        <div
          className="absolute inset-0 rounded-xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            animation: 'logoGlow 2s ease-in-out infinite alternate'
          }}
        />
      )}
    </div>
    {showText && (
      <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
        LifeDash
      </span>
    )}
    {animated && (
      <style jsx>{`
        @keyframes logoGlow {
          0% {
            opacity: 0.2;
            transform: scale(1);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    )}
  </div>
)