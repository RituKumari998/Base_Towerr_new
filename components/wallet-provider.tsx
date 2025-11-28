"use client"

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Get Reown/WalletConnect Project ID from environment or use a default
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '7311bf9c2490969bb32ed853516cbbdb'

// Set up Wagmi Adapter with Farcaster connector
let wagmiAdapter: WagmiAdapter
let config: ReturnType<WagmiAdapter['wagmiConfig']>

try {
  wagmiAdapter = new WagmiAdapter({
    networks: [base],
    projectId,
    ssr: true,
    connectors: [
      miniAppConnector(), // Add Farcaster Mini App connector
    ],
  })

  // Create AppKit instance
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [base],
    projectId,
    metadata: {
      name: 'Base Tower',
      description: 'Base Tower - Build blocks and earn crypto on Base!',
      url: 'https://base-tower.vercel.app/',
      icons: ['https://base-tower.vercel.app/images/icon.jpg']
    },
    features: {
      analytics: false, // Disable analytics to prevent extra renders
      email: true, // Enable email login
      socials: false, // Disable social logins
      onramp: false, // Disable on-ramp
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#3b99fc',
      '--w3m-border-radius-master': '16px',
    },
    allWallets: 'SHOW', // Show all available wallets
  })

  // Export the wagmi config
  // This includes:
  // - Farcaster Mini App connector (for in-app usage)
  // - All wallets supported by Reown AppKit (MetaMask, Coinbase, etc.)
  config = wagmiAdapter.wagmiConfig
} catch (error) {
  console.error('Failed to initialize wallet provider:', error)
  // Create a minimal fallback config to prevent app crash
  // This will be handled by error boundary
  throw error
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

export function WalletProvider({
  children,
}: {
  children: React.ReactNode
}) {
  if (!config) {
    return (
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Wallet Provider Error
              </h2>
              <p className="text-gray-600">
                Failed to initialize wallet connection. Please refresh the page.
              </p>
            </div>
          </div>
        }
      >
        {children}
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}

// Export config for use in other components
export { config }
