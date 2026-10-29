const express=require('express');
const db=require('../config/db');
const {requireAuth}=require('../middleware/auth');
const {calculateQuote}=require('../domain/pricing');
const router=express.Router();
router.use(requireAuth);
router.use((req,res,next)=>req.user.rol==='cliente'?next():res.status(403).json({message:'Las solicitudes deben realizarse desde una cuenta de cliente.'}));
router.get('/mine',async(req,res,next)=>{
 try{const {rows}=await db.query(`SELECT id,suite,subplan,"numPersonas","fechaReserva",decoracion,spa,"esTarifaSemana",comentarios,"precioTotal",estado,"createdAt" FROM reservas WHERE usuario_id=$1 ORDER BY "fechaReserva" DESC LIMIT 150`,[req.user.id]);res.json({data:rows});}catch(e){next(e);}
});
router.post('/',async(req,res,next)=>{
 let client;
 try{
  const {suite,subplan,numPersonas,fechaReserva,decoracion,spa,comentarios}=req.body||{};
  if(typeof suite!=='string'||typeof fechaReserva!=='string'||typeof comentarios!=='string'&&comentarios!==undefined||String(comentarios||'').length>1000)return res.status(400).json({message:'Revisa los datos de la reserva.'});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva)||fechaReserva<today)return res.status(400).json({message:'La fecha no puede ser anterior a hoy.'});
  client=await db.pool.connect();await client.query('BEGIN');
  const tariffRows=(await client.query('SELECT clave,valor FROM tarifas')).rows;
  const rates=Object.fromEntries(tariffRows.map(r=>[r.clave,Number(r.valor)]));
  let quote;
  try{quote=calculateQuote({suite,subplan,numPersonas,fechaReserva,decoracion,spa},rates);}catch(e){await client.query('ROLLBACK');return res.status(400).json({message:e.message});}
  // Exclusión por habitación y día con bloqueo transaccional (incluye solicitudes pendientes).
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[suite,fechaReserva]);
  const busy=(await client.query(`SELECT id FROM reservas WHERE suite=$1 AND "fechaReserva"=$2 AND estado IN ('pendiente','confirmada','completada') LIMIT 1`,[suite,fechaReserva])).rows;
  if(busy.length){await client.query('ROLLBACK');return res.status(409).json({message:'Ya existe una solicitud para esa suite en esa fecha. Consulta otra fecha.'});}
  const {rows}=await client.query(`INSERT INTO reservas (usuario_id,"clienteNombre",suite,subplan,"numPersonas","fechaReserva",decoracion,spa,"esTarifaSemana",comentarios,"precioTotal",precio_alojamiento,precio_decoracion,precio_spa,estado)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pendiente') RETURNING id,suite,subplan,"numPersonas","fechaReserva",decoracion,spa,"esTarifaSemana","precioTotal",estado`,
   [req.user.id,req.user.nombre,suite,suite==='Casita Mágica'?subplan:null,Number(numPersonas),fechaReserva,decoracion||'Ninguna',spa||'Ninguno',quote.esTarifaSemana,comentarios||'',quote.total,quote.alojamiento,quote.decoracion,quote.spa]);
  await client.query('COMMIT');res.status(201).json({message:'Solicitud guardada. Pendiente de confirmación.',data:rows[0],desglose:quote});
 }catch(e){if(client)try{await client.query('ROLLBACK')}catch{}next(e);}finally{if(client)client.release();}
});
module.exports=router;
