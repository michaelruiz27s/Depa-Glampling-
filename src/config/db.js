const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: connectionString && !connectionString.includes('localhost') ? {
        rejectUnauthorized: false
    } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Error en pool de conexiones:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
