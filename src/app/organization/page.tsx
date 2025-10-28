'use client'

import { useAuth } from '@/context/AuthContext'
import { OrganizationList } from '@/components/OrganizationList'

export default function OrganizationPage() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-100 px-6 py-16 text-slate-700">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.35),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(167,243,208,0.35),_transparent_45%)]" />
            <div className="relative mx-auto w-full max-w-6xl">
                <div className="rounded-3xl border border-white/70 bg-white/60 px-12 py-8 shadow-2xl backdrop-blur">
                    <OrganizationList />
                </div>
            </div>
        </div>
    )
}
