'use client'

import { motion } from 'framer-motion'
import { forwardRef } from 'react'

interface SciFiButtonProps {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const SciFiButton = forwardRef<HTMLButtonElement, SciFiButtonProps>(
  ({ onClick, disabled, children, className = '', variant = 'primary', size = 'md' }, ref) => {
    const baseStyles = "relative overflow-hidden rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"

    const variants = {
      primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25",
      secondary: "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-gray-600",
      danger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-500/25"
    }

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    }

    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0"
          animate={disabled ? {} : {
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Scan line effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={disabled ? {} : {
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1
          }}
        />

        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/20"
          initial={{ opacity: 0 }}
          whileHover={disabled ? {} : { opacity: 0.2 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
    )
  }
)

SciFiButton.displayName = 'SciFiButton'

export default SciFiButton