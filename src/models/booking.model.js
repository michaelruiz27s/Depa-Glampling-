const db = require('../config/db');

class BookingModel {
    static async getAll(limit = 50) {
        const queryText = `
            SELECT 
                id,
                "clienteNombre",
                suite,
                subplan,
                "numPersonas",
                "fechaReserva",
                decoracion,
                spa,
                "esTarifaSemana",
                comentarios,
                "precioTotal",
                moneda,
                estado,
                "createdAt",
                "updatedAt"
            FROM reservas 
            ORDER BY "createdAt" DESC 
            LIMIT $1
        `;
        const { rows } = await db.query(queryText, [limit]);
        return rows;
    }

    static async getById(id) {
        const queryText = `
            SELECT 
                id,
                "clienteNombre",
                suite,
                subplan,
                "numPersonas",
                "fechaReserva",
                decoracion,
                spa,
                "esTarifaSemana",
                comentarios,
                "precioTotal",
                moneda,
                estado,
                "createdAt",
                "updatedAt"
            FROM reservas 
            WHERE id = $1
        `;
        const { rows } = await db.query(queryText, [id]);
        return rows[0] || null;
    }

    static async create(data) {
        const {
            clienteNombre,
            suite,
            subplan = null,
            numPersonas,
            fechaReserva,
            decoracion = 'Ninguna',
            spa = 'Ninguno',
            esTarifaSemana = false,
            comentarios = '',
            precioTotal = 0
        } = data;

        const queryText = `
            INSERT INTO reservas (
                "clienteNombre", suite, subplan, "numPersonas", "fechaReserva",
                decoracion, spa, "esTarifaSemana", comentarios, "precioTotal"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING 
                id,
                "clienteNombre",
                suite,
                subplan,
                "numPersonas",
                "fechaReserva",
                decoracion,
                spa,
                "esTarifaSemana",
                comentarios,
                "precioTotal",
                moneda,
                estado,
                "createdAt",
                "updatedAt"
        `;

        const values = [
            clienteNombre,
            suite,
            subplan,
            numPersonas,
            fechaReserva,
            decoracion,
            spa,
            esTarifaSemana,
            comentarios,
            precioTotal
        ];

        const { rows } = await db.query(queryText, values);
        return rows[0];
    }
}

module.exports = BookingModel;
