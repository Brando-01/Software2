-- ============================================================
--  DeFi360 · Esquema Release 02  (ejecutar sobre la BD 'defi360' tras V2)
--  Corresponde al diagrama Release 02/Diagramas/R02-bd.puml.
--  Idempotente: crea las tablas nuevas y aplica los cambios R02 sobre la base R01.
-- ============================================================

-- ------------------------------------------------------------
-- 1) HU-13 RBAC: migrar enum_users_role  {user,admin} -> {borrower,lender,admin}
--    Se añaden los valores nuevos, se mapea 'user' -> 'borrower' y se cambia el
--    default a 'borrower'. Postgres no permite ALTER TYPE dentro de transacción
--    para usar el valor inmediatamente, por eso se hace en pasos seguros.
-- ------------------------------------------------------------

-- 1.a) Añadir los nuevos valores al enum si no existen.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='enum_users_role' AND e.enumlabel='borrower') THEN
    ALTER TYPE enum_users_role ADD VALUE 'borrower';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='enum_users_role' AND e.enumlabel='lender') THEN
    ALTER TYPE enum_users_role ADD VALUE 'lender';
  END IF;
END $$;

-- 1.b) Mapear los usuarios existentes 'user' -> 'borrower' y fijar el nuevo default.
--      (Se ejecuta en un bloque aparte para que el valor de enum ya esté disponible.)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
             WHERE t.typname='enum_users_role' AND e.enumlabel='user') THEN
    -- Quitar el default 'user' antes de re-mapear, para no chocar con el ALTER.
    EXECUTE 'ALTER TABLE users ALTER COLUMN role DROP DEFAULT';
    EXECUTE 'UPDATE users SET role = ''borrower'' WHERE role = ''user''';
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'borrower';

-- Nota: el valor 'user' queda huérfano en el tipo enum (Postgres no permite
-- eliminar valores de un enum de forma sencilla). No se usa: todos los usuarios
-- quedaron mapeados a 'borrower'. Si se requiere limpieza total del enum, debe
-- recrearse el tipo (operación pesada) en una ventana de mantenimiento.

-- ------------------------------------------------------------
-- 2) HU-09: columna liquidation_date en loans (status 'liquidated' ya existe en V2).
-- ------------------------------------------------------------
ALTER TABLE loans ADD COLUMN IF NOT EXISTS liquidation_date TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 3) Tipos ENUM nuevos R02 (creación idempotente).
-- ------------------------------------------------------------
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_ledger_entries_type') THEN
  CREATE TYPE enum_ledger_entries_type AS ENUM ('DISBURSEMENT','PAYMENT','LIQUIDATION','LOCK','RELEASE'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='enum_notifications_channel') THEN
  CREATE TYPE enum_notifications_channel AS ENUM ('in_app','email'); END IF; END $$;

-- ------------------------------------------------------------
-- 4) HU-09: tabla liquidations (registro inmutable; solo created_at).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS liquidations (
  id                  SERIAL PRIMARY KEY,
  loan_id             INTEGER NOT NULL REFERENCES loans(id),
  ltv_at_liquidation  NUMERIC(5,2)  NOT NULL,
  collateral_seized   NUMERIC(20,2) NOT NULL,
  amount_recovered    NUMERIC(20,2) NOT NULL,
  reason              VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5) HU-10: tabla ledger_entries (append-only; solo created_at).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledger_entries (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  type          enum_ledger_entries_type NOT NULL,
  amount        NUMERIC(20,2) NOT NULL,
  balance_after NUMERIC(20,2) NOT NULL,
  ref_type      VARCHAR(50),
  ref_id        INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_user_created ON ledger_entries (user_id, created_at);

-- ------------------------------------------------------------
-- 6) HU-12: tabla notifications.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  type        VARCHAR(50) NOT NULL,
  channel     enum_notifications_channel NOT NULL DEFAULT 'in_app',
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications (user_id, read);

-- ------------------------------------------------------------
-- 7) HU-15: tabla lender_preferences (collateral_types como JSONB).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lender_preferences (
  id               SERIAL PRIMARY KEY,
  lender_id        INTEGER NOT NULL REFERENCES users(id),
  max_amount       NUMERIC(20,2),
  min_apy          NUMERIC(5,2),
  collateral_types JSONB,
  max_ltv          NUMERIC(5,2),
  min_credit_score INTEGER,
  auto_match       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
