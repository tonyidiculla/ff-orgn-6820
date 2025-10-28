'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { FurfieldLogo } from '@/components/FurfieldLogo'
import { createClient } from '@/lib/supabase'

interface StandardizedHeaderProps {
  title?: string
  subtitle?: string
  homeRoute?: string
}

export type { StandardizedHeaderProps }

export function StandardizedHeader({ 
  title = 'FURFIELD Organization Management', 
  subtitle,
  homeRoute = '/organization'
}: StandardizedHeaderProps) {
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('Organization User')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [sessionRestoring, setSessionRestoring] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  
  // Track when session restoration is complete
  useEffect(() => {
    // Listen for session restoration completion event
    const handleSessionRestored = () => {
      console.log('[StandardizedHeader] Session restoration complete')
      setSessionRestoring(false)
    }

    window.addEventListener('session-restored', handleSessionRestored)
    
    // Also set to false after a timeout as fallback
    const timeout = setTimeout(() => {
      console.log('[StandardizedHeader] Session restoration timeout')
      setSessionRestoring(false)
    }, 3000)

    return () => {
      window.removeEventListener('session-restored', handleSessionRestored)
      clearTimeout(timeout)
    }
  }, [])
  
    // Debug user changes
  useEffect(() => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [StandardizedHeader] User changed:`, user)
    console.log(`[${timestamp}] [StandardizedHeader] User id:`, user?.id)
    console.log(`[${timestamp}] [StandardizedHeader] User email:`, user?.email)
    
    // If user is not authenticated and we're not in the process of restoring session,
    // redirect to auth service after a short delay to allow session restoration to complete
    const hasTokens = searchParams.get('access_token') && searchParams.get('refresh_token')
    console.log(`[${timestamp}] [StandardizedHeader] Redirect check:`, { user: !!user, hasTokens })
  }, [user, searchParams, title])

  useEffect(() => {
    if (user) {
      setProfileLoaded(false)
    }
  }, [user?.id])

  // Helper function to capitalize names properly
  const capitalizeName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const userId = user?.id ?? "guest"
  const fullName = user ? `${user.firstName} ${user.lastName}` : ""
  const rawDisplayName = userName || fullName || user?.email || userId || "Guest"
  const displayName = capitalizeName(rawDisplayName)
  const initials = displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const avatarUrl = userAvatar || user?.avatarUrl || null
  
  const roleDisplayName = userRole

  console.log('[StandardizedHeader] Computed values:', {
    userId,
    userName,
    rawDisplayName,
    displayName,
    initials,
    avatarUrl,
    roleDisplayName
  })

  // Fetch complete user profile from database
  useEffect(() => {
    async function fetchUserProfile() {
      console.log('[StandardizedHeader] ===== STARTING PROFILE FETCH =====')
      console.log('[StandardizedHeader] useEffect triggered, user:', user)
      console.log('[StandardizedHeader] user?.id:', user?.id)
      console.log('[StandardizedHeader] user?.email:', user?.email)
      console.log('[StandardizedHeader] profileLoaded:', profileLoaded)

      if (!user?.id || profileLoaded) {
        console.log('[StandardizedHeader] ===== SKIPPING PROFILE FETCH =====')
        console.log('[StandardizedHeader] Reason:', !user?.id ? 'no user id' : 'already loaded')
        return
      }

      console.log('[StandardizedHeader] ===== FETCHING PROFILE =====')
      try {
        console.log('[profile] Fetching user profile for user_id:', user.id)
        setProfileLoaded(true)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile, error: profileError } = await (supabase as any)
          
          .from('profiles')
          .select('first_name, last_name, user_platform_id')
          .eq('user_id', user.id)
          .single()

        console.log('[profile] ===== QUERY RESULTS =====')
        console.log('[profile] Profile data:', profile)
        console.log('[profile] Profile error:', profileError)

        if (profileError) {
          console.error('[profile] ===== PROFILE QUERY ERROR =====')
          console.error('Error fetching user profile:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint
          })
          setProfileLoaded(false) // Allow retry
          return
        }

        if (profile) {
          console.log('[profile] ===== PROFILE FOUND =====')
          console.log('[profile] Raw profile:', profile)
          
          // Combine first_name + last_name
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          console.log('[profile] Computed fullName:', fullName)
          
          if (fullName) {
            setUserName(fullName)
            console.log('[profile] Display name set to:', fullName)
          } else {
            console.log('[profile] No name found in profile')
          }

          // Fetch user's actual role
          if (profile.user_platform_id) {
            console.log('[profile] ===== FETCHING ROLE =====')
            console.log('[profile] user_platform_id:', profile.user_platform_id)
            const userPlatformId = profile.user_platform_id
            
            // Get role assignments
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: roleAssignments, error: roleError } = await (supabase as any)
              
              .from('user_to_role_assignment')
              .select('platform_role_id')
              .eq('user_platform_id', userPlatformId)

            console.log('[profile] Role assignments query result:', { roleAssignments, roleError })

            if (roleError || !roleAssignments || roleAssignments.length === 0) {
              console.log('[profile] No role assignments found, using default')
              return
            }

            // Get role details
            const roleIds = roleAssignments.map((r: { platform_role_id: number }) => r.platform_role_id)
            console.log('[profile] Role IDs:', roleIds)
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: roles, error: rolesError } = await (supabase as any)
              
              .from('platform_roles')
              .select('role_name, display_name, privilege_level')
              .in('id', roleIds)
              .order('privilege_level', { ascending: true })

            console.log('[profile] Roles query result:', { roles, rolesError })

            if (rolesError || !roles || roles.length === 0) {
              console.log('[profile] Could not fetch role details, using default')
              return
            }

            // Use the role with highest privilege (lowest number)
            const primaryRole = roles[0]
            const roleDisplay = primaryRole.display_name || primaryRole.role_name
            setUserRole(roleDisplay)
            console.log('[profile] ===== PLATFORM ROLE SET =====')
            console.log('[profile] Role set to:', roleDisplay, 'from role:', primaryRole)
          } else {
            console.log('[profile] No user_platform_id found')
          }
        } else {
          console.log('[profile] No profile found in database for user:', userId)
          setProfileLoaded(true)
        }
      } catch (error) {
        console.error('[profile] ===== EXCEPTION =====')
        console.error('Exception fetching user profile:', error)
        setProfileLoaded(false) // Allow retry on error
      }
      console.log('[StandardizedHeader] ===== PROFILE FETCH COMPLETE =====')
    }

    fetchUserProfile()
  }, [user?.id, profileLoaded, supabase])

  async function handleSignOut() {
    try {
      // First, explicitly sign out from Supabase
      await signOut()

      // Clear all local storage and session storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Also clear cookies by setting them to expire
      try {
        document.cookie.split(';').forEach((c: string) => {
          const cookieName = c.split('=')[0].trim()
          if (cookieName) {
            const expireDate = new Date('Thu, 01 Jan 1970 00:00:00 GMT').toUTCString()
            document.cookie = cookieName + '=;expires=' + expireDate + ';path=/'
          }
        })
      } catch (e) {
        // Cookie clearing might fail, but that's ok
      }

      window.dispatchEvent(new Event('storage'))

      // Redirect to auth service login page and stay there
      window.location.href = 'http://localhost:6800'
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even if there's an error
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = 'http://localhost:6800'
    }
  }

  function handleAvatarClick() {
    if (uploading) {
      return
    }

    setMenuError(null)
    fileInputRef.current?.click()
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) {
      event.target.value = ''
      return
    }

    setUploading(true)
    setMenuError(null)

    try {
      const fileExt = file.name.split('.').pop() ?? 'png'
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('profile-icons').upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
      })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage.from('profile-icons').getPublicUrl(filePath)
      const publicUrl = publicUrlData.publicUrl

      // Update auth metadata only (avatar stored in user_metadata)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) {
        throw updateError
      }

      console.log('[profile] Avatar uploaded and updated:', publicUrl)

      // Update local state immediately
      setUserAvatar(publicUrl)
      setMenuError(null)
    } catch (error) {
      console.error('Upload failed:', error)
      setMenuError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <header className="relative z-10 w-full bg-white/90 shadow-sm backdrop-blur">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-200/40 via-white to-amber-200/40" aria-hidden="true" />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={homeRoute} className="flex items-center gap-3 text-lg font-semibold text-slate-800">
          <FurfieldLogo className="rounded-full" size={52} />
          <span className="hidden sm:inline tracking-wide">{title}</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              <Link 
                href={homeRoute}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-sky-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                Home
              </Link>
              <div className="relative flex flex-col items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/80 text-sm font-semibold text-slate-600 shadow transition hover:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label={uploading ? 'Uploading profile image' : 'Upload profile image'}
                  disabled={uploading}
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile avatar"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-emerald-500 text-base font-semibold text-white shadow-inner">
                      {initials}
                    </div>
                  )}
                  {uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      ...
                    </div>
                  ) : null}
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="hidden text-sm text-slate-600 sm:flex sm:flex-col">
                    <span className="font-medium text-slate-700">
                      {displayName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {roleDisplayName}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 sm:hidden">
                    {displayName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  title="Sign out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>

              {menuError ? (
                <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 shadow-sm">
                  {menuError}
                </p>
              ) : null}
            </div>
            </>
          ) : sessionRestoring ? (
            // Show loading state while session is restoring
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse"></div>
              <div className="hidden sm:flex sm:flex-col gap-2">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse"></div>
                <div className="h-3 w-16 rounded bg-slate-200 animate-pulse"></div>
              </div>
            </div>
          ) : (
            // Only show Sign Out button after session restoration is complete and still no user
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-10 w-10 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                title="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
