/** Verificación de PostgreSQL sin imprimir credenciales ni datos personales. */
require('dotenv').config();
const db=require('../src/config/db');
async function main(){
 if(!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL en .env');
 await db.query('SELECT 1');
 const tables=['usuarios','sesiones','tarifas','reservas','historial_tarifas'];
 const {rows}=await db.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname=current_schema() AND tablename=ANY($1)',[tables]);
 const found=new Set(rows.map(x=>x.tablename));
 for(const table of tables) if(!found.has(table)) throw new Error('Falta la tabla '+table+'. Ejecuta npm run db:init.');
 const {rows:tariffCount}=await db.query('SELECT COUNT(*)::int AS total FROM tarifas');
 const {rows:adminCount}=await db.query("SELECT COUNT(*)::int AS total FROM usuarios WHERE rol='admin'");
 console.log('✓ PostgreSQL conectado correctamente');
 console.log('✓ Tablas necesarias presentes');
 console.log('✓ Tarifas cargadas:',tariffCount[0].total);
 console.log('✓ Cuentas administrativas:',adminCount[0].total);
 if(adminCount[0].total===0) console.warn('Debes crear el primer administrador con npm run admin:create.');
}
main().catch(e=>{console.error('Configuración incompleta:',e.message);process.exitCode=1;}).finally(()=>db.pool.end());
