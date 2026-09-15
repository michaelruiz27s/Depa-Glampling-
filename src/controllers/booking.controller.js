const BookingModel = require('../models/booking.model');

class BookingController {
    static async getBookings(req, res) {
        try {
            const bookings = await BookingModel.getAll();
            res.json({
                success: true,
                count: bookings.length,
                data: bookings
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al consultar las reservas'
            });
        }
    }

    static async createBooking(req, res) {
        try {
            const {
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
            } = req.body;

            if (!clienteNombre || !suite || !numPersonas || !fechaReserva) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios'
                });
            }

            const nuevaReserva = await BookingModel.create({
                clienteNombre,
                suite,
                subplan,
                numPersonas: parseInt(numPersonas, 10),
                fechaReserva,
                decoracion,
                spa,
                esTarifaSemana: Boolean(esTarifaSemana),
                comentarios,
                precioTotal: Number(precioTotal) || 0
            });

            res.status(201).json({
                success: true,
                message: 'Reserva registrada exitosamente',
                data: nuevaReserva
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al registrar la reserva'
            });
        }
    }
}

module.exports = BookingController;
