'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface ResizablePanelsProps {
  topPanel: ReactNode
  bottomPanel: ReactNode
  defaultTopHeight?: number // percentage (0-100)
}

export default function ResizablePanels({
  topPanel,
  bottomPanel,
  defaultTopHeight = 50,
}: ResizablePanelsProps) {
  const [topHeight, setTopHeight] = useState(defaultTopHeight)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100

      // Clamp between 20% and 80% to prevent panels from becoming too small
      const clampedHeight = Math.max(20, Math.min(80, newHeight))
      setTopHeight(clampedHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Top Panel */}
      <div
        style={{ height: `${topHeight}%` }}
        className="overflow-hidden border-b border-gray-200 dark:border-gray-800"
      >
        {topPanel}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className={`
          h-1 cursor-row-resize
          bg-gray-200 dark:bg-gray-800
          hover:bg-blue-500 dark:hover:bg-blue-600
          transition-colors
          ${isDragging ? 'bg-blue-500 dark:bg-blue-600' : ''}
          relative group
        `}
      >
        {/* Visual indicator on hover */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-0.5">
            <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div
        style={{ height: `${100 - topHeight}%` }}
        className="overflow-hidden"
      >
        {bottomPanel}
      </div>
    </div>
  )
}
