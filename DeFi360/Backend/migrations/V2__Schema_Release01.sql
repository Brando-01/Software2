-- ============================================================
--  DeFi360 · Esquema Release 01  (ejecutar sobre la BD 'defi360')
--  Derivado de los modelos Sequelize (underscored: true).
--  Idempotente: sirve para crear desde cero o actualizar una base existente.
-- ============================================================

-- 1) Tipos ENUM (creación idempotente)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_users_role')      THEN CREATE TYPE enum_users_role      AS ENUM ('user','admin'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_offers_type')      THEN CREATE TYPE enum_offers_type      AS ENUM ('lend','borrow'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_offers_status')    THEN CREATE TYPE enum_offers_status    AS ENUM ('active','matched','cancelled','completed'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_loans_rate_type')  THEN CREATE TYPE enum_loans_rate_type  AS ENUM ('fixed','variable'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_loans_status')     THEN CREATE TYPE enum_loans_status     AS ENUM ('active','paid','defaulted','liquidated'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_tickets_priority') THEN CREATE TYPE enum_tickets_priority AS ENUM ('low','medium','high','critical'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_tickets_status')   THEN CREATE TYPE enum_tickets_status   AS ENUM ('open','in_progress','resolved','closed'); END IF; END $$;

-- 2) USERS
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  wallet_address  VARCHAR(255),
  email           VARCHAR(255),
  password_hash   VARCHAR(255),
  name            VARCHAR(255),
  role            enum_users_role NOT NULL DEFAULT 'user',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Actualización para bases ya existentes:
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_address_unique ON users (wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique          ON users (email);

-- 3) WALLETS
CREATE TABLE IF NOT EXISTS wallets (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  total_balance     NUMERIC(20,2) DEFAULT 0,
  available_balance NUMERIC(20,2) DEFAULT 0,
  blocked_balance   NUMERIC(20,2) DEFAULT 0,
  total_earned      NUMERIC(20,2) DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) OFFERS
CREATE TABLE IF NOT EXISTS offers (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  type              enum_offers_type   NOT NULL,
  amount            NUMERIC(20,2) NOT NULL,
  apy               NUMERIC(5,2)  NOT NULL,
  duration          INTEGER NOT NULL,
  collateral_type   VARCHAR(255),
  collateral_amount NUMERIC(20,2),
  status            enum_offers_status NOT NULL DEFAULT 'active',
  matched_with      INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) LOANS
CREATE TABLE IF NOT EXISTS loans (
  id                         SERIAL PRIMARY KEY,
  lender_id                  INTEGER NOT NULL REFERENCES users(id),
  borrower_id                INTEGER NOT NULL REFERENCES users(id),
  offer_id                   INTEGER NOT NULL REFERENCES offers(id),
  amount                     NUMERIC(20,2) NOT NULL,
  apy                        NUMERIC(5,2)  NOT NULL,
  rate_type                  enum_loans_rate_type NOT NULL DEFAULT 'fixed',
  base_apy                   NUMERIC(5,2),
  rate_adjustment_period     INTEGER,
  next_rate_adjustment_date  TIMESTAMPTZ,
  duration                   INTEGER NOT NULL,
  ltv                        NUMERIC(5,2),
  remaining_balance          NUMERIC(20,2) NOT NULL,
  status                     enum_loans_status NOT NULL DEFAULT 'active',
  start_date                 TIMESTAMPTZ DEFAULT NOW(),
  end_date                   TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Actualización para bases ya existentes (campos del patrón Factory Method):
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rate_type                 enum_loans_rate_type NOT NULL DEFAULT 'fixed';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS base_apy                  NUMERIC(5,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rate_adjustment_period    INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS next_rate_adjustment_date TIMESTAMPTZ;

-- 6) TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  ticket_number VARCHAR(255) NOT NULL,
  subject       VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  priority      enum_tickets_priority NOT NULL DEFAULT 'medium',
  status        enum_tickets_status   NOT NULL DEFAULT 'open',
  response      TEXT,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS tickets_ticket_number_unique ON tickets (ticket_number);

-- 7) Índice compuesto de rendimiento (HU-07, ver V1__Add_Index_Prestamo.sql)
CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_estado_fecha
  ON loans (borrower_id, status, end_date);
