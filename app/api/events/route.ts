import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_SECRET = process.env.API_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

function authenticate(req: NextRequest): boolean {
  if (!API_SECRET) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${API_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ events: [], supabase_enabled: false })
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('fecha_hora', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data ?? [], supabase_enabled: true })
}

export async function POST(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const events = Array.isArray(body) ? body : [body]

    const rows = events.map(e => ({
      id: e.id ?? crypto.randomUUID(),
      nombre_evento: String(e.nombre_evento ?? ''),
      sport_id: String(e.sport_id ?? ''),
      competition_id: String(e.competition_id ?? ''),
      fecha_hora: String(e.fecha_hora ?? ''),
      pais: String(e.pais ?? ''),
      region: e.region ? String(e.region) : null,
      prioridad: ['alta', 'media', 'baja'].includes(e.prioridad) ? e.prioridad : 'media',
      estado: e.estado ?? 'pendiente',
      responsable_id: e.responsable_id ?? null,
      fecha_solicitud_arte: e.fecha_solicitud_arte ?? null,
      enviado_equipo_creativo: e.enviado_equipo_creativo ?? false,
      source: e.source ?? 'api',
      external_id: e.external_id ?? null,
      notes: e.notes ?? [],
      history: e.history ?? [],
      created_at: e.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('events')
      .upsert(rows, { onConflict: 'external_id', ignoreDuplicates: false })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, inserted: data?.length ?? 0, events: data })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, event: data })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
