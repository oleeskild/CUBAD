'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSelectedProvider } from '@/lib/storage/ai-settings'
import { AIQueryContext, ArtifactDefinition } from '@/types/ai'
import SciFiLoading from './SciFiLoading'
import SciFiButton from './SciFiButton'

interface ArtifactGeneratorProps {
  context: AIQueryContext
  currentData?: any[]
  onArtifactGenerated: (artifact: ArtifactDefinition) => void
  onClose: () => void
}

export default function ArtifactGenerator({
  context,
  currentData,
  onArtifactGenerated,
  onClose,
}: ArtifactGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('Initializing AI...')

  // Cute messages to show during generation
  const cuteMessages = [
    "Teaching AI to code...",
    "Consulting the crystal ball...",
    "Brewing digital magic...",
    "Assembling the pixels...",
    "Waking up the algorithms...",
    "Herding the data cats...",
    "Charging the creativity batteries...",
    "Polishing the code wand...",
    "Summoning the component spirits...",
    "Training our code monkeys...",
    "Warming up the transistors...",
    "Aligning the digital stars...",
    "Consulting the README of destiny...",
    "Debugging the matrix...",
    "Downloading more RAM...",
    "Asking Stack Overflow nicely...",
    "Compiling the dreams...",
    "Optimizing the butterflies..."
  ]

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, loading])

  async function handleGenerate() {
    const provider = getSelectedProvider()

    if (!provider) {
      setError('No AI provider configured. Please configure one in Settings.')
      return
    }

    setLoading(true)
    setError(null)
    setGenerationProgress(0)
    setGenerationMessage(cuteMessages[Math.floor(Math.random() * cuteMessages.length)])

    // Start API call immediately
    const apiPromise = fetch('/api/ai/artifact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim() || 'Create the best visualization for this data',
        context,
        provider,
        sampleData: currentData && currentData.length > 0 ? [currentData[0]] : undefined,
      }),
    })

    // Simulate progress updates during generation (45 seconds total)
    let progressCounter = 0
    const progressInterval = setInterval(() => {
      progressCounter++

      // More realistic progress curve (slower at the end)
      if (progressCounter <= 10) {
        // First 5 seconds: rapid progress to 20%
        setGenerationProgress(prev => Math.min(prev + 2, 20))
      } else if (progressCounter <= 30) {
        // Next 25 seconds: slow progress to 85%
        setGenerationProgress(prev => Math.min(prev + 3, 85))
      } else if (progressCounter <= 40) {
        // Final 15 seconds: very slow progress to 95%
        setGenerationProgress(prev => Math.min(prev + 1, 95))
      }

      // Change message occasionally
      if (progressCounter % 8 === 0) {
        setGenerationMessage(cuteMessages[Math.floor(Math.random() * cuteMessages.length)])
      }
    }, 1000) // Update every second for 45 seconds total

    try {
      // Wait for the actual API response
      const response = await apiPromise
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate artifact')
      }

      // API call completed, jump to 95% immediately
      clearInterval(progressInterval)
      setGenerationProgress(95)
      setGenerationMessage('Almost there... sprinkling magic dust!')

      // Short delay for final polish
      await new Promise(resolve => setTimeout(resolve, 1000))

      setGenerationProgress(100)
      setGenerationMessage('🎉 Artifact created successfully!')

      await new Promise(resolve => setTimeout(resolve, 800))

      onArtifactGenerated(data.artifact)
      setPrompt('')
    } catch (err: any) {
      console.error('Artifact generation error:', err)
      setError(err.message || 'Failed to generate artifact')
      setGenerationMessage('Oops! The magic failed...')
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setTimeout(() => {
        setGenerationProgress(0)
      }, 1000)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Generate Artifact
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Create a custom UI to visualize your data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🪄</span>
            <h4 className="text-sm font-semibold text-purple-900">AI-Powered Generation</h4>
          </div>
          <p className="text-xs text-purple-700">
            The AI will analyze your document structure and create the perfect visualization automatically.
            Just describe what you want or leave it empty for the best result.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-900 mb-2">
            Describe what you want to visualize <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Leave empty to let AI decide the best visualization, or provide specific instructions like 'Make it colorful' or 'Add search functionality'..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Press ⌘+Enter or Ctrl+Enter to generate
          </p>
        </div>

        {currentData && currentData.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">
              <strong>Data Available:</strong> {currentData.length} document(s) from current query
              results will be used as sample data for the artifact.
            </p>
          </div>
        )}

        <div className={loading ? "mb-16" : ""}>
          {loading ? (
            <SciFiLoading
              isLoading={loading}
              progress={generationProgress}
              message={generationMessage}
            />
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Artifact
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500">
          Container: <span className="font-mono font-semibold">{context.containerName}</span>
        </p>
      </div>
    </div>
  )
}
