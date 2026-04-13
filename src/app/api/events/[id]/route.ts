import { NextRequest, NextResponse } from 'next/server'

const API_SECRET = process.env.API_SECRET

function authenticate(req: NextRequest): boolean {
  if (!API_SECRET) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${API_SECRET}`
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id } = params

    // Validate status if provided
    if (body.estado && !['pendiente', 'arte_solicitado', 'declinado'].includes(body.estado)) {
      return NextResponse.json({ error: 'Invalid estado value' }, { status: 400 })
    }

    if (body.prioridad && !['alta', 'media', 'baja'].includes(body.prioridad)) {
      return NextResponse.json({ error: 'Invalid prioridad value' }, { status: 400 })
    }

    // In production, update in Supabase:
    // const supabase = getSupabase()
    // const { data, error } = await supabase
    //   .from('events').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id)

    return NextResponse.json({
      success: true,
      id,
      updated: body,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // In production: await supabase.from('events').delete().eq('id', params.id)
  return NextResponse.json({ success: true, deleted: params.id })
}
