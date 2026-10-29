require('dotenv').config();
const db=require('../src/config/db');
const {hashPassword}=require('../src/middleware/auth');
async function run(){
 const nombre=(process.env.ADMIN_NOMBRE||'Administrador').trim();
 const correo=(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
 const pass=process.env.ADMIN_PASSWORD||'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)||correo.endsWith('@example.com')||pass.length<12||/^CAMBIA[_ -]/i.test(pass)||!/[a-z]/.test(pass)||!/[A-Z]/.test(pass)||!/[0-9]/.test(pass)) throw new Error('Configura un ADMIN_EMAIL real y una contraseña NUEVA de al menos 12 caracteres (mayúscula, minúscula y número). No uses ejemplos del archivo .env.example.');
 const {rows}=await db.query('SELECT id FROM usuarios WHERE correo=$1',[correo]);
 if(rows.length) throw new Error('Ya hay una cuenta con ese correo. No se modificó su rol ni contraseña.');
 await db.query('INSERT INTO usuarios(nombre,correo,password_hash,rol) VALUES ($1,$2,$3,$4)',[nombre,correo,hashPassword(pass),'admin']);
 console.log('Administrador creado:',correo,'(contraseña no mostrada)');
}
run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.pool.end());
