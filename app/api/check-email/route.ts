import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()

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