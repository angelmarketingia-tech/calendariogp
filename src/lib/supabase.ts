// Supabase client — solo se activa si las env vars están configuradas
// Sin env vars, la app usa localStorage + mock data

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

function createSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}

export const isSupabaseEnabled = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
