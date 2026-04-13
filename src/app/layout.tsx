import type { Metadata } from 'next'
import './globals.css'
import { EventsProvider } from '@/context/EventsContext'
import { AuthProvider } from '@/context/AuthContext'
import AppShell from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: 'Métricas IA | SportOps Management',
  description: 'Sistema inteligente de gestión de eventos deportivos y métricas para Meta Ads',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <EventsProvider>
            <AppShell>
              {children}
            </AppShell>
          </EventsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
