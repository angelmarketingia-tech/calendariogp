// Parser para la agenda Markdown generada por el agente de Claude Co-working
// Formato esperado: Agenda_Deportiva_*.md con tablas por fecha

import type { SportEvent } from './types'
import { generateId } from './utils'

// Mapeo de nombres de deporte del Markdown → sport_id
const SPORT_MAP: Record<string, string> = {
  'fútbol': 'football',
  'futbol': 'football',
  'baloncesto': 'basketball',
  'basketball': 'basketball',
  'nba': 'basketball',
  'tenis': 'tennis',
  'tennis': 'tennis',
  'boxeo': 'boxing',
  'mma': 'mma',
  'fórmula 1': 'formula1',
  'formula 1': 'formula1',
  'f1': 'formula1',
}

// Mapeo de competición → competition_id (por palabras clave)
const COMPETITION_MAP: Record<string, string> = {
  'primera div. el salvador': 'primera_sv',
  'primera división el salvador': 'primera_sv',
  'primera div': 'primera_sv',
  'copa presidente': 'copa_pres_sv',
  'liga nacional guatemala': 'liga_gt',
  'liga nacional': 'liga_gt',
  'liga bantrab': 'liga_gt',
  'champions league': 'champions',
  'uefa champions': 'champions',
  'ucl': 'champions',
  'europa league': 'europa_league',
  'uel': 'europa_league',
  'la liga': 'laliga',
  'premier league': 'premier',
  'concacaf champions': 'concacaf_cc',
  'concacaf': 'concacaf_cc',
  'liga mx': 'liga_mx',
  'nba – temporada regular': 'nba_regular',
  'nba – play-in': 'nba_playin',
  'nba play-in': 'nba_playin',
  'play-in': 'nba_playin',
  'nba playoffs': 'nba_playoffs',
  'playoffs': 'nba_playoffs',
  'barcelona open': 'atp_barcelona',
  'atp 500': 'atp_barcelona',
  'atp500': 'atp_barcelona',
}

// Mapeo de relevancia → prioridad
const RELEVANCE_MAP: Record<string, 'alta' | 'media' | 'baja'> = {
  'muy alta': 'alta',
  'alta': 'alta',
  'media': 'media',
  'baja': 'baja',
}

function normStr(s: string): string {
  return s.toLowerCase().trim()
}

function mapSport(raw: string): string {
  const n = normStr(raw)
  for (const [key, val] of Object.entries(SPORT_MAP)) {
    if (n.includes(key)) return val
  }
  return 'football'
}

function mapCompetition(raw: string): string {
  const n = normStr(raw)
  for (const [key, val] of Object.entries(COMPETITION_MAP)) {
    if (n.includes(key)) return val
  }
  // fallback: devuelve el texto crudo como id
  return n.replace(/[^a-z0-9]/g, '_').substring(0, 30)
}

function mapPriority(raw: string): 'alta' | 'media' | 'baja' {
  const n = normStr(raw)
  return RELEVANCE_MAP[n] ?? 'media'
}

// Parsea una línea de hora como "9:00 AM", "13:00", "5:30 PM", "Todo el día", "Variable"
function parseHour(raw: string): { hour: number; minute: number } {
  const n = raw.trim().toLowerCase()
  if (n === 'variable' || n === 'todo el día' || n === 'todo el dia') {
    return { hour: 20, minute: 0 } // fallback a 8 PM
  }
  // 12-hour format: "9:00 AM", "5:30 PM"
  const match12 = n.match(/(\d{1,2}):(\d{2})\s*(am|pm)/)
  if (match12) {
    let h = parseInt(match12[1])
    const m = parseInt(match12[2])
    const ampm = match12[3]
    if (ampm === 'pm' && h < 12) h += 12
    if (ampm === 'am' && h === 12) h = 0
    return { hour: h, minute: m }
  }
  // 24-hour format: "13:00", "20:30"
  const match24 = n.match(/(\d{1,2}):(\d{2})/)
  if (match24) {
    return { hour: parseInt(match24[1]), minute: parseInt(match24[2]) }
  }
  return { hour: 20, minute: 0 }
}

// Parsea un encabezado de fecha como "Domingo 12 de abril", "Lun 20", "Mar 21"
function parseDateHeading(heading: string, year = 2026): Date | null {
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  }
  const n = heading.toLowerCase()
  // "domingo 12 de abril"
  const fullMatch = n.match(/(\d{1,2})\s+de\s+(\w+)/)
  if (fullMatch) {
    const day = parseInt(fullMatch[1])
    const month = months[fullMatch[2]]
    if (month !== undefined) return new Date(year, month, day)
  }
  // "lun 20", "mar 21", "sáb 25", etc.
  const shortMatch = n.match(/(?:lun|mar|mié|mie|jue|vie|sáb|sab|dom)\s+(\d{1,2})/)
  if (shortMatch) {
    const day = parseInt(shortMatch[1])
    // Asumimos abril 2026 si no hay más contexto
    return new Date(year, 3, day)
  }
  // "20-23" rango → usamos primer día
  const rangeMatch = n.match(/(\d{1,2})-(\d{1,2})/)
  if (rangeMatch) {
    return new Date(year, 3, parseInt(rangeMatch[1]))
  }
  return null
}

// Función principal: parsea el contenido Markdown y devuelve SportEvents
export function parseAgendaMarkdown(content: string): SportEvent[] {
  const lines = content.split('\n')
  const events: SportEvent[] = []

  let currentDate: Date | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detectar encabezado de fecha (### Domingo 12 de abril, ### Lunes 13 de abril, etc.)
    if (line.startsWith('### ')) {
      const heading = line.replace('###', '').trim()
      const parsed = parseDateHeading(heading)
      if (parsed) currentDate = parsed
      continue
    }

    // Detectar filas de tabla (empiezan y terminan con |)
    if (!line.startsWith('|') || line.startsWith('|---') || line.startsWith('| Hora') || line.startsWith('| Fecha')) {
      continue
    }

    if (!currentDate) continue

    const cells = line.split('|').map(c => c.trim()).filter(Boolean)

    // Determinar si es tabla sin fecha al inicio (columnas: hora, deporte, comp, evento, país, relevancia, motivo)
    // o tabla con fecha (columnas: fecha, hora, deporte, comp, evento, país, relevancia, motivo)
    let hora = '', deporte = '', competicion = '', partido = '', pais = '', relevancia = ''

    if (cells.length >= 7) {
      // Tabla con fecha: Fecha | Hora | Deporte | Competición | Evento | País | Relevancia | Motivo
      // Detectamos si primera celda es fecha (contiene "lun", "mar", número)
      const firstCell = cells[0].toLowerCase()
      const hasDateFirst = /^(lun|mar|mié|mie|jue|vie|sáb|sab|dom|\d{2}-\d{2}|\d{1,2})\b/.test(firstCell)

      if (hasDateFirst) {
        // Actualizar fecha con la celda de fecha
        const parsedDate = parseDateHeading(cells[0])
        if (parsedDate) currentDate = parsedDate
        hora = cells[1]; deporte = cells[2]; competicion = cells[3]
        partido = cells[4]; pais = cells[5]; relevancia = cells[6]
      } else {
        // Tabla sin fecha: Hora | Deporte | Competición | Evento | País | Relevancia | Motivo
        hora = cells[0]; deporte = cells[1]; competicion = cells[2]
        partido = cells[3]; pais = cells[4]; relevancia = cells[5]
      }
    } else if (cells.length >= 6) {
      hora = cells[0]; deporte = cells[1]; competicion = cells[2]
      partido = cells[3]; pais = cells[4]; relevancia = cells[5]
    } else {
      continue
    }

    // Ignorar filas vacías o sin partido
    if (!partido || partido.length < 3) continue

    const { hour, minute } = parseHour(hora)
    const eventDate = new Date(currentDate)
    eventDate.setHours(hour, minute, 0, 0)

    const sportId = mapSport(deporte)
    const competitionId = mapCompetition(competicion)
    const priority = mapPriority(relevancia)

    const event: SportEvent = {
      id: generateId(),
      nombre_evento: partido,
      sport_id: sportId,
      competition_id: competitionId,
      fecha_hora: eventDate.toISOString(),
      pais: pais.split('/')[0].trim(),
      region: competicion,
      prioridad: priority,
      estado: 'pendiente',
      enviado_equipo_creativo: false,
      source: 'import',
      notes: [],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    events.push(event)
  }

  return events
}
