-- ════════════════════════════════════════════════════════════════════════
-- Europlate — Esquema de Base de Datos (PostgreSQL)
-- Ejecutar en Neon (neon.tech) o Supabase (supabase.com → SQL Editor)
-- ════════════════════════════════════════════════════════════════════════

-- ── Extensión UUID ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabla de usuarios (autenticación) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT         UNIQUE NOT NULL,
  name          TEXT         NOT NULL,
  password_hash TEXT         NOT NULL,
  role          TEXT         NOT NULL DEFAULT 'operador'
                             CHECK (role IN ('admin','vendedor','operador')),
  estado        TEXT         NOT NULL DEFAULT 'Activo'
                             CHECK (estado IN ('Activo','Inactivo')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por email (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

-- ── Estado compartido de la aplicación (JSON blob) ───────────────────────
-- Una sola fila 'main' contiene el estado completo del sistema ERP.
-- Esto evita tener que reescribir la lógica de negocio existente.
CREATE TABLE IF NOT EXISTS app_state (
  id          TEXT         PRIMARY KEY DEFAULT 'main',
  data        JSONB        NOT NULL DEFAULT '{}',
  version     INTEGER      NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_by  TEXT
);

-- ── Trigger: actualiza updated_at en users ───────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
