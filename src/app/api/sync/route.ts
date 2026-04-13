import { NextRequest, NextResponse } from 'next/server'
import { parseAgendaMarkdown } from '@/lib/markdown-parser'
import fs from 'fs'
import path from 'path'

// ──────────────────────────────────────────────────────────────────
// POST /api/sync
// El agente de Claude Co-working llama este endpoint con el contenido
// del archivo Markdown de agenda deportiva.
//
// Formas de uso:
//   1. POST con body { markdown: "contenido..." }
//   2. POST con body { filepath: "ruta/al/archivo.md" }  (solo local)
//   3. GET /api/sync?file=nombre.md  (busca en AGENDA_DIR)
// ──────────────────────────────────────────────────────────────────

const API_SECRET = process.env.API_SECRET
// Directorio donde el co-working agent guarda las agendas
const AGENDA_DIR = process.env.AGENDA_DIR ?? 'C:/Users/PC GAMER/Desktop/EeventosDepClaude'

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

    // Opción 1: markdown directo en el body
    if (body.markdown) {
      markdown = String(body.markdown)
    }
    // Opción 2: ruta de archivo local
    else if (body.filepath) {
      try {
        markdown = fs.readFileSync(String(body.filepath), 'utf-8')
      } catch {
        return NextResponse.json({ error: `No se pudo leer el archivo: ${body.filepath}` }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Envía { markdown: "..." } o { filepath: "..." }' }, { status: 400 })
    }

    const events = parseAgendaMarkdown(markdown)

    return NextResponse.json({
      success: true,
      parsed: events.length,
      events,
      message: `Se parsearon ${events.length} eventos desde la agenda`,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Error procesando la agenda' }, { status: 500 })
  }
}

// GET /api/sync — lista archivos disponibles y devuelve el más reciente
export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const requestedFile = searchParams.get('file')

  try {
    // Si se pide un archivo específico, parsearlo
    if (requestedFile) {
      const filePath = path.join(AGENDA_DIR, requestedFile)
      const markdown = fs.readFileSync(filePath, 'utf-8')
      const events = parseAgendaMarkdown(markdown)
      return NextResponse.json({
        success: true,
        file: requestedFile,
        parsed: events.length,
        events,
      })
    }

    // Sin archivo → listar los .md disponibles
    let files: string[] = []
    try {
      files = fs.readdirSync(AGENDA_DIR)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse() // más recientes primero
    } catch {
      // directorio no existe o sin acceso
    }

    return NextResponse.json({
      agenda_dir: AGENDA_DIR,
      available_files: files,
      usage: {
        parse_file: `GET /api/sync?file=Agenda_Deportiva_12-27_Abril_2026.md`,
        push_markdown: `POST /api/sync  { "markdown": "# Agenda Deportiva..." }`,
        push_filepath: `POST /api/sync  { "filepath": "C:/ruta/al/archivo.md" }`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error en sync' }, { status: 500 })
  }
}
