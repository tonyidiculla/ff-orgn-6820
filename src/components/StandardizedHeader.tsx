// Legacy StandardizedHeader - now redirects to FurfieldHeader
export { FurfieldHeader as StandardizedHeader } from './layout/FurfieldHeader'

// Define the legacy interface for compatibility
export interface StandardizedHeaderProps {
  title?: string
  subtitle?: string
  homeRoute?: string
}
