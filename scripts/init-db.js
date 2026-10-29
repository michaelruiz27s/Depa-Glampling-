require('dotenv').config();
const fs=require('fs');const path=require('path');
const db=require('../src/config/db');
const {DEFAULT_TARIFFS}=require('../src/domain/pricing');
async function init(){
 if(!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en .env');
 await db.query(fs.readFileSync(path.join(__dirname,'../sql/schema.sql'),'utf8'));
 for(const t of DEFAULT_TARIFFS){await db.query('INSERT INTO tarifas (clave,categoria,descripcion,valor) VALUES ($1,$2,$3,$4) ON CONFLICT (clave) DO NOTHING',[t.key,t.category,t.label,t.amount]);}
 console.log(`Migración aplicada; ${DEFAULT_TARIFFS.length} tarifas predeterminadas verificadas. Datos existentes conservados.`);
}
if(require.main===module) init().catch(e=>{console.error('No se completó la migración:',e.message);process.exitCode=1;}).finally(()=>db.pool.end());
module.exports=init;
