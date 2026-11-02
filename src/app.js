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
app.get('/api/availability',async(req,res,next)=>{
 try{
  const {schedule,conflicts,dateValid,dayReservations}=require('./domain/availability');const db=require('./config/db');
  if(!dateValid(req.query.fecha))return res.status(400).json({message:'Fecha inválida.'});
  if(req.query.suite){let slot;try{slot=schedule({...req.query,fechaReserva:req.query.fecha});}catch(e){return res.status(400).json({message:e.message});}return res.json({disponible:Date.parse(slot.inicio)>Date.now()&&!await conflicts(db,slot),...slot});}
  res.json({fecha:req.query.fecha,data:await dayReservations(db,req.query.fecha)});
 }catch(e){next(e);}
});
app.use('/api/bookings',require('./routes/booking.routes'));
app.use('/api/admin',require('./routes/admin.routes'));
app.get('/api/health',(req,res)=>res.json({status:'UP',service:'Dapa Glamping API'}));
app.use('/api',(req,res)=>res.status(404).json({message:'Ruta de API no encontrada.'}));
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
app.use((err,req,res,next)=>{
 if(res.headersSent)return next(err);
 if(err.type==='entity.too.large'||err.status===413)return res.status(413).json({message:'La solicitud supera el tamaño permitido de 24 KB.'});
 if(err.type==='entity.parse.failed')return res.status(400).json({message:'El formato de los datos no es válido. Envía una solicitud JSON válida.'});
 if(['22P02','22003','22007','22008'].includes(err.code))return res.status(400).json({message:'Uno de los datos enviados no tiene un formato o rango válido.'});
 if(Number.isInteger(err.status)&&err.status>=400&&err.status<500)return res.status(err.status).json({message:err.status===400?err.message:'No se pudo procesar la solicitud.'});
 console.error('Error de aplicación:',err.message);
 const unavailable=['ECONNREFUSED','ECONNRESET','ETIMEDOUT','ENOTFOUND','EAI_AGAIN','57P01','57P03','53300'].includes(err.code)||err instanceof AggregateError;
 res.status(unavailable?503:500).json({message:unavailable?'El servicio no está disponible temporalmente. Intenta de nuevo.':'No se pudo completar la operación. Intenta de nuevo.'});
});
module.exports=app;
