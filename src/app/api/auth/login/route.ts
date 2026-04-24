import { NextRequest, NextResponse } from 'next/server'

const USERS_CONFIG = [
  { id: 'superadmin', username: 'ganaplay.admin', name: 'Angel', role: 'superadmin', passwordEnv: 'ADMIN_PASSWORD' },
  { id: 'ganaplay_admin', username: 'ganaplay', name: 'Equipo Administrativo', role: 'admin', passwordEnv: 'GANAPLAY_ADMIN_PASSWORD' },
  { id: 'diseno', username: 'diseño', name: 'Equipo Diseño', role: 'admin', passwordEnv: 'DESIGN_PASSWORD' },
  { id: 'community', username: 'community', name: 'Community', role: 'admin', passwordEnv: 'COMMUNITY_PASSWORD' },
  { id: 'ceo', username: 'ceo', name: 'CEO', role: 'admin', passwordEnv: 'CEO_PASSWORD' },
  { id: 'director', username: 'director', name: 'Director', role: 'admin', passwordEnv: 'DIRECTOR_PASSWORD' },
  { id: 'fernanda', username: 'fernanda', name: 'Fernanda', role: 'user', passwordEnv: 'USER_PASSWORD' },
]

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const userConfig = USERS_CONFIG.find(u => u.username === username)
    if (!userConfig) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    const expectedPassword = process.env[userConfig.passwordEnv]
    if (!expectedPassword) {
      console.error(`Variable de entorno ${userConfig.passwordEnv} no definida`)
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userConfig.id,
        username: userConfig.username,
        name: userConfig.name,
        role: userConfig.role,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
