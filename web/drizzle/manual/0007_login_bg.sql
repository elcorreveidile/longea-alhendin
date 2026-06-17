-- Imagen de fondo del login/acceso por residencia
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS login_bg_url text;
UPDATE tenants SET login_bg_url = '/login-bg-alhendin.jpg' WHERE slug = 'alhendin';
