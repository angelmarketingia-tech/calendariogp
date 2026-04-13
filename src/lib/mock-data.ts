import type { Sport, Competition, SportEvent, UserProfile } from './types'

// Fechas reales en hora local de El Salvador/Guatemala (CST, UTC-6)
function cst(date: string, time: string): string {
  return `${date}T${time}:00-06:00`
}

export const MOCK_SPORTS: Sport[] = [
  { id: 'football',   name: 'Fútbol',      icon: '⚽', color: '#22C55E' },
  { id: 'basketball', name: 'Baloncesto',  icon: '🏀', color: '#F97316' },
  { id: 'tennis',     name: 'Tenis',       icon: '🎾', color: '#EAB308' },
]

export const MOCK_COMPETITIONS: Competition[] = [
  // El Salvador
  { id: 'primera_sv',     name: 'Primera División El Salvador',  sport_id: 'football',   country: 'El Salvador' },
  { id: 'copa_pres_sv',   name: 'Copa Presidente El Salvador',   sport_id: 'football',   country: 'El Salvador' },
  // Guatemala
  { id: 'liga_gt',        name: 'Liga Nacional Guatemala',        sport_id: 'football',   country: 'Guatemala' },
  // Europa
  { id: 'champions',      name: 'UEFA Champions League',         sport_id: 'football',   country: 'Europa' },
  { id: 'europa_league',  name: 'UEFA Europa League',            sport_id: 'football',   country: 'Europa' },
  { id: 'laliga',         name: 'La Liga España',                sport_id: 'football',   country: 'España' },
  { id: 'premier',        name: 'Premier League',                sport_id: 'football',   country: 'Inglaterra' },
  // CONCACAF
  { id: 'concacaf_cc',    name: 'CONCACAF Champions Cup',        sport_id: 'football',   country: 'CONCACAF' },
  { id: 'liga_mx',        name: 'Liga MX',                       sport_id: 'football',   country: 'México' },
  // Basketball
  { id: 'nba_regular',    name: 'NBA – Temporada Regular',       sport_id: 'basketball', country: 'EE.UU.' },
  { id: 'nba_playin',     name: 'NBA – Play-In Tournament',      sport_id: 'basketball', country: 'EE.UU.' },
  { id: 'nba_playoffs',   name: 'NBA Playoffs',                  sport_id: 'basketball', country: 'EE.UU.' },
  // Tennis
  { id: 'atp_barcelona',  name: 'Barcelona Open Banc Sabadell (ATP 500)', sport_id: 'tennis', country: 'España' },
]

export const MOCK_USERS: UserProfile[] = [
  { id: 'user1', full_name: 'Directora de Marketing', email: 'directora@metricas-ia.com', role: 'admin' },
  { id: 'user2', full_name: 'Carlos López',           email: 'carlos@metricas-ia.com',   role: 'operator' },
  { id: 'user3', full_name: 'Ana Martínez',           email: 'ana@metricas-ia.com',       role: 'operator' },
]

function sp(id: string) { return MOCK_SPORTS.find(s => s.id === id) }
function cp(id: string) {
  const c = MOCK_COMPETITIONS.find(c => c.id === id)
  if (!c) return undefined
  return { ...c, sport: sp(c.sport_id) }
}
function ev(id: string): Omit<SportEvent, 'id' | 'nombre_evento' | 'sport_id' | 'competition_id' | 'fecha_hora' | 'pais' | 'prioridad'> {
  return {
    sport: undefined, competition: undefined,
    estado: 'pendiente', enviado_equipo_creativo: false, source: 'api',
    notes: [], history: [],
    created_at: '2026-04-12T06:00:00-06:00',
    updated_at: '2026-04-12T06:00:00-06:00',
  }
}

export const MOCK_EVENTS: SportEvent[] = [

  // ═══════════════════════════════════════════════
  // DOMINGO 12 DE ABRIL
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'sv_001',
    nombre_evento: 'C.D. Hércules vs Inter FA',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'primera_sv', competition: cp('primera_sv'),
    fecha_hora: cst('2026-04-12', '09:00'),
    pais: 'El Salvador', region: 'Primera Div. J18',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'sv_002',
    nombre_evento: 'C.D. Águila vs Zacatecoluca FC',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'primera_sv', competition: cp('primera_sv'),
    fecha_hora: cst('2026-04-12', '09:00'),
    pais: 'El Salvador', region: 'Primera Div. J18',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'sv_003',
    nombre_evento: 'Platense vs C.D. L.A. Firpo',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'primera_sv', competition: cp('primera_sv'),
    fecha_hora: cst('2026-04-12', '09:15'),
    pais: 'El Salvador', region: 'Primera Div. J18',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'gt_001',
    nombre_evento: 'Antigua vs Municipal',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_gt', competition: cp('liga_gt'),
    fecha_hora: cst('2026-04-12', '15:00'),
    pais: 'Guatemala', region: 'Clásico guatemalteco',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'gt_002',
    nombre_evento: 'Cobán Imperial vs Guastatoya',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_gt', competition: cp('liga_gt'),
    fecha_hora: cst('2026-04-12', '14:00'),
    pais: 'Guatemala',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'eng_001',
    nombre_evento: 'Chelsea vs Manchester City',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'premier', competition: cp('premier'),
    fecha_hora: cst('2026-04-12', '12:30'),
    pais: 'Inglaterra', region: 'Jornada 33',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'nba_001',
    nombre_evento: 'NBA – Último día Temporada Regular (15 partidos)',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_regular', competition: cp('nba_regular'),
    fecha_hora: cst('2026-04-12', '13:00'),
    pais: 'EE.UU.', region: 'Define seeds playoffs',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'esp_001',
    nombre_evento: 'La Liga España – Jornada 31',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'laliga', competition: cp('laliga'),
    fecha_hora: cst('2026-04-12', '10:00'),
    pais: 'España', region: 'Jornada 31 completa',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'mx_001',
    nombre_evento: 'Pumas vs Mazatlán / Toluca vs San Luis',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_mx', competition: cp('liga_mx'),
    fecha_hora: cst('2026-04-12', '19:00'),
    pais: 'México', region: 'Jornada 14',
    prioridad: 'media',
  },

  // ═══════════════════════════════════════════════
  // LUNES 13 DE ABRIL
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'ten_001',
    nombre_evento: 'Barcelona Open ATP 500 – Inicio cuadro principal',
    sport_id: 'tennis', sport: sp('tennis'),
    competition_id: 'atp_barcelona', competition: cp('atp_barcelona'),
    fecha_hora: cst('2026-04-13', '10:00'),
    pais: 'España', region: 'Alcaraz, Ruud, De Minaur',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'eng_002',
    nombre_evento: 'Manchester United vs Leeds',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'premier', competition: cp('premier'),
    fecha_hora: cst('2026-04-13', '13:00'),
    pais: 'Inglaterra', region: 'Rivalidad histórica',
    prioridad: 'media',
  },

  // ═══════════════════════════════════════════════
  // MARTES 14 DE ABRIL — UCL + NBA Play-In
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'ucl_001',
    nombre_evento: 'Atlético de Madrid vs FC Barcelona',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'champions', competition: cp('champions'),
    fecha_hora: cst('2026-04-14', '13:00'),
    pais: 'Europa', region: 'Cuartos de Final – Vuelta',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'ucl_002',
    nombre_evento: 'Liverpool vs PSG',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'champions', competition: cp('champions'),
    fecha_hora: cst('2026-04-14', '13:00'),
    pais: 'Europa', region: 'Cuartos de Final – Vuelta',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'ccup_001',
    nombre_evento: 'CONCACAF Champions Cup – Cuartos (Vuelta) G1',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'concacaf_cc', competition: cp('concacaf_cc'),
    fecha_hora: cst('2026-04-14', '20:00'),
    pais: 'CONCACAF', region: 'Clubes MEX vs USA',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'nba_002',
    nombre_evento: 'NBA Play-In Este — Seed 7 vs Seed 8',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playin', competition: cp('nba_playin'),
    fecha_hora: cst('2026-04-14', '17:30'),
    pais: 'EE.UU.', region: 'Clasificación Playoffs Este',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'nba_003',
    nombre_evento: 'NBA Play-In Oeste — Phoenix Suns (7) vs (8)',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playin', competition: cp('nba_playin'),
    fecha_hora: cst('2026-04-14', '20:00'),
    pais: 'EE.UU.', region: 'Clasificación Playoffs Oeste',
    prioridad: 'alta',
  },

  // ═══════════════════════════════════════════════
  // MIÉRCOLES 15 DE ABRIL — UCL + NBA Play-In
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'ucl_003',
    nombre_evento: 'Arsenal vs Sporting CP',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'champions', competition: cp('champions'),
    fecha_hora: cst('2026-04-15', '13:00'),
    pais: 'Europa', region: 'Cuartos de Final – Vuelta',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'ucl_004',
    nombre_evento: 'Bayern Múnich vs Real Madrid',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'champions', competition: cp('champions'),
    fecha_hora: cst('2026-04-15', '13:00'),
    pais: 'Europa', region: 'Cuartos de Final – Vuelta (Bayern lidera 2-1)',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'ccup_002',
    nombre_evento: 'CONCACAF Champions Cup – Cuartos (Vuelta) G2',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'concacaf_cc', competition: cp('concacaf_cc'),
    fecha_hora: cst('2026-04-15', '20:00'),
    pais: 'CONCACAF', region: 'Define semifinalistas',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'nba_004',
    nombre_evento: 'NBA Play-In Este — Seed 9 vs Seed 10',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playin', competition: cp('nba_playin'),
    fecha_hora: cst('2026-04-15', '17:30'),
    pais: 'EE.UU.', region: 'Eliminación directa Este',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'nba_005',
    nombre_evento: 'NBA Play-In Oeste — Golden State Warriors (9 vs 10)',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playin', competition: cp('nba_playin'),
    fecha_hora: cst('2026-04-15', '20:00'),
    pais: 'EE.UU.', region: 'Warriors en Play-In',
    prioridad: 'media',
  },

  // ═══════════════════════════════════════════════
  // JUEVES 16 DE ABRIL — Europa League + Liga GT
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'gt_003',
    nombre_evento: 'Municipal vs Comunicaciones',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_gt', competition: cp('liga_gt'),
    fecha_hora: cst('2026-04-16', '19:00'),
    pais: 'Guatemala', region: 'Jornada 9 – Grandes del país',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'gt_004',
    nombre_evento: 'Guastatoya vs Antigua FC',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_gt', competition: cp('liga_gt'),
    fecha_hora: cst('2026-04-16', '17:00'),
    pais: 'Guatemala', region: 'Jornada 9',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'uel_001',
    nombre_evento: 'Aston Villa vs Bologna',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'europa_league', competition: cp('europa_league'),
    fecha_hora: cst('2026-04-16', '13:00'),
    pais: 'Europa', region: 'Europa League – Cuartos Vuelta',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'uel_002',
    nombre_evento: 'Real Betis vs Braga',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'europa_league', competition: cp('europa_league'),
    fecha_hora: cst('2026-04-16', '13:00'),
    pais: 'Europa', region: 'Europa League – Cuartos Vuelta',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'uel_003',
    nombre_evento: 'Nottingham Forest vs Porto',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'europa_league', competition: cp('europa_league'),
    fecha_hora: cst('2026-04-16', '13:00'),
    pais: 'Europa', region: 'Europa League – Cuartos Vuelta',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'uel_004',
    nombre_evento: 'Celta de Vigo vs Freiburg',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'europa_league', competition: cp('europa_league'),
    fecha_hora: cst('2026-04-16', '13:00'),
    pais: 'Europa', region: 'Europa League – Cuartos Vuelta',
    prioridad: 'media',
  },

  // ═══════════════════════════════════════════════
  // VIERNES 17 DE ABRIL — NBA Play-In Final
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'nba_006',
    nombre_evento: 'NBA Play-In Este — Último boleto playoffs',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playin', competition: cp('nba_playin'),
    fecha_hora: cst('2026-04-17', '17:30'),
    pais: 'EE.UU.', region: 'Perdedor 7/8 vs Ganador 9/10',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'nba_007',
    nombre_evento: 'NBA Play-In Oeste — Último boleto playoffs',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playin', competition: cp('nba_playin'),
    fecha_hora: cst('2026-04-17', '20:00'),
    pais: 'EE.UU.', region: 'Perdedor 7/8 vs Ganador 9/10',
    prioridad: 'alta',
  },

  // ═══════════════════════════════════════════════
  // SÁBADO 18 DE ABRIL — NBA Playoffs inicio + J19 SV + Premier
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'sv_004',
    nombre_evento: 'L.A. Firpo vs Isidro Metapán',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'primera_sv', competition: cp('primera_sv'),
    fecha_hora: cst('2026-04-18', '09:00'),
    pais: 'El Salvador', region: 'Primera Div. J19',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'sv_005',
    nombre_evento: 'Cacahuatique vs C.D. Hércules',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'primera_sv', competition: cp('primera_sv'),
    fecha_hora: cst('2026-04-18', '09:00'),
    pais: 'El Salvador', region: 'Primera Div. J19',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'eng_003',
    nombre_evento: 'Chelsea vs Manchester United',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'premier', competition: cp('premier'),
    fecha_hora: cst('2026-04-18', '09:30'),
    pais: 'Inglaterra', region: 'Premier League J34',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'eng_004',
    nombre_evento: 'Manchester City vs Arsenal',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'premier', competition: cp('premier'),
    fecha_hora: cst('2026-04-18', '12:00'),
    pais: 'Inglaterra', region: 'Premier League J34 – Duelo por el título',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'nba_008',
    nombre_evento: 'NBA Playoffs – Primera Ronda Juego 1 (múltiples series)',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playoffs', competition: cp('nba_playoffs'),
    fecha_hora: cst('2026-04-18', '17:00'),
    pais: 'EE.UU.', region: 'Inicio Playoffs NBA 2026',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'ten_002',
    nombre_evento: 'Barcelona Open ATP 500 – Semifinales',
    sport_id: 'tennis', sport: sp('tennis'),
    competition_id: 'atp_barcelona', competition: cp('atp_barcelona'),
    fecha_hora: cst('2026-04-18', '09:00'),
    pais: 'España', region: 'Alcaraz favorito',
    prioridad: 'media',
  },

  // ═══════════════════════════════════════════════
  // DOMINGO 19 DE ABRIL
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'ten_003',
    nombre_evento: 'Barcelona Open ATP 500 – FINAL',
    sport_id: 'tennis', sport: sp('tennis'),
    competition_id: 'atp_barcelona', competition: cp('atp_barcelona'),
    fecha_hora: cst('2026-04-19', '09:00'),
    pais: 'España', region: 'Final ATP 500 Barcelona',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'esp_002',
    nombre_evento: 'La Liga España – Jornada 32',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'laliga', competition: cp('laliga'),
    fecha_hora: cst('2026-04-19', '10:00'),
    pais: 'España', region: 'Barça, Madrid, Atlético en lucha',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'nba_009',
    nombre_evento: 'NBA Playoffs – Primera Ronda Juegos 1 (series restantes)',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playoffs', competition: cp('nba_playoffs'),
    fecha_hora: cst('2026-04-19', '13:00'),
    pais: 'EE.UU.', region: 'Playoffs en curso',
    prioridad: 'alta',
  },

  // ═══════════════════════════════════════════════
  // MARTES 21 DE ABRIL — Copa Presidente SV (vuelta octavos)
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'cp_001',
    nombre_evento: 'Fuerte San Francisco vs Platense',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-21', '15:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'cp_002',
    nombre_evento: 'Isidro Metapán vs Alianza FC',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-21', '17:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta – Alianza, el más grande',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'cp_003',
    nombre_evento: 'FAS vs Dragón',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-21', '19:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta – Clásico salvadoreño',
    prioridad: 'alta',
  },

  // ═══════════════════════════════════════════════
  // MIÉRCOLES 22 DE ABRIL — Copa Presidente SV
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'cp_004',
    nombre_evento: 'C.D. Águila vs Izalco Rangers',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-22', '15:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'cp_005',
    nombre_evento: 'Inter FA vs Zacatecoluca FC',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-22', '17:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'cp_006',
    nombre_evento: 'L.A. Firpo vs Batanecos',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-22', '19:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta',
    prioridad: 'alta',
  },

  // ═══════════════════════════════════════════════
  // JUEVES 23 DE ABRIL — Copa Presidente SV
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'cp_007',
    nombre_evento: 'Cacahuatique vs C.D. Hércules',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-23', '15:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'cp_008',
    nombre_evento: 'Municipal Limeño vs Roble FC',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'copa_pres_sv', competition: cp('copa_pres_sv'),
    fecha_hora: cst('2026-04-23', '19:00'),
    pais: 'El Salvador', region: 'Octavos Vuelta',
    prioridad: 'media',
  },

  // ═══════════════════════════════════════════════
  // SÁBADO 25 DE ABRIL — Premier J35 + NBA Playoffs
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'eng_005',
    nombre_evento: 'Arsenal vs Newcastle United',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'premier', competition: cp('premier'),
    fecha_hora: cst('2026-04-25', '09:30'),
    pais: 'Inglaterra', region: 'Premier League J35 – Lucha por la cima',
    prioridad: 'alta',
  },
  {
    ...ev(''), id: 'eng_006',
    nombre_evento: 'Liverpool vs Crystal Palace',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'premier', competition: cp('premier'),
    fecha_hora: cst('2026-04-25', '07:30'),
    pais: 'Inglaterra', region: 'Premier League J35',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'esp_003',
    nombre_evento: 'Barcelona vs Getafe – La Liga J32',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'laliga', competition: cp('laliga'),
    fecha_hora: cst('2026-04-25', '14:00'),
    pais: 'España', region: 'La Liga J32',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'nba_010',
    nombre_evento: 'NBA Playoffs – Primera Ronda Juegos 3/4/5',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playoffs', competition: cp('nba_playoffs'),
    fecha_hora: cst('2026-04-25', '17:00'),
    pais: 'EE.UU.', region: 'Posibles eliminaciones primera ronda',
    prioridad: 'alta',
  },

  // ═══════════════════════════════════════════════
  // SÁBADO-DOMINGO 26-27 DE ABRIL — Liga MX + Liga GT
  // ═══════════════════════════════════════════════
  {
    ...ev(''), id: 'mx_002',
    nombre_evento: 'Liga MX Clausura 2026 – Jornada 16',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_mx', competition: cp('liga_mx'),
    fecha_hora: cst('2026-04-26', '17:00'),
    pais: 'México', region: 'Jornada doble – alta intensidad',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'gt_005',
    nombre_evento: 'Liga Nacional Guatemala – Jornada decisiva 2da vuelta',
    sport_id: 'football', sport: sp('football'),
    competition_id: 'liga_gt', competition: cp('liga_gt'),
    fecha_hora: cst('2026-04-27', '15:00'),
    pais: 'Guatemala', region: 'Fase decisiva Clausura 2026',
    prioridad: 'media',
  },
  {
    ...ev(''), id: 'nba_011',
    nombre_evento: 'NBA Playoffs – Primera Ronda (continuación)',
    sport_id: 'basketball', sport: sp('basketball'),
    competition_id: 'nba_playoffs', competition: cp('nba_playoffs'),
    fecha_hora: cst('2026-04-27', '13:00'),
    pais: 'EE.UU.', region: 'Playoffs en pleno desarrollo',
    prioridad: 'alta',
  },
]
