'use client'

import React, { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Floating Label Input (Modern style)
export const FloatingLabelInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string
    error?: string
  }
>(({ className, label, error, ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        {...props}
        className={cn(
          "peer w-full px-4 pt-6 pb-2 text-sm bg-white border-2 rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-0 focus:border-blue-500",
          error ? "border-red-500" : "border-gray-300 hover:border-gray-400",
          "placeholder-transparent"
        )}
        placeholder={label}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          setHasValue(e.target.value !== '')
          props.onBlur?.(e)
        }}
        onChange={(e) => {
          setHasValue(e.target.value !== '')
          props.onChange?.(e)
        }}
      />
      <label
        className={cn(
          "absolute left-4 transition-all duration-200 pointer-events-none",
          "text-gray-500 transform origin-left",
          focused || hasValue || props.value
            ? "top-2 text-xs scale-75 text-blue-500"
            : "top-4 text-sm scale-100"
        )}
      >
        {label}
      </label>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
})
FloatingLabelInput.displayName = 'FloatingLabelInput'

// Neon Glow Input
export const NeonGlowInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    glowColor?: 'blue' | 'purple' | 'green' | 'pink'
  }
>(({ className, glowColor = 'blue', ...props }, ref) => {
  const [focused, setFocused] = useState(false)
  
  const glowColors = {
    blue: 'shadow-blue-500/50 border-blue-500',
    purple: 'shadow-purple-500/50 border-purple-500', 
    green: 'shadow-green-500/50 border-green-500',
    pink: 'shadow-pink-500/50 border-pink-500'
  }

  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "w-full px-4 py-3 bg-gray-900 text-white border-2 rounded-lg transition-all duration-300",
        "focus:outline-none placeholder-gray-400",
        focused 
          ? `${glowColors[glowColor]} shadow-lg`
          : "border-gray-600 hover:border-gray-500",
        className
      )}
      onFocus={(e) => {
        setFocused(true)
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        props.onBlur?.(e)
      }}
    />
  )
})
NeonGlowInput.displayName = 'NeonGlowInput'

// Animated Toggle Switch
export const AnimatedToggle = ({ 
  checked, 
  onChange, 
  label, 
  className,
  disabled = false 
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
}) => {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out",
          checked ? "bg-blue-600" : "bg-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
      >
        <motion.span
          layout
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
          animate={{ scale: checked ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        />
      </button>
      {label && (
        <span className={cn("text-sm font-medium", disabled && "text-gray-400")}>
          {label}
        </span>
      )}
    </div>
  )
}

// Cyberpunk Checkbox
export const CyberpunkCheckbox = ({
  checked,
  onChange,
  label,
  className
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}) => {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-5 h-5 border-2 border-cyan-400 bg-gray-900 rounded transition-all duration-300",
          checked && "bg-cyan-400 shadow-cyan-400/50 shadow-lg",
          "hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        )}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="w-3 h-3 text-gray-900 absolute inset-0 m-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </motion.svg>
        )}
      </button>
      {label && (
        <span className="text-sm font-medium text-gray-300">{label}</span>
      )}
    </div>
  )
}

// Morphing Button (Changes shape and content)
export const MorphingSubmitButton = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean
  loadingText?: string
}) => {
  return (
    <motion.button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg",
        "transition-all duration-300 overflow-hidden",
        "hover:from-blue-700 hover:to-purple-700 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      animate={{
        width: isLoading ? 48 : "auto"
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        animate={{ 
          opacity: isLoading ? 0 : 1,
          scale: isLoading ? 0.8 : 1
        }}
        transition={{ duration: 0.2 }}
        className="block"
      >
        {children}
      </motion.span>
      
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </motion.button>
  )
}

// Glitch Text Input (Cyberpunk style)
export const GlitchInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    glitchText?: string
  }
>(({ className, glitchText = "INPUT", ...props }, ref) => {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        className={cn(
          "w-full px-4 py-3 bg-black text-green-400 font-mono text-sm border border-green-500 rounded",
          "focus:outline-none focus:border-green-300 transition-all duration-200",
          "placeholder-green-600",
          focused && "animate-pulse",
          className
        )}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
      />
      {focused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -top-6 left-0 text-xs text-green-400 font-mono"
        >
          &gt; {glitchText}_
        </motion.div>
      )}
    </div>
  )
})
GlitchInput.displayName = 'GlitchInput'

// Liquid Progress Bar
export const LiquidProgressBar = ({
  progress,
  className,
  animated = true
}: {
  progress: number
  className?: string
  animated?: boolean
}) => {
  return (
    <div className={cn("relative w-full h-4 bg-gray-200 rounded-full overflow-hidden", className)}>
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
      >
        {animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
    </div>
  )
}

// Neumorphic Button
export const NeumorphicButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'light' | 'dark'
  }
>(({ className, children, variant = 'light', ...props }, ref) => {
  const [pressed, setPressed] = useState(false)

  const lightStyles = cn(
    "bg-gray-100 text-gray-800 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]",
    pressed && "shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]"
  )

  const darkStyles = cn(
    "bg-gray-800 text-gray-200 shadow-[8px_8px_16px_#1a1a1a,-8px_-8px_16px_#2e2e2e]",
    pressed && "shadow-[inset_8px_8px_16px_#1a1a1a,inset_-8px_-8px_16px_#2e2e2e]"
  )

  return (
    <motion.button
      ref={ref}
      {...props}
      className={cn(
        "px-6 py-3 rounded-xl font-medium transition-all duration-200",
        "focus:outline-none active:scale-95",
        variant === 'light' ? lightStyles : darkStyles,
        className
      )}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
})
NeumorphicButton.displayName = 'NeumorphicButton'