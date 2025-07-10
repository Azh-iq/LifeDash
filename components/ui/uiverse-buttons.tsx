'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Neon Gradient Button
export const NeonButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'blue' | 'purple' | 'green' | 'pink'
    glowEffect?: boolean
  }
>(({ className, children, variant = 'blue', glowEffect = true, ...props }, ref) => {
  const variants = {
    blue: 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/50',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/50',
    green: 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-500/50',
    pink: 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/50'
  }

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative px-8 py-3 text-white font-medium rounded-xl transition-all duration-300',
        variants[variant],
        glowEffect && 'shadow-lg hover:shadow-xl',
        'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-in-out overflow-hidden',
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
})
NeonButton.displayName = 'NeonButton'

// 3D Glass Button
export const GlassButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      className={cn(
        'group relative px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium transition-all duration-300',
        'hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10',
        'active:scale-95',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
})
GlassButton.displayName = 'GlassButton'

// Liquid Button
export const LiquidButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    color?: 'blue' | 'purple' | 'green' | 'orange'
  }
>(({ className, children, color = 'blue', ...props }, ref) => {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  }

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative px-8 py-4 text-white font-semibold rounded-full overflow-hidden transition-all duration-300',
        colors[color],
        'before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent',
        'hover:before:left-[100%] before:transition-all before:duration-700',
        'shadow-lg hover:shadow-xl hover:shadow-black/25',
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
        initial={{ scale: 0, borderRadius: '50%' }}
        whileHover={{ scale: 1, borderRadius: '0%' }}
        transition={{ duration: 0.4 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
})
LiquidButton.displayName = 'LiquidButton'

// Magnetic Button
export const MagneticButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = React.useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    })
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl overflow-hidden',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        x: isHovered ? mousePosition.x * 0.1 : 0,
        y: isHovered ? mousePosition.y * 0.1 : 0
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
        animate={{
          scale: isHovered ? 1.2 : 1,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
})
MagneticButton.displayName = 'MagneticButton'

// Pulse Button
export const PulseButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    pulseColor?: string
  }
>(({ className, children, pulseColor = 'rgb(59, 130, 246)', ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative px-6 py-3 bg-blue-500 text-white font-medium rounded-lg overflow-hidden',
        'before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
        className
      )}
      style={{
        background: pulseColor,
        boxShadow: `0 0 0 0 ${pulseColor}`,
        animation: 'pulse 2s infinite'
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 ${pulseColor}80;
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px ${pulseColor}00;
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 ${pulseColor}00;
          }
        }
      `}</style>
    </motion.button>
  )
})
PulseButton.displayName = 'PulseButton'

// Morphing Button
export const MorphingButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    morphText?: string
    icon?: React.ReactNode
  }
>(({ className, children, morphText, icon, ...props }, ref) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-full overflow-hidden',
        'shadow-lg hover:shadow-xl transition-all duration-500',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <motion.div
        className="flex items-center justify-center gap-2"
        animate={{
          x: isHovered && morphText ? -20 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {icon && (
          <motion.span
            animate={{ rotate: isHovered ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.span>
        )}
        <span>{children}</span>
      </motion.div>
      
      {morphText && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ x: '100%' }}
          animate={{ x: isHovered ? 0 : '100%' }}
          transition={{ duration: 0.3 }}
        >
          {morphText}
        </motion.div>
      )}
    </motion.button>
  )
})
MorphingButton.displayName = 'MorphingButton'