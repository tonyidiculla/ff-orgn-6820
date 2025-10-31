// API endpoint to suspend expired subscriptions
// Call this daily via cron job or scheduled function
// URL: POST /api/admin/suspend-expired-subscriptions

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        // Verify authorization (you should add proper auth here)
        const authHeader = request.headers.get('authorization')
        const cronSecret = request.headers.get('x-cron-secret')
        
        // Check for cron secret or valid API key
        if (cronSecret !== process.env.CRON_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid cron secret' },
                { status: 401 }
            )
        }

        // Create Supabase client with service role (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Call the suspension function
        const { data, error } = await supabase.rpc('suspend_expired_subscriptions')

        if (error) {
            console.error('Error suspending subscriptions:', error)
            return NextResponse.json(
                { 
                    success: false, 
                    error: error.message 
                },
                { status: 500 }
            )
        }

        // Log results
        console.log('Suspension check completed:', {
            timestamp: new Date().toISOString(),
            entities_affected: data?.length || 0,
            details: data
        })

        // Send notifications if needed (email, Slack, etc.)
        if (data && data.length > 0) {
            await sendSuspensionNotifications(data)
        }

        return NextResponse.json({
            success: true,
            message: 'Suspension check completed',
            results: {
                entities_suspended: data?.length || 0,
                total_modules_suspended: data?.reduce((sum: number, entity: any) => 
                    sum + (entity.modules_suspended || 0), 0) || 0,
                entities: data
            }
        })

    } catch (error) {
        console.error('Unexpected error in suspension check:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        )
    }
}

// Helper function to send notifications
async function sendSuspensionNotifications(suspendedEntities: any[]) {
    // TODO: Implement email/Slack notifications
    console.log('Sending notifications for suspended entities:', suspendedEntities)
    
    // Example: Send email to entity managers
    for (const entity of suspendedEntities) {
        console.log(`📧 Would send suspension notice to: ${entity.entity_name}`)
        // await sendEmail({
        //     to: entity.manager_email,
        //     subject: 'Subscription Suspended - Action Required',
        //     body: `Your subscription expired on ${entity.subscription_end_date}...`
        // })
    }
}

// GET endpoint to check status (for testing)
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get suspended subscriptions report
        const { data, error } = await supabase
            .from('suspended_subscriptions_report')
            .select('*')
            .limit(100)

        if (error) throw error

        return NextResponse.json({
            success: true,
            suspended_count: data?.length || 0,
            suspended_subscriptions: data
        })

    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        )
    }
}
