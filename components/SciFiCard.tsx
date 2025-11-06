'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface SciFiCardProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  interactive?: boolean
}

export default function SciFiCard({
  children,
  className = '',
  title,
  description,
  interactive = true
}: SciFiCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`
        relative p-1 rounded-lg bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20
        backdrop-blur-sm border border-cyan-500/30 transition-all duration-300
        ${interactive ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={interactive ? {
        scale: 1.02,
        borderColor: "rgba(6, 182, 212, 0.6)",
        boxShadow: "0 0 30px rgba(6, 182, 212, 0.3)"
      } : {}}
      onHoverStart={() => interactive && setIsHovered(true)}
      onHoverEnd={() => interactive && setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10"
        animate={{
          opacity: isHovered ? [0.3, 0.5, 0.3] : 0.1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-cyan-400/60" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-cyan-400/60" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-cyan-400/60" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-cyan-400/60" />

      {/* Content */}
      <div className="relative bg-gradient-to-b from-gray-900/95 to-black/95 rounded-md p-4">
        {title && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-3"
          >
            <h3 className="text-lg font-semibold text-cyan-300 mb-1">{title}</h3>
            {description && (
              <p className="text-xs text-cyan-500/70">{description}</p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: isHovered
              ? 'radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%)'
              : 'transparent'
          }}
        />
      </div>

      {/* Floating particles on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
              initial={{
                x: Math.random() * 100,
                y: Math.random() * 100,
                opacity: 0,
              }}
              animate={{
                x: Math.random() * 100,
                y: Math.random() * 100,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}