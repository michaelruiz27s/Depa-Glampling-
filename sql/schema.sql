-- MIGRACIÓN SEGURA E IDEMPOTENTE: conserva las reservas que ya existían.
BEGIN;
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(254) NOT NULL UNIQUE,
  telefono VARCHAR(35),
  password_hash TEXT NOT NULL,
  rol VARCHAR(16) NOT NULL DEFAULT 'cliente' CHECK(rol IN ('cliente','admin')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Registro de aceptación del aviso de privacidad (sin alterar las cuentas anteriores).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS politicas_aceptadas_en TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS politicas_version VARCHAR(32);
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash CHAR(64) PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_en TIMESTAMPTZ NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE TABLE IF NOT EXISTS tarifas (
  clave VARCHAR(90) PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  valor NUMERIC(12,0) NOT NULL CHECK (valor >= 0 AND valor <= 1000000000),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS historial_tarifas (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(90) NOT NULL REFERENCES tarifas(clave),
  valor_anterior NUMERIC(12,0) NOT NULL,
  valor_nuevo NUMERIC(12,0) NOT NULL,
  usuario_id BIGINT REFERENCES usuarios(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  "clienteNombre" VARCHAR(150) NOT NULL,
  suite VARCHAR(100) NOT NULL,
  subplan VARCHAR(100),
  "numPersonas" INT NOT NULL CHECK ("numPersonas" > 0),
  "fechaReserva" DATE NOT NULL,
  decoracion VARCHAR(150) DEFAULT 'Ninguna',
  spa VARCHAR(150) DEFAULT 'Ninguno',
  "esTarifaSemana" BOOLEAN DEFAULT FALSE,
  comentarios TEXT,
  "precioTotal" NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda VARCHAR(10) DEFAULT 'COP',
  estado VARCHAR(50) DEFAULT 'pendiente',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS precio_alojamiento NUMERIC(12,2);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS precio_decoracion NUMERIC(12,2);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS precio_spa NUMERIC(12,2);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas("fechaReserva");
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
COMMIT;
