const router=require('express').Router();
const crypto=require('crypto');
const db=require('../config/db');
const {hashPassword,verifyPassword,tokenHash,setSessionCookie,clearSessionCookie,SESSION_DAYS}=require('../middleware/auth');
const email=value=>String(value||'').trim().toLowerCase();
const throttle=(req,res,next)=>{
 const now=Date.now();
 req.app.locals.authHits=req.app.locals.authHits||new Map();
 const key=(req.ip||'ip')+':'+req.path;
 if(req.app.locals.authHits.size>10000){
  for(const [k,v] of req.app.locals.authHits){if(now-v.start>10*60*1000)req.app.locals.authHits.delete(k);}
 }
 const hit=req.app.locals.authHits.get(key)||{count:0,start:now};
 if(now-hit.start>10*60*1000){hit.count=0;hit.start=now;}
 hit.count++;
 req.app.locals.authHits.set(key,hit);
 if(hit.count>25)return res.status(429).json({message:'Demasiados intentos. Intenta de nuevo en unos minutos.'});
 next();
};

router.post('/register',throttle,async(req,res,next)=>{
 try{
  const body=req.body||{};
  const nombre=String(body.nombre||'').trim();
  const correo=email(body.correo);
  const telefono=String(body.telefono||'').trim();
  const password=body.password;
  const politicasAceptadas=body.politicas===true;
  if(!politicasAceptadas)
   return res.status(400).json({message:'Debes aceptar las políticas de privacidad y tratamiento de datos para crear tu cuenta.'});
  if(nombre.length<3||nombre.length>150||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))||correo.length>254||telefono.length>35||typeof password!=='string'||password.length<10||password.length>128)
   return res.status(400).json({message:'Revisa nombre, correo y contraseña (mínimo 10 caracteres).'});
  const {rows}=await db.query(
   'INSERT INTO usuarios (nombre,correo,telefono,password_hash,rol,politicas_aceptadas_en,politicas_version) VALUES ($1,$2,$3,$4,$5,NOW(),$6) RETURNING id,nombre,correo,telefono,rol',
   [nombre,correo,telefono,hashPassword(password),'cliente','2026-10-v1']
  );
  const token=crypto.randomBytes(32).toString('hex');
  await db.query(
   "INSERT INTO sesiones(token_hash,usuario_id,expira_en) VALUES($1,$2,NOW()+($3*INTERVAL '1 day'))",
   [tokenHash(token),rows[0].id,SESSION_DAYS]
  );
  setSessionCookie(res,req,token);
  res.status(201).json({user:rows[0]});
 }catch(err){
  if(err.code==='23505')return res.status(409).json({message:'Ya existe una cuenta con ese correo.'});
  next(err);
 }
});

router.post('/login',throttle,async(req,res,next)=>{
 try{
  const body=req.body||{};
  const correo=email(body.correo||body.identifier||body.usuario);
  const password=body.password;
  if(!correo||typeof password!=='string'||password.length>128)return res.status(400).json({message:'Correo o contraseña inválidos.'});
  const {rows}=await db.query('SELECT id,nombre,correo,telefono,rol,password_hash FROM usuarios WHERE correo=$1',[correo]);
  const user=rows[0];
  if(!user||!verifyPassword(password,user.password_hash))return res.status(401).json({message:'Correo o contraseña incorrectos.'});
  if(body.rol && body.rol!==user.rol)return res.status(403).json({message:'Tu cuenta no tiene acceso a este portal.'});
  const token=crypto.randomBytes(32).toString('hex');
  await db.query(
   "INSERT INTO sesiones(token_hash,usuario_id,expira_en) VALUES($1,$2,NOW()+($3*INTERVAL '1 day'))",
   [tokenHash(token),user.id,SESSION_DAYS]
  );
  setSessionCookie(res,req,token);
  delete user.password_hash;
  res.json({user});
 }catch(err){next(err);}
});

router.post('/logout',async(req,res,next)=>{
 try{
  if(req.sessionHash) await db.query('DELETE FROM sesiones WHERE token_hash=$1',[req.sessionHash]);
  clearSessionCookie(res,req);
  res.json({ok:true});
 }catch(err){next(err);}
});

router.get('/me',(req,res)=>res.json({user:req.user||null}));
module.exports=router;
