'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SciFiLoadingProps {
  isLoading: boolean
  progress?: number
  message?: string
}

export default function SciFiLoading({ isLoading, progress = 0, message = "Initializing..." }: SciFiLoadingProps) {
  const [dots, setDots] = useState('')
  const [currentMessage, setCurrentMessage] = useState(message)

  // Animated dots for typing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Update message with typewriter effect
  useEffect(() => {
    if (message !== currentMessage) {
      const timeout = setTimeout(() => setCurrentMessage(message), 100)
      return () => clearTimeout(timeout)
    }
  }, [message, currentMessage])

  if (!isLoading) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm rounded-lg border border-cyan-500/30"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex flex-col items-center"
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-20 blur-xl"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Central holographic sphere */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 backdrop-blur-md border border-blue-400/30"
              animate={{
                rotate: [0, 360],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Energy core */}
            <motion.div
              className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-blue-500/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Orbiting particles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"
                animate={{
                  rotate: [0, 360],
                  translateX: [0, 0, 25],
                  translateY: [0, -25, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.5,
                }}
                style={{
                  transformOrigin: 'center',
                }}
              />
            ))}

            {/* Inner pulse */}
            <motion.div
              className="absolute w-5 h-5 rounded-full bg-white/80"
              animate={{
                scale: [1, 2, 1],
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            className="mt-6 h-1 bg-gray-800 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </motion.div>

          {/* Status message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 w-full text-center"
          >
            <p className="text-cyan-400 font-mono text-xs tracking-wide">
              {currentMessage}{dots}
            </p>
            <p className="text-gray-400 font-mono text-xs mt-1">
              {Math.round(progress)}% Complete
            </p>
          </motion.div>

          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-cyan-300/60 rounded-full"
              initial={{
                x: Math.random() * 120 - 60,
                y: Math.random() * 120 - 60,
              }}
              animate={{
                x: Math.random() * 120 - 60,
                y: Math.random() * 120 - 60,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}