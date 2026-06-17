-- Migración multi-tenant (ejecutar UNA vez en Neon, en este orden).
-- Convierte la app en multi-residencia. Crea la residencia "Alhendín" y
-- asigna a ella todos los datos existentes.

-- 1) Tabla de residencias (tenants)
CREATE TABLE IF NOT EXISTS tenants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  name       text NOT NULL,
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Crear la residencia Alhendín
INSERT INTO tenants (slug, name) VALUES ('alhendin', 'Residencia Alhendín')
ON CONFLICT (slug) DO NOTHING;

-- 3) workers.tenant_id
ALTER TABLE workers ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE workers SET tenant_id = (SELECT id FROM tenants WHERE slug = 'alhendin') WHERE tenant_id IS NULL;
ALTER TABLE workers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workers ADD CONSTRAINT workers_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 4) users.tenant_id (las administradoras se quedan en NULL = globales)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE users SET tenant_id = (SELECT id FROM tenants WHERE slug = 'alhendin') WHERE worker_id IS NOT NULL AND tenant_id IS NULL;
ALTER TABLE users ADD CONSTRAINT users_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5) cuadrantes.tenant_id + índice único por (tenant, año, mes)
ALTER TABLE cuadrantes ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE cuadrantes SET tenant_id = (SELECT id FROM tenants WHERE slug = 'alhendin') WHERE tenant_id IS NULL;
ALTER TABLE cuadrantes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE cuadrantes ADD CONSTRAINT cuadrantes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
DROP INDEX IF EXISTS cuadrantes_year_month_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cuadrantes_tenant_year_month_idx ON cuadrantes (tenant_id, year, month);

-- 6) settings: tenant_id + clave primaria compuesta (tenant, key)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE settings SET tenant_id = (SELECT id FROM tenants WHERE slug = 'alhendin') WHERE tenant_id IS NULL;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE settings ADD PRIMARY KEY (tenant_id, key);
ALTER TABLE settings ADD CONSTRAINT settings_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
