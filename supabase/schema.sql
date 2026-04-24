-- =====================================================
-- SportOps Calendar — Supabase Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SPORTS
-- =====================================================
CREATE TABLE sports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏅',
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sports VALUES
  ('football',   'Fútbol',      '⚽', '#22C55E', NOW()),
  ('basketball', 'Baloncesto',  '🏀', '#F97316', NOW()),
  ('tennis',     'Tenis',       '🎾', '#EAB308', NOW()),
  ('boxing',     'Boxeo',       '🥊', '#EF4444', NOW()),
  ('mma',        'MMA',         '🥋', '#8B5CF6', NOW()),
  ('formula1',   'Fórmula 1',   '🏎️', '#EC4899', NOW());

-- =====================================================
-- COMPETITIONS
-- =====================================================
CREATE TABLE competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
  country TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO competitions VALUES
  ('champions',      'UEFA Champions League',  'football',   'Europa',       NULL, NOW()),
  ('laliga',         'La Liga',                'football',   'España',       NULL, NOW()),
  ('premier',        'Premier League',         'football',   'Inglaterra',   NULL, NOW()),
  ('copa_america',   'Copa América',           'football',   'Sudamérica',   NULL, NOW()),
  ('libertadores',   'Copa Libertadores',      'football',   'Sudamérica',   NULL, NOW()),
  ('nba',            'NBA',                    'basketball', 'USA',          NULL, NOW()),
  ('euroleague',     'EuroLeague',             'basketball', 'Europa',       NULL, NOW()),
  ('roland_garros',  'Roland Garros',          'tennis',     'Francia',      NULL, NOW()),
  ('wimbledon',      'Wimbledon',              'tennis',     'Inglaterra',   NULL, NOW()),
  ('wbc',            'WBC',                    'boxing',     'Internacional',NULL, NOW()),
  ('ufc',            'UFC',                    'mma',        'USA',          NULL, NOW()),
  ('f1_championship','Campeonato F1',          'formula1',   'Internacional',NULL, NOW());

-- =====================================================
-- PROFILES (extends Supabase Auth)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'operator', 'viewer')) DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EVENTS
-- =====================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_evento TEXT NOT NULL,
  sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
  competition_id TEXT REFERENCES competitions(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  pais TEXT NOT NULL DEFAULT '',
  region TEXT,
  prioridad TEXT CHECK (prioridad IN ('alta', 'media', 'baja')) DEFAULT 'media',
  estado TEXT CHECK (estado IN ('pendiente', 'arte_solicitado', 'declinado')) DEFAULT 'pendiente',
  responsable_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fecha_solicitud_arte TIMESTAMPTZ,
  enviado_equipo_creativo BOOLEAN DEFAULT FALSE,
  source TEXT CHECK (source IN ('manual', 'api', 'import')) DEFAULT 'manual',
  external_id TEXT UNIQUE, -- for deduplication from external jobs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX events_fecha_hora_idx ON events (fecha_hora);
CREATE INDEX events_estado_idx ON events (estado);
CREATE INDEX events_prioridad_idx ON events (prioridad);
CREATE INDEX events_sport_id_idx ON events (sport_id);
CREATE INDEX events_external_id_idx ON events (external_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- EVENT NOTES
-- =====================================================
CREATE TABLE event_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX event_notes_event_id_idx ON event_notes (event_id);

-- =====================================================
-- EVENT HISTORY
-- =====================================================
CREATE TABLE event_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX event_history_event_id_idx ON event_history (event_id);
CREATE INDEX event_history_created_at_idx ON event_history (created_at);

-- =====================================================
-- ROW LEVEL SECURITY (basic setup)
-- =====================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write all events
CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read notes"
  ON event_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert notes"
  ON event_notes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read history"
  ON event_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert history"
  ON event_history FOR INSERT TO authenticated WITH CHECK (true);

-- Allow service role full access (for API job)
CREATE POLICY "Service role full access to events"
  ON events FOR ALL TO service_role USING (true) WITH CHECK (true);
