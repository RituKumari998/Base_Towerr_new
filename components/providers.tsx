'use client'

import React from 'react'
import { FrameProvider } from '@/components/farcaster-provider'
import { WalletProvider } from '@/components/wallet-provider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <FrameProvider>{children}</FrameProvider>
      </WalletProvider>
    </ErrorBoundary>
  )
}
