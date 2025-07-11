'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Glassmorphism Card
export const GlassmorphismCard = ({ 
  children, 
  className,
  hover = true,
  blur = true 
}: { 
  children: React.ReactNode
  className?: string
  hover?: boolean
  blur?: boolean
}) => (
  <motion.div
    className={cn(
      "relative p-6 rounded-2xl border border-white/20",
      blur ? "backdrop-blur-md bg-white/10" : "bg-white/5",
      "shadow-xl",
      className
    )}
    whileHover={hover ? { 
      scale: 1.02,
      y: -4,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
    } : undefined}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {/* Gradient overlay */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
)

// Neon Border Card
export const NeonBorderCard = ({ 
  children, 
  className,
  glowColor = 'blue',
  animated = true 
}: { 
  children: React.ReactNode
  className?: string
  glowColor?: 'blue' | 'purple' | 'green' | 'pink' | 'cyan'
  animated?: boolean
}) => {
  const glowColors = {
    blue: 'shadow-blue-500/50 border-blue-500',
    purple: 'shadow-purple-500/50 border-purple-500',
    green: 'shadow-green-500/50 border-green-500', 
    pink: 'shadow-pink-500/50 border-pink-500',
    cyan: 'shadow-cyan-500/50 border-cyan-500'
  }

  return (
    <motion.div
      className={cn(
        "relative p-6 bg-gray-900 rounded-xl border-2 transition-all duration-300",
        glowColors[glowColor],
        className
      )}
      whileHover={animated ? {
        scale: 1.02,
        boxShadow: `0 0 30px ${glowColor === 'blue' ? 'rgba(59, 130, 246, 0.4)' : 
                                 glowColor === 'purple' ? 'rgba(139, 92, 246, 0.4)' :
                                 glowColor === 'green' ? 'rgba(34, 197, 94, 0.4)' :
                                 glowColor === 'pink' ? 'rgba(236, 72, 153, 0.4)' :
                                 'rgba(6, 182, 212, 0.4)'}`
      } : undefined}
    >
      {children}
    </motion.div>
  )
}

// Floating Card with Shadow
export const FloatingCard = ({ 
  children, 
  className,
  shadowColor = 'gray' 
}: { 
  children: React.ReactNode
  className?: string
  shadowColor?: 'gray' | 'blue' | 'purple'
}) => {
  const shadowColors = {
    gray: 'shadow-gray-300/50',
    blue: 'shadow-blue-300/50', 
    purple: 'shadow-purple-300/50'
  }

  return (
    <motion.div
      className={cn(
        "p-6 bg-white rounded-2xl shadow-lg",
        shadowColors[shadowColor],
        className
      )}
      initial={{ y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
      whileHover={{ 
        y: -8,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

// Tilt Card (3D effect)
export const TiltCard = ({ 
  children, 
  className,
  maxTilt = 15 
}: { 
  children: React.ReactNode
  className?: string
  maxTilt?: number
}) => {
  const [rotateX, setRotateX] = React.useState(0)
  const [rotateY, setRotateY] = React.useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * maxTilt
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt
    
    setRotateX(-rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      className={cn("p-6 bg-white rounded-xl shadow-lg cursor-pointer", className)}
      style={{ transformStyle: 'preserve-3d' }}
      animate={{ 
        rotateX: rotateX,
        rotateY: rotateY
      }}
      transition={{ duration: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

// Morphing Card (Shape changes)
export const MorphingCard = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string
}) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.div
      className={cn("p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white", className)}
      style={{
        borderRadius: isHovered ? '50px' : '20px'
      }}
      animate={{
        borderRadius: isHovered ? '50px' : '20px'
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {children}
    </motion.div>
  )
}

// Particle Card (Floating particles effect)
export const ParticleCard = ({ 
  children, 
  className,
  particleCount = 20 
}: { 
  children: React.ReactNode
  className?: string
  particleCount?: number
}) => {
  const particles = Array.from({ length: particleCount }, (_, i) => i)

  return (
    <div className={cn("relative p-6 bg-gray-900 rounded-xl overflow-hidden", className)}>
      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Holographic Card
export const HolographicCard = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string
}) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <motion.div
      className={cn(
        "relative p-6 bg-gray-900 rounded-xl overflow-hidden cursor-pointer",
        className
      )}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.02 }}
    >
      {/* Holographic effect */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
                      rgba(139, 92, 246, 0.6) 0%, 
                      rgba(59, 130, 246, 0.4) 25%, 
                      rgba(6, 182, 212, 0.2) 50%, 
                      transparent 70%)`
        }}
      />
      
      {/* Rainbow gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

// Financial Stats Card (Perfect for LifeDash!)
export const FinancialStatsCard = ({ 
  title,
  value,
  change,
  changePercent,
  icon,
  trend = 'up',
  className 
}: { 
  title: string
  value: string | number
  change?: string | number
  changePercent?: number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}) => {
  const trendColors = {
    up: 'text-green-500 bg-green-500/10',
    down: 'text-red-500 bg-red-500/10',
    neutral: 'text-gray-500 bg-gray-500/10'
  }

  return (
    <motion.div
      className={cn(
        "p-6 bg-white rounded-xl shadow-lg border border-gray-100",
        className
      )}
      whileHover={{ 
        y: -4,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <motion.p 
            className="text-2xl font-bold text-gray-900"
            key={value}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
          {change && changePercent && (
            <div className={cn("flex items-center mt-2 text-sm", trendColors[trend])}>
              <span className="flex items-center">
                {trend === 'up' && '↗'}
                {trend === 'down' && '↘'}
                {trend === 'neutral' && '→'}
                <span className="ml-1">{change} ({changePercent}%)</span>
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-lg", trendColors[trend])}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}