const {Pool}=require('pg');
require('dotenv').config();
const connectionString=process.env.DATABASE_URL;
let remote=false;
if(connectionString){
 try{
  const host=new URL(connectionString).hostname.toLowerCase();
  remote=!['localhost','127.0.0.1','::1','[::1]'].includes(host);
 }catch{throw new Error('DATABASE_URL no tiene un formato válido.');}
}
// Para conexiones remotas, verificar por defecto el certificado TLS del servidor.
// Instalar los certificados de la autoridad emisora cuando lo requiera el proveedor.
const pool=new Pool({
 connectionString,
 ssl:remote?{rejectUnauthorized:true}:false,
 max:10,
 idleTimeoutMillis:30000,
 connectionTimeoutMillis:5000
});
pool.on('error',err=>console.error('Error en pool de conexiones:',err.message));
module.exports={query:(text,params)=>pool.query(text,params),pool};
