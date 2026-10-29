require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');
const init = require('./scripts/init-db');
const PORT = Number(process.env.PORT) || 3000;
async function start(){
 if(process.env.DATABASE_URL) await init();
 else console.warn('DATABASE_URL no configurada: registro, reservas y administración requieren PostgreSQL.');
 const path=require('path');
 const server=app.listen(PORT,()=>{
  console.log(`Dapa Glamping disponible en http://localhost:${PORT}`);
  console.log(`Carpeta del proyecto: ${path.resolve(__dirname)}`);
  console.log('Versión: folletos-logo-2 (portadas oficiales y logo original)');
 });
 server.on('error',err=>{
  if(err.code==='EADDRINUSE'){
   console.error(`El puerto ${PORT} ya está ocupado. Detén el servidor anterior y vuelve a iniciar ESTA carpeta.`);
  }else console.error('Error al escuchar:',err.message);
  process.exitCode=1;
  db.pool.end();
 });
 process.on('SIGTERM',()=>server.close(()=>db.pool.end(()=>process.exit(0))));
}
start().catch(err=>{console.error('No se pudo iniciar el servidor:',err.message);process.exitCode=1;db.pool.end();});
