import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create client with custom options for better timeout handling
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'AgriAid',
    },
  },
  // Increase timeout for slow connections
  db: {
    schema: 'public',
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, supabaseOptions)

