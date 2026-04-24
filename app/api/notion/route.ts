import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

interface SolicitudPayload {
  // Campos del evento
  nombre_evento: string
  sport?: string
  competition?: string
  fecha_hora: string          // fecha del evento (Fecha Entrega)
  pais?: string
  // Campos de la solicitud de arte (Notion)
  formato?: string            // Story, Feed, Reel, Banner...
  dimensiones?: string        // 1080x1080, 1080x1920...
  copy?: string               // Texto del anuncio
  enlace_articulo?: string    // URL de referencia
  descripcion?: string        // Descripción manual (si no usa IA)
  solicitante: string
  prioridad: string
  usar_ia: boolean            // si debe generar contenido con IA
}

// POST /api/notion — crea la página en Notion con los campos exactos de la base de datos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      notionToken,
      databaseId,
      solicitud,
    }: { notionToken: string; databaseId: string; solicitud: SolicitudPayload } = body

    if (!notionToken || !databaseId || !solicitud) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // 1. Generar descripción y copy con DeepSeek (si se activa)
    let descripcionFinal = solicitud.descripcion ?? ''
    let copyFinal = solicitud.copy ?? ''

    if (solicitud.usar_ia && DEEPSEEK_API_KEY) {
      const aiResult = await generateWithDeepSeek(solicitud)
      if (!descripcionFinal) descripcionFinal = aiResult.descripcion
      if (!copyFinal) copyFinal = aiResult.copy
    }

    // 2. Crear la página en Notion
    const notionPage = await createNotionPage(
      notionToken,
      databaseId,
      solicitud,
      descripcionFinal,
      copyFinal,
    )

    return NextResponse.json({
      success: true,
      notionPageId: notionPage.id,
      notionUrl: notionPage.url,
      descripcion: descripcionFinal,
      copy: copyFinal,
    })
  } catch (error) {
    console.error('Error en /api/notion:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/notion — parsea descripción en lenguaje natural con DeepSeek
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { descripcion } = body

    if (!descripcion) {
      return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 })
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY no configurada' }, { status: 500 })
    }

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente para una plataforma de solicitudes de arte para marketing deportivo. Extrae datos estructurados del texto del usuario.',
          },
          {
            role: 'user',
            content: `Extrae la información del siguiente texto y devuelve SOLO un JSON válido con estos campos:
- nombre_evento (string, requerido — nombre del evento o partido)
- sport (string — deporte: Fútbol, Basketball, Tennis, MMA, Boxeo, F1, etc.)
- competition (string — nombre de la liga/competición si se menciona)
- fecha_hora (string ISO 8601 — si dice "mañana" usa ${tomorrow}T20:00; si no hay fecha usa ${today}T20:00)
- pais (string — país del evento)
- formato (string — tipo de arte: Story, Feed, Reel, Banner, Carrusel, Video)
- dimensiones (string — tamaños en píxeles si se mencionan, ej: "1080x1920")
- prioridad (string: "alta", "media" o "baja")

Texto: "${descripcion}"

Responde ÚNICAMENTE con el JSON, sin explicaciones ni markdown.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('Error en DeepSeek API')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(text)

    return NextResponse.json({ success: true, event: parsed })
  } catch (error) {
    console.error('Error parseando con IA:', error)
    return NextResponse.json({ error: 'No se pudo interpretar la descripción' }, { status: 500 })
  }
}

async function generateWithDeepSeek(
  solicitud: SolicitudPayload,
): Promise<{ descripcion: string; copy: string }> {
  if (!DEEPSEEK_API_KEY) return { descripcion: '', copy: '' }

  const fechaLegible = new Date(solicitud.fecha_hora).toLocaleString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const prioridadEmoji = solicitud.prioridad === 'alta' ? '🔴' : solicitud.prioridad === 'media' ? '🟡' : '🟢'

  const prompt = `Eres un coordinador de marketing deportivo. Genera dos textos para una solicitud de arte:

Evento: ${solicitud.nombre_evento}
Deporte: ${solicitud.sport ?? '—'}
Competición: ${solicitud.competition ?? '—'}
Fecha: ${fechaLegible}
País: ${solicitud.pais ?? '—'}
Formato: ${solicitud.formato ?? '—'}
Prioridad: ${prioridadEmoji} ${solicitud.prioridad}
Solicitante: ${solicitud.solicitante}

Devuelve SOLO un JSON con dos campos:
- "descripcion": descripción profesional de la solicitud (máximo 150 palabras, explica el evento, qué tipo de arte se necesita y para qué se usará en Meta Ads)
- "copy": texto publicitario atractivo para usar en el anuncio de Meta Ads (máximo 50 palabras, impactante y en español)

Responde ÚNICAMENTE con el JSON.`

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return { descripcion: '', copy: '' }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(text)
    return {
      descripcion: parsed.descripcion ?? '',
      copy: parsed.copy ?? '',
    }
  } catch {
    return { descripcion: '', copy: '' }
  }
}

async function createNotionPage(
  token: string,
  databaseId: string,
  solicitud: SolicitudPayload,
  descripcion: string,
  copy: string,
) {
  const prioridadEmoji = solicitud.prioridad === 'alta' ? '🔴' : solicitud.prioridad === 'media' ? '🟡' : '🟢'
  const fechaHoy = new Date().toISOString().split('T')[0]
  const fechaEvento = solicitud.fecha_hora
    ? new Date(solicitud.fecha_hora).toISOString()
    : new Date().toISOString()

  // Propiedades — nombres exactos de la base de datos del usuario
  // Usamos try/catch a nivel de propiedad para ser resilientes a diferencias de tipo
  const properties: Record<string, unknown> = {
    // Title (siempre requerido)
    Name: {
      title: [{ text: { content: `${prioridadEmoji} ${solicitud.nombre_evento}` } }],
    },
    // Estado
    Estado: {
      select: { name: 'Backlog' },
    },
    // Fechas
    'Fecha Solicitud': {
      date: { start: fechaHoy },
    },
    'Fecha Entrega': {
      date: { start: fechaEvento.split('T')[0] },
    },
  }

  // Campos de texto opcionales — se agregan si tienen valor
  const textFields: Record<string, string | undefined> = {
    'País': solicitud.pais,
    'Dimensiones': solicitud.dimensiones,
    'Descripción': descripcion || solicitud.descripcion,
    'Formato': solicitud.formato,
    'Copy': copy || solicitud.copy,
    'Enlace Artículo': solicitud.enlace_articulo,
  }

  for (const [key, value] of Object.entries(textFields)) {
    if (value) {
      // Enlace Artículo es un campo URL
      if (key === 'Enlace Artículo') {
        properties[key] = { url: value }
      } else {
        properties[key] = { rich_text: [{ text: { content: value } }] }
      }
    }
  }

  // Bloques del cuerpo de la página
  const blocks: unknown[] = [
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: `Solicitado por: ${solicitud.solicitante} · Prioridad: ${prioridadEmoji} ${solicitud.prioridad}` } }],
        icon: { type: 'emoji', emoji: '📋' },
        color: solicitud.prioridad === 'alta' ? 'red_background' : solicitud.prioridad === 'media' ? 'yellow_background' : 'green_background',
      },
    },
    { object: 'block', type: 'divider', divider: {} },
  ]

  if (descripcion) {
    blocks.push(
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: '📝 Descripción de la Solicitud' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: descripcion } }] },
      },
    )
  }

  if (copy) {
    blocks.push(
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: '✍️ Copy para el Anuncio' } }] },
      },
      {
        object: 'block',
        type: 'quote',
        quote: { rich_text: [{ type: 'text', text: { content: copy } }] },
      },
    )
  }

  // Datos del evento como tabla de referencia
  blocks.push(
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: '⚽ Datos del Evento' } }] },
    },
    ...[
      `Evento: ${solicitud.nombre_evento}`,
      `Deporte: ${solicitud.sport ?? '—'}`,
      `Competición: ${solicitud.competition ?? '—'}`,
      `Fecha: ${new Date(solicitud.fecha_hora).toLocaleString('es-ES')}`,
      `País: ${solicitud.pais ?? '—'}`,
      `Formato: ${solicitud.formato ?? '—'}`,
      `Dimensiones: ${solicitud.dimensiones ?? '—'}`,
    ].map(text => ({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
    })),
  )

  // Primera llamada: intentar crear con todas las propiedades
  let response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
      children: blocks,
    }),
  })

  // Si falla (propiedades incorrectas), reintentar solo con el título
  if (!response.ok) {
    const errorBody = await response.json()
    console.warn('Notion error con propiedades completas:', errorBody.message)
    console.warn('Reintentando solo con título y cuerpo...')

    response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [{ text: { content: `${prioridadEmoji} ${solicitud.nombre_evento}` } }],
          },
        },
        children: blocks,
      }),
    })

    if (!response.ok) {
      const err2 = await response.json()
      throw new Error(`Notion API: ${err2.message ?? response.statusText}`)
    }
  }

  return response.json()
}
