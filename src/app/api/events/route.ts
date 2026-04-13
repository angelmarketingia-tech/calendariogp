import { NextRequest, NextResponse } from 'next/server'

// API endpoint para que el job automatizado pueda insertar eventos
// POST /api/events — inserta uno o múltiples eventos
// GET  /api/events — devuelve todos los eventos (para integración)
//
// AUTENTICACIÓN: Usa la variable de entorno API_SECRET
// Header requerido: Authorization: Bearer <API_SECRET>

const API_SECRET = process.env.API_SECRET

function authenticate(req: NextRequest): boolean {
  if (!API_SECRET) return true // sin secret configurado, acceso libre (solo para dev)
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${API_SECRET}`
}

export async function POST(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const events = Array.isArray(body) ? body : [body]

    // Validación mínima
    const validated = events.map(e => ({
      id: e.id ?? crypto.randomUUID(),
      nombre_evento: String(e.nombre_evento ?? ''),
      sport_id: String(e.sport_id ?? ''),
      competition_id: String(e.competition_id ?? ''),
      fecha_hora: String(e.fecha_hora ?? ''),
      pais: String(e.pais ?? ''),
      region: e.region ? String(e.region) : undefined,
      prioridad: ['alta', 'media', 'baja'].includes(e.prioridad) ? e.prioridad : 'media',
      estado: 'pendiente',
      enviado_equipo_creativo: false,
      source: 'api',
      external_id: e.external_id ? String(e.external_id) : undefined,
      notes: [],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // En producción, aquí se insertaría en Supabase:
    // const supabase = getSupabase()
    // const { data, error } = await supabase.from('events').upsert(validated, { onConflict: 'external_id' })

    return NextResponse.json({
      success: true,
      inserted: validated.length,
      events: validated,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // En producción, aquí se leerían desde Supabase
  return NextResponse.json({
    message: 'Events API — connect Supabase to enable persistence',
    docs: {
      POST: 'Send array of events to ingest from automated job',
      fields: [
        'nombre_evento (required)',
        'sport_id',
        'competition_id',
        'fecha_hora (ISO 8601, required)',
        'pais',
        'region',
        'prioridad (alta|media|baja)',
        'external_id (for deduplication)',
      ],
    },
  })
}
