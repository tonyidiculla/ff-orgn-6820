// API endpoint to manually suspend a module
// POST /api/admin/suspend-module
// Body: { entity_platform_id, module_id, reason }

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { entity_platform_id, module_id, reason } = body

        // Validate input
        if (!entity_platform_id || !module_id) {
            return NextResponse.json(
                { error: 'Missing required fields: entity_platform_id, module_id' },
                { status: 400 }
            )
        }

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Call the suspension function
        const { data, error } = await supabase.rpc('suspend_module', {
            p_entity_platform_id: entity_platform_id,
            p_module_id: module_id,
            p_reason: reason || 'Administrative suspension'
        })

        if (error) {
            console.error('Error suspending module:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: data.success,
            message: data.message,
            details: data
        })

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        )
    }
}
