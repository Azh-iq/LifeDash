'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Quantum Loader - DNA Helix Style
export const QuantumLoader = ({ size = 40, className }: { size?: number; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border-4 border-transparent rounded-full"
            style={{
              borderTopColor: ['#3b82f6', '#8b5cf6', '#06d6a0'][i],
              borderRightColor: ['#3b82f6', '#8b5cf6', '#06d6a0'][i],
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.5 + i * 0.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2
            }}
          />
        ))}
        <motion.div
          className="absolute inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}

// Neural Network Loader
export const NeuralLoader = ({ size = 50, className }: { size?: number; className?: string }) => {
  const nodes = [
    { x: 0, y: 0 }, { x: 1, y: 0.3 }, { x: 2, y: 0 },
    { x: 0.5, y: 1 }, { x: 1.5, y: 1.2 }, { x: 1, y: 2 }
  ]

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative" style={{ width: size * 2, height: size * 2 }}>
        <svg width={size * 2} height={size * 2} className="absolute inset-0">
          {/* Connections */}
          {nodes.map((node, i) => 
            nodes.slice(i + 1).map((otherNode, j) => (
              <motion.line
                key={`${i}-${j}`}
                x1={node.x * size * 0.8 + size * 0.2}
                y1={node.y * size * 0.8 + size * 0.2}
                x2={otherNode.x * size * 0.8 + size * 0.2}
                y2={otherNode.y * size * 0.8 + size * 0.2}
                stroke="url(#gradient)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: (i + j) * 0.1
                }}
              />
            ))
          )}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"
            style={{ 
              left: node.x * size * 0.8 + size * 0.2 - 6,
              top: node.y * size * 0.8 + size * 0.2 - 6
            }}
            animate={{ 
              scale: [1, 1.5, 1],
              boxShadow: [
                '0 0 0 0 rgba(59, 130, 246, 0.7)',
                '0 0 0 10px rgba(59, 130, 246, 0)',
                '0 0 0 0 rgba(59, 130, 246, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Liquid Wave Loader
export const LiquidLoader = ({ size = 60, className }: { size?: number; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className="relative rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100"
        style={{ width: size, height: size }}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
          style={{ backgroundSize: '200% 100%' }}
          animate={{
            backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'],
            height: ['20%', '80%', '20%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  )
}

// Matrix Rain Loader
export const MatrixLoader = ({ size = 80, className }: { size?: number; className?: string }) => {
  const chars = ['0', '1', 'LifeDash', '$', '€', '₹', '¥']
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className="relative bg-black/90 rounded-lg overflow-hidden"
        style={{ width: size, height: size }}
      >
        {[0, 1, 2, 3, 4].map((col) => (
          <motion.div
            key={col}
            className="absolute top-0 flex flex-col items-center text-green-400 text-xs font-mono"
            style={{ left: `${col * 20}%`, width: '20%' }}
            animate={{ y: [-20, size + 20] }}
            transition={{
              duration: 2 + col * 0.3,
              repeat: Infinity,
              ease: "linear",
              delay: col * 0.5
            }}
          >
            {chars.map((char, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1.5
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Morphing Shapes Loader
export const MorphingLoader = ({ size = 50, className }: { size?: number; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className="bg-gradient-to-br from-purple-500 to-pink-500"
        style={{ width: size, height: size }}
        animate={{
          borderRadius: [
            "20% 80% 80% 20%",
            "80% 20% 20% 80%", 
            "50% 50% 50% 50%",
            "20% 80% 80% 20%"
          ],
          rotate: [0, 90, 180, 360],
          scale: [1, 1.2, 0.8, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

// Particle System Loader
export const ParticleLoader = ({ size = 60, className }: { size?: number; className?: string }) => {
  const particles = Array.from({ length: 8 }, (_, i) => i)
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {particles.map((particle) => (
          <motion.div
            key={particle}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -4,
              marginTop: -4
            }}
            animate={{
              x: [0, Math.cos(particle * Math.PI / 4) * (size / 2 - 8)],
              y: [0, Math.sin(particle * Math.PI / 4) * (size / 2 - 8)],
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: particle * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Financial Chart Loader (Perfect for LifeDash!)
export const FinancialLoader = ({ size = 60, className }: { size?: number; className?: string }) => {
  const bars = Array.from({ length: 5 }, (_, i) => i)
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-end gap-1" style={{ height: size }}>
        {bars.map((bar) => (
          <motion.div
            key={bar}
            className="bg-gradient-to-t from-green-500 to-emerald-400 rounded-t"
            style={{ width: size / 8 }}
            animate={{
              height: [size * 0.2, size * 0.8, size * 0.3, size * 0.9, size * 0.2],
              backgroundColor: [
                'rgb(34, 197, 94)',
                'rgb(239, 68, 68)',
                'rgb(34, 197, 94)',
                'rgb(239, 68, 68)',
                'rgb(34, 197, 94)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: bar * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Trend Line */}
        <motion.div
          className="absolute"
          style={{ width: size, height: 2 }}
          animate={{
            x: [-size, size],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </motion.div>
      </div>
    </div>
  )
}

// Pulsing Logo Loader (for LifeDash branding)
export const PulsingLogoLoader = ({ size = 80, className }: { size?: number; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.8, 0.3],
            borderColor: [
              'rgba(59, 130, 246, 0.3)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(59, 130, 246, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-2 border-2 border-purple-500/50 rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: 360
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
        />
        
        {/* Center logo placeholder */}
        <motion.div
          className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          L
        </motion.div>
      </motion.div>
    </div>
  )
}

// Combined Loader with text
export const LifeDashLoader = ({ 
  size = 60, 
  showText = true, 
  text = "Laster...", 
  className 
}: { 
  size?: number
  showText?: boolean
  text?: string
  className?: string 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <FinancialLoader size={size} />
      {showText && (
        <motion.p
          className="text-gray-600 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}