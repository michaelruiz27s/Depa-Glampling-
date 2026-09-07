-- =====================================================
-- Esquema de Base de Datos para Dapa Glamping en Render
-- Motor: PostgreSQL
-- Sin guiones bajos en nombres de columnas ni tablas
-- =====================================================

DROP TABLE IF EXISTS reservas CASCADE;

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
    "precioTotal" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    moneda VARCHAR(10) DEFAULT 'COP',
    estado VARCHAR(50) DEFAULT 'pendiente',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idxReservasFecha" ON reservas("fechaReserva");
CREATE INDEX IF NOT EXISTS "idxReservasCliente" ON reservas("clienteNombre");
CREATE INDEX IF NOT EXISTS "idxReservasEstado" ON reservas(estado);
