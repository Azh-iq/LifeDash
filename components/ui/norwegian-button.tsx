"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  Check, 
  X, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";

const norwegianButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        investment: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
        norwegian: "bg-gradient-to-r from-red-600 via-white to-blue-600 text-gray-900 hover:shadow-lg border border-gray-200",
        premium: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        gentle: "transition-all duration-200 ease-in-out",
        bouncy: "transition-all duration-300 ease-out",
        energetic: "transition-all duration-150 ease-in-out",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      animation: "gentle",
    },
  }
);

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

interface NorwegianButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof norwegianButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  ripple?: boolean;
  haptic?: boolean;
  sound?: boolean;
  pulse?: boolean;
  shine?: boolean;
  ariaLabel?: string;
}

const NorwegianButton = React.forwardRef<HTMLButtonElement, NorwegianButtonProps>(
  ({
    className,
    variant,
    size,
    animation,
    asChild = false,
    loading = false,
    loadingText = "Laster...",
    success = false,
    error = false,
    icon,
    iconPosition = "left",
    ripple = true,
    haptic = true,
    sound = false,
    pulse = false,
    shine = false,
    children,
    ariaLabel,
    onClick,
    disabled,
    ...props
  }, ref) => {
    const [ripples, setRipples] = useState<RippleProps[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const Comp = asChild ? Slot : "button";

    // Handle success state
    useEffect(() => {
      if (success) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [success]);

    // Handle error state
    useEffect(() => {
      if (error) {
        setShowError(true);
        const timer = setTimeout(() => setShowError(false), 1000);
        return () => clearTimeout(timer);
      }
    }, [error]);

    // Ripple effect
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || loading) return;

      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple = { x, y, size };
      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 600);
    };

    // Haptic feedback simulation
    const simulateHaptic = () => {
      if (haptic && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
    };

    // Sound effect simulation (visual feedback)
    const simulateSound = () => {
      if (sound) {
        // Visual feedback for sound (could be replaced with actual audio)
        console.log("🔊 Button sound effect");
      }
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      createRipple(event);
      simulateHaptic();
      simulateSound();
      setIsPressed(true);
      
      setTimeout(() => setIsPressed(false), 150);
      
      onClick?.(event);
    };

    const getButtonContent = () => {
      if (loading) {
        return (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </motion.div>
        );
      }

      if (showSuccess) {
        return (
          <motion.div
            className="flex items-center gap-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Check className="h-4 w-4" />
            Vellykket!
          </motion.div>
        );
      }

      if (showError) {
        return (
          <motion.div
            className="flex items-center gap-2"
            animate={{ x: [0, -5, 5, -5, 5, 0] }}
            transition={{ duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
          >
            <X className="h-4 w-4" />
            Feil
          </motion.div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          {icon && iconPosition === "left" && (
            <motion.div
              animate={{ 
                rotate: isPressed ? 360 : 0,
                scale: isPressed ? 0.9 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {icon}
            </motion.div>
          )}
          
          <motion.span
            animate={{ 
              scale: isPressed ? 0.95 : 1,
              y: isPressed ? 1 : 0
            }}
            transition={{ duration: 0.1 }}
          >
            {children}
          </motion.span>
          
          {icon && iconPosition === "right" && (
            <motion.div
              animate={{ 
                x: isPressed ? 2 : 0,
                scale: isPressed ? 1.1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
        </div>
      );
    };

    return (
      <motion.div
        whileHover={{ scale: animation === "bouncy" ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
        animate={pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={pulse ? { duration: 2, repeat: Infinity } : {}}
      >
        <Comp
          ref={buttonRef}
          className={cn(
            norwegianButtonVariants({ variant, size, animation, className }),
            showError && "animate-pulse",
            shine && "relative overflow-hidden"
          )}
          onClick={handleClick}
          disabled={disabled || loading}
          aria-label={ariaLabel}
          {...props}
        >
          {/* Shine effect */}
          {shine && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            />
          )}

          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple, index) => (
              <motion.span
                key={index}
                className="absolute rounded-full bg-white/30 pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            ))}
          </AnimatePresence>

          {/* Button content */}
          {getButtonContent()}

          {/* Investment sparkles for investment variant */}
          {variant === "investment" && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="h-3 w-3 text-yellow-300" />
            </motion.div>
          )}
        </Comp>
      </motion.div>
    );
  }
);

NorwegianButton.displayName = "NorwegianButton";

// Pre-configured button variants for common use cases
export const InvestmentButton = React.forwardRef<
  HTMLButtonElement,
  Omit<NorwegianButtonProps, "variant">
>(({ children, icon, ...props }, ref) => (
  <NorwegianButton
    ref={ref}
    variant="investment"
    icon={icon || <TrendingUp className="h-4 w-4" />}
    shine
    pulse
    ariaLabel="Investeringsknapp"
    {...props}
  >
    {children}
  </NorwegianButton>
));

export const NorwegianPrimaryButton = React.forwardRef<
  HTMLButtonElement,
  Omit<NorwegianButtonProps, "variant">
>(({ children, ...props }, ref) => (
  <NorwegianButton
    ref={ref}
    variant="norwegian"
    ariaLabel="Norsk primærknapp"
    {...props}
  >
    {children}
  </NorwegianButton>
));

export const PremiumButton = React.forwardRef<
  HTMLButtonElement,
  Omit<NorwegianButtonProps, "variant">
>(({ children, icon, ...props }, ref) => (
  <NorwegianButton
    ref={ref}
    variant="premium"
    icon={icon || <Zap className="h-4 w-4" />}
    shine
    animation="bouncy"
    ariaLabel="Premium-knapp"
    {...props}
  >
    {children}
  </NorwegianButton>
));

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<NorwegianButtonProps, "variant"> & { action?: "buy" | "sell" | "transfer" }
>(({ children, action = "buy", ...props }, ref) => {
  const getActionProps = () => {
    switch (action) {
      case "buy":
        return {
          variant: "investment" as const,
          icon: <TrendingUp className="h-4 w-4" />,
          ariaLabel: "Kjøp aksjer",
        };
      case "sell":
        return {
          variant: "danger" as const,
          icon: <DollarSign className="h-4 w-4" />,
          ariaLabel: "Selg aksjer",
        };
      case "transfer":
        return {
          variant: "secondary" as const,
          icon: <ArrowRight className="h-4 w-4" />,
          ariaLabel: "Overfør midler",
        };
      default:
        return {};
    }
  };

  return (
    <NorwegianButton
      ref={ref}
      animation="energetic"
      {...getActionProps()}
      {...props}
    >
      {children}
    </NorwegianButton>
  );
});

InvestmentButton.displayName = "InvestmentButton";
NorwegianPrimaryButton.displayName = "NorwegianPrimaryButton";
PremiumButton.displayName = "PremiumButton";
ActionButton.displayName = "ActionButton";

export { NorwegianButton, norwegianButtonVariants };
export type { NorwegianButtonProps };