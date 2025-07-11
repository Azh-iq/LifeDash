'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BlurredGradientSpinner,
  NeonLoadingDots,
  MorphingCubeLoader,
  DNAHelixLoader,
  GlitchLoader,
  LiquidBlob,
  FinancialGrowthLoader,
  ParticleOrbitLoader,
  LifeDashLogo
} from '@/components/ui/uiverse-copied-loaders'
import {
  NeonButton,
  GlassButton,
  LiquidButton,
  MagneticButton,
  PulseButton,
  MorphingButton
} from '@/components/ui/uiverse-buttons'
import {
  FloatingLabelInput,
  NeonGlowInput,
  AnimatedToggle,
  CyberpunkCheckbox,
  MorphingSubmitButton,
  GlitchInput,
  LiquidProgressBar,
  NeumorphicButton
} from '@/components/ui/uiverse-form-controls'
import {
  GlassmorphismCard,
  NeonBorderCard,
  FloatingCard,
  TiltCard,
  MorphingCard,
  ParticleCard,
  HolographicCard,
  FinancialStatsCard
} from '@/components/ui/uiverse-cards'
import { StockChartLoader, CompactStockLoader } from '@/components/ui/investment-page-loader'
import { LoadingState } from '@/components/ui/loading-states'
import { TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react'

export default function UIShowcasePage() {
  const [toggleState, setToggleState] = useState(false)
  const [checkboxState, setCheckboxState] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(65)

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <LifeDashLogo size={60} animated={true} showText={true} className="justify-center mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ✨ LifeDash UI Showcase ✨
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            En samling av fantastiske UI-komponenter inspirert av uiverse.io og designet for LifeDash
          </p>
        </motion.div>

        {/* Amazing Loaders Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🔄 Amazing Loaders</h2>
          
          {/* Main Loaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4 text-white">Blurred Gradient Spinner</h3>
              <div className="flex justify-center">
                <BlurredGradientSpinner size={80} />
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4 text-white">Financial Growth Loader</h3>
              <div className="flex justify-center">
                <FinancialGrowthLoader />
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4 text-white">Liquid Blob</h3>
              <div className="flex justify-center">
                <LiquidBlob size={60} />
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4 text-white">DNA Helix</h3>
              <div className="flex justify-center">
                <DNAHelixLoader />
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4 text-white">Particle Orbit</h3>
              <div className="flex justify-center">
                <ParticleOrbitLoader size={80} />
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4 text-white">Neon Loading Dots</h3>
              <div className="flex justify-center">
                <NeonLoadingDots />
              </div>
            </GlassmorphismCard>
          </div>

          {/* Special Financial Loaders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <NeonBorderCard glowColor="green">
              <h3 className="text-lg font-semibold mb-4 text-white">Stock Chart Loader (Investment Pages)</h3>
              <CompactStockLoader showText={true} />
            </NeonBorderCard>

            <NeonBorderCard glowColor="purple">
              <h3 className="text-lg font-semibold mb-4 text-white">Glitch Effect</h3>
              <div className="flex justify-center">
                <GlitchLoader text="LIFEDASH" />
              </div>
            </NeonBorderCard>
          </div>
        </section>

        {/* Amazing Buttons Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🚀 Amazing Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FloatingCard>
              <h3 className="text-lg font-semibold mb-4">Neon Buttons</h3>
              <div className="space-y-4">
                <NeonButton variant="blue">Blue Neon</NeonButton>
                <NeonButton variant="purple">Purple Neon</NeonButton>
                <NeonButton variant="green">Green Neon</NeonButton>
              </div>
            </FloatingCard>

            <FloatingCard>
              <h3 className="text-lg font-semibold mb-4">Glass & Liquid</h3>
              <div className="space-y-4 bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-lg">
                <GlassButton>Glass Button</GlassButton>
                <LiquidButton color="purple">Liquid Effect</LiquidButton>
              </div>
            </FloatingCard>

            <FloatingCard>
              <h3 className="text-lg font-semibold mb-4">Interactive Effects</h3>
              <div className="space-y-4">
                <MagneticButton>Magnetic Button</MagneticButton>
                <PulseButton>Pulse Button</PulseButton>
                <MorphingButton 
                  morphText="✓ Done!"
                  icon={<TrendingUp size={16} />}
                >
                  Morphing Button
                </MorphingButton>
              </div>
            </FloatingCard>

            <FloatingCard>
              <h3 className="text-lg font-semibold mb-4">Neumorphic Design</h3>
              <div className="space-y-4 bg-gray-100 p-4 rounded-lg">
                <NeumorphicButton variant="light">Light Theme</NeumorphicButton>
              </div>
              <div className="space-y-4 bg-gray-800 p-4 rounded-lg mt-4">
                <NeumorphicButton variant="dark">Dark Theme</NeumorphicButton>
              </div>
            </FloatingCard>

            <FloatingCard>
              <h3 className="text-lg font-semibold mb-4">Morphing Submit</h3>
              <div className="space-y-4">
                <MorphingSubmitButton 
                  isLoading={isLoading}
                  onClick={handleLoadingDemo}
                  loadingText="Processing..."
                >
                  Submit Form
                </MorphingSubmitButton>
                <p className="text-sm text-gray-600">Click to see loading animation</p>
              </div>
            </FloatingCard>
          </div>
        </section>

        {/* Form Controls Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📝 Form Controls</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TiltCard>
              <h3 className="text-lg font-semibold mb-6">Modern Inputs</h3>
              <div className="space-y-6">
                <FloatingLabelInput label="Email Address" type="email" />
                <FloatingLabelInput label="Password" type="password" error="Password too short" />
                
                <div className="bg-gray-900 p-4 rounded-lg">
                  <NeonGlowInput 
                    placeholder="Neon glow input..."
                    glowColor="cyan"
                    className="mb-4"
                  />
                  <GlitchInput 
                    placeholder="Enter command..."
                    glitchText="TERMINAL"
                  />
                </div>
              </div>
            </TiltCard>

            <TiltCard>
              <h3 className="text-lg font-semibold mb-6">Toggles & Progress</h3>
              <div className="space-y-6">
                <AnimatedToggle 
                  checked={toggleState}
                  onChange={setToggleState}
                  label="Enable notifications"
                />
                
                <div className="bg-gray-900 p-4 rounded-lg">
                  <CyberpunkCheckbox
                    checked={checkboxState}
                    onChange={setCheckboxState}
                    label="Cyberpunk style checkbox"
                  />
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Liquid Progress: {progress}%</p>
                  <LiquidProgressBar progress={progress} />
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={() => setProgress(Math.max(0, progress - 10))}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    >
                      -10%
                    </button>
                    <button 
                      onClick={() => setProgress(Math.min(100, progress + 10))}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                    >
                      +10%
                    </button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* Amazing Cards Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🎴 Amazing Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MorphingCard>
              <h3 className="text-lg font-semibold mb-2">Morphing Card</h3>
              <p className="text-white/80">Hover to see shape change</p>
            </MorphingCard>

            <ParticleCard particleCount={15}>
              <h3 className="text-lg font-semibold mb-2 text-white">Particle Card</h3>
              <p className="text-gray-300">Floating particles effect</p>
            </ParticleCard>

            <HolographicCard>
              <h3 className="text-lg font-semibold mb-2 text-white">Holographic</h3>
              <p className="text-gray-300">Move mouse to see effect</p>
            </HolographicCard>

            <FinancialStatsCard
              title="Total Portfolio Value"
              value="NOK 1,234,567"
              change="+45,678"
              changePercent={3.8}
              trend="up"
              icon={<DollarSign size={24} />}
            />

            <FinancialStatsCard
              title="Monthly Performance"
              value="-2.1%"
              change="-1,234"
              changePercent={-2.1}
              trend="down"
              icon={<BarChart3 size={24} />}
            />

            <FinancialStatsCard
              title="Active Investments"
              value="24"
              change="+2"
              changePercent={9.1}
              trend="up"
              icon={<Users size={24} />}
            />
          </div>
        </section>

        {/* LoadingState Variants */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🔄 LoadingState Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FloatingCard>
              <LoadingState variant="financial" text="Loading financial data..." />
            </FloatingCard>
            
            <FloatingCard>
              <LoadingState variant="neon" text="Syncing with APIs..." />
            </FloatingCard>
            
            <FloatingCard>
              <LoadingState variant="liquid" text="Processing transactions..." />
            </FloatingCard>
            
            <FloatingCard>
              <LoadingState variant="orbital" text="Calculating metrics..." />
            </FloatingCard>
            
            <FloatingCard>
              <LoadingState variant="glitch" text="Hacking the mainframe..." />
            </FloatingCard>
          </div>
        </section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-gray-600 mb-4">
            ✨ All components are responsive, accessible, and built with Framer Motion ✨
          </p>
          <p className="text-sm text-gray-500">
            Components inspired by uiverse.io • Built for LifeDash • Made with ❤️
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
