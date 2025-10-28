import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/Header'
import ClientProviders from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FURFIELD Organization Management',
  description: 'FURFIELD helps your teams manage organizations, members, and operations seamlessly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} relative`} suppressHydrationWarning>
        {/* Standard Furfield gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-sky-50 via-white to-emerald-100 -z-10" />
        <div className="fixed inset-0 bg-gradient-to-tr from-red-100/25 via-orange-50/20 to-yellow-100/25 -z-10" />
        
        <ClientProviders>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
