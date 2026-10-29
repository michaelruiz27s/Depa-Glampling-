const crypto = require('crypto');
const db = require('../config/db');
const COOKIE_NAME='dapa_session';
const SESSION_DAYS=7;
function hashPassword(password, salt=crypto.randomBytes(16).toString('hex')) {
 return `${salt}:${crypto.scryptSync(password,salt,64).toString('hex')}`;
}
function verifyPassword(password, saved) {
 if(typeof saved!=='string'||!saved.includes(':'))return false;
 const [salt,hash]=saved.split(':');
 try {const expected=Buffer.from(hash,'hex');const supplied=crypto.scryptSync(password,salt,expected.length);return crypto.timingSafeEqual(supplied,expected);}catch{return false;}
}
const tokenHash = token => crypto.createHash('sha256').update(token).digest('hex');
function parseCookies(header='') {
 const out={}; header.split(';').forEach(part=>{const eq=part.indexOf('=');if(eq>0)out[part.slice(0,eq).trim()]=part.slice(eq+1).trim();}); return out;
}
function secure(req) {return req.secure || req.get('x-forwarded-proto') === 'https';}
function setSessionCookie(res,req,token) {res.cookie(COOKIE_NAME,token,{httpOnly:true,secure:secure(req),sameSite:'lax',path:'/',maxAge:SESSION_DAYS*86400000});}
function clearSessionCookie(res,req) {res.clearCookie(COOKIE_NAME,{httpOnly:true,secure:secure(req),sameSite:'lax',path:'/'});}
async function session(req,res,next) {
 try {
  const token=parseCookies(req.headers.cookie)[COOKIE_NAME];
  if(token && /^[a-f0-9]{64}$/.test(token)) {
   const {rows}=await db.query('SELECT u.id,u.nombre,u.correo,u.telefono,u.rol,s.token_hash FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=$1 AND s.expira_en>NOW()',[tokenHash(token)]);
   if(rows[0]) {req.user={id:rows[0].id,nombre:rows[0].nombre,correo:rows[0].correo,telefono:rows[0].telefono,rol:rows[0].rol};req.sessionHash=rows[0].token_hash;}
  }
  next();
 }catch(e){next(e);}
}
const requireAuth=(req,res,next)=>req.user?next():res.status(401).json({message:'Inicia sesión para continuar',code:'AUTH_REQUIRED'});
const requireAdmin=(req,res,next)=>req.user?.rol==='admin'?next():res.status(403).json({message:'Acceso exclusivo del administrador'});
module.exports={hashPassword,verifyPassword,tokenHash,SESSION_DAYS,setSessionCookie,clearSessionCookie,session,requireAuth,requireAdmin};
