import { NextRequest, NextResponse } from 'next/server'
import { parseAgendaMarkdown } from '@/lib/markdown-parser'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const API_SECRET = process.env.API_SECRET
const AGENDA_DIR = process.env.AGENDA_DIR ?? 'C:/Users/PC GAMER/Desktop/EeventosDepClaude'

import { getSupabase } from '@/lib/supabase'

function authenticate(req: NextRequest): boolean {
  if (!API_SECRET) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${API_SECRET}`
}

export async function POST(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    let markdown = ''

    if (body.markdown) {
      markdown = String(body.markdown)
    } else if (body.filepath) {
      try {
        markdown = fs.readFileSync(String(body.filepath), 'utf-8')
      } catch {
        return NextResponse.json({ error: `No se pudo leer el archivo: ${body.filepath}` }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Envía { markdown: "..." } o { filepath: "..." }' }, { status: 400 })
    }

    const events = parseAgendaMarkdown(markdown)

    // Guardar en Supabase para sincronización en tiempo real
    const supabase = getSupabase()
    let upserted = 0
    let supabaseError: string | null = null

    if (supabase && events.length > 0) {
      const allRows = events.map(e => ({
        id: e.id,
        nombre_evento: e.nombre_evento,
        sport_id: e.sport_id,
        competition_id: e.competition_id,
        fecha_hora: e.fecha_hora,
        pais: e.pais,
        region: e.region ?? null,
        prioridad: e.prioridad,
        estado: e.estado,
        enviado_equipo_creativo: e.enviado_equipo_creativo,
        source: 'import',
        external_id: `${e.nombre_evento}__${e.fecha_hora}`,
        notes: [],
        history: [],
        created_at: e.created_at,
        updated_at: e.updated_at,
      }))

      // Deduplicar por external_id antes de upsert (evita conflictos dentro del mismo batch)
      const seen = new Set<string>()
      const rows = allRows.filter(r => {
        if (seen.has(r.external_id)) return false
        seen.add(r.external_id)
        return true
      })

      const { error, data } = await supabase
        .from('events')
        .upsert(rows, { onConflict: 'external_id', ignoreDuplicates: false })
        .select('id')

      if (error) {
        supabaseError = error.message
      } else {
        upserted = data?.length ?? events.length
      }
    }

    return NextResponse.json({
      success: true,
      parsed: events.length,
      upserted: supabase ? upserted : 0,
      supabase_enabled: !!supabase,
      supabase_error: supabaseError,
      events,
      message: supabase
        ? `${events.length} eventos parseados y guardados en Supabase`
        : `${events.length} eventos parseados (Supabase no configurado)`,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Error procesando la agenda' }, { status: 500 })
  }
}

// GET /api/sync — lista archivos disponibles del directorio local (solo funciona local)
export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const requestedFile = searchParams.get('file')

  try {
    if (requestedFile) {
      const filePath = path.join(AGENDA_DIR, requestedFile)
      let markdown = ''
      try {
        markdown = fs.readFileSync(filePath, 'utf-8')
      } catch {
        return NextResponse.json({ error: `No se encontró el archivo: ${requestedFile}. El Auto-Sync de directorio solo funciona en local. Usa POST con { markdown: "..." } desde producción.` }, { status: 400 })
      }
      const events = parseAgendaMarkdown(markdown)
      return NextResponse.json({ success: true, file: requestedFile, parsed: events.length, events })
    }

    let files: string[] = []
    try {
      files = fs.readdirSync(AGENDA_DIR).filter(f => f.endsWith('.md')).sort().reverse()
    } catch {
      // directorio no accesible desde Vercel
    }

    return NextResponse.json({
      agenda_dir: AGENDA_DIR,
      available_files: files,
      usage: {
        parse_file: `GET /api/sync?file=Agenda_Deportiva.md`,
        push_markdown: `POST /api/sync  { "markdown": "# Agenda..." }`,
        push_filepath: `POST /api/sync  { "filepath": "C:/ruta/archivo.md" }`,
        production_url: 'https://calendariogp.vercel.app/api/sync',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error en sync' }, { status: 500 })
  }
}
