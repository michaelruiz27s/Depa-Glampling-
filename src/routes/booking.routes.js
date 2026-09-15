const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/booking.controller');

// Rutas de reservas
router.get('/', BookingController.getBookings);
router.post('/', BookingController.createBooking);

module.exports = router;
