'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle, faRefresh, faHome } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-blue-200 shadow-2xl"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-6xl text-yellow-500"
                />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Oops! Something went wrong
              </h2>

              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don't worry, your progress is safe!
              </p>

              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-gray-700 text-sm mb-2">
                    Error Details
                  </summary>
                  <div className="bg-gray-100 rounded-lg p-4 text-xs text-red-600 font-mono overflow-auto max-h-32">
                    {this.state.error.message}
                  </div>
                </details>
              )}

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FontAwesomeIcon icon={faRefresh} />
                  Try Again
                </motion.button>

                <motion.button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white text-gray-700 font-semibold rounded-xl border border-gray-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FontAwesomeIcon icon={faHome} />
                  Go Home
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}


