'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
