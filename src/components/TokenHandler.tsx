'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * TokenHandler - Handles JWT tokens from URL parameters
 * 
 * When the auth service redirects back with ?token=xxx,
 * this component extracts the token and sets it as a cookie.
 */
export function TokenHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const handleToken = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        console.log('[TokenHandler] No token in URL')
        return
      }

      console.log('[TokenHandler] Token found in URL, setting up session...')

      try {
        // Set the token as a cookie (same format as auth service)
        document.cookie = `furfield_token=${token}; path=/; max-age=604800; SameSite=Lax`
        
        console.log('[TokenHandler] ✅ Token cookie set successfully')
        
        // Clean up URL by removing the token parameter
        const url = new URL(window.location.href)
        url.searchParams.delete('token')
        
        // Replace the URL without the token (without causing a page reload)
        router.replace(url.pathname + url.search, { scroll: false })
        
        // Trigger a storage event so other components know the session changed
        window.dispatchEvent(new Event('storage'))
        
        // Force a page reload to initialize the auth session
        window.location.reload()
        
      } catch (error) {
        console.error('[TokenHandler] ❌ Failed to set token:', error)
      }
    }

    handleToken()
  }, [searchParams, router])

  return null // This component doesn't render anything
}
