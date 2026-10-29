const express=require('express');const helmet=require('helmet');const morgan=require('morgan');const path=require('path');
require('dotenv').config();
const {session}=require('./middleware/auth');
const app=express();
app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false})); // La página original usa CDN, estilos y acciones inline.
app.use(express.json({limit:'24kb'}));
app.use(express.urlencoded({extended:false,limit:'24kb'}));
app.use(morgan('dev'));
app.use((req,res,next)=>{
 if(req.path.startsWith('/api/'))res.set('Cache-Control','no-store');
 if(['POST','PUT','PATCH','DELETE'].includes(req.method)) {
  const origin=req.get('origin');
  if(origin){try{const originHost=new URL(origin).host;if(originHost!==req.get('host'))return res.status(403).json({message:'Origen no permitido'});}catch{return res.status(403).json({message:'Origen no permitido'});}}
 }
 next();
});
app.use('/api',session);
app.use('/api/auth',require('./routes/auth.routes'));
app.get('/api/catalog',async(req,res,next)=>{
 try{const db=require('./config/db');const {rows}=await db.query('SELECT clave,valor FROM tarifas');res.json({tarifas:Object.fromEntries(rows.map(x=>[x.clave,Number(x.valor)]))});}catch(e){next(e);}
});
app.use('/api/bookings',require('./routes/booking.routes'));
app.use('/api/admin',require('./routes/admin.routes'));
app.get('/api/health',(req,res)=>res.json({status:'UP',service:'Dapa Glamping API'}));
// Los HTML, CSS y JS se revalidan siempre para evitar mostrar una copia antigua.
const publicDir=path.resolve(__dirname,'..','public');
app.use(express.static(publicDir,{
 setHeaders(res,filePath){
  if(/\.(?:html|css|js)$/i.test(filePath)){
   res.setHeader('Cache-Control','no-store, max-age=0');
   res.setHeader('Pragma','no-cache');
  }
 }
}));
app.use((err,req,res,next)=>{console.error('Error de aplicación:',err.message);if(res.headersSent)return next(err);res.status(503).json({message:'El servicio no está disponible. Comprueba la conexión y la migración de la base de datos.'});});
module.exports=app;
