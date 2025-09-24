import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration")
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if email exists in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking email:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const exists = !!data

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error in check-email API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}