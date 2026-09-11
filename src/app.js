const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const bookingRoutes = require('./routes/booking.routes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', service: 'Dapa Glamping API' });
});

module.exports = app;
