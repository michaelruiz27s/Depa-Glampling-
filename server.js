const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
    
    try {
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('nombre_db')) {
            const res = await db.query('SELECT NOW()');
            console.log('Conexion a base de datos establecida:', res.rows[0].now);
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
    }
});

process.on('SIGTERM', () => {
    server.close(() => {
        db.pool.end(() => {
            process.exit(0);
        });
    });
});
