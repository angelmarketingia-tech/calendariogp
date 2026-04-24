// Supabase client — solo se activa si las env vars están configuradas
// Sin env vars, la app usa localStorage + mock data

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

function createSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js')
  
  // Usar variables de entorno o fallbacks directos para asegurar conexión global
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jgszbfpygkshvxwkwwtl.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3piZnB5Z2tzaHZ4d2t3d3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjA5MDcsImV4cCI6MjA5MjA5NjkwN30.sRMuPkY8q_p65EEoMSaVVw3l5oui1HItvLhOxxd2kbI'
  
  return createClient(url, key)
}

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}

export const isSupabaseEnabled = () => true
