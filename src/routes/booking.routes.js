const express=require('express');
const db=require('../config/db');
const {requireAuth}=require('../middleware/auth');
const {calculateQuote}=require('../domain/pricing');
const {schedule,conflicts}=require('../domain/availability');
const {pagination,metadata,validId,bad}=require('../domain/listing');
const router=express.Router();
router.use(requireAuth);
router.use((req,res,next)=>req.user.rol==='cliente'?next():res.status(403).json({message:'Las solicitudes deben realizarse desde una cuenta de cliente.'}));
router.get('/mine',async(req,res,next)=>{
 try{
  const page=pagination(req.query),filter=req.query.filter||'todas';
  if(!['todas','activas','finalizadas'].includes(filter))bad('Filtro de historial inválido.');
  const extra=filter==='activas'?" AND estado IN ('pendiente','confirmada')":filter==='finalizadas'?" AND estado IN ('completada','cancelada')":'';
  const fields=`id,suite,habitacion,inicio,fin,ingreso_registrado,subplan,"numPersonas","fechaReserva",decoracion,spa,"esTarifaSemana",comentarios,precio_alojamiento,precio_decoracion,precio_spa,"precioTotal",estado,"createdAt"`;
  const [list,count,summary,upcoming]=await Promise.all([
   db.query(`SELECT ${fields} FROM reservas WHERE usuario_id=$1 ${extra} ORDER BY "fechaReserva" DESC,id DESC LIMIT $2 OFFSET $3`,[req.user.id,page.pageSize,page.offset]),
   db.query(`SELECT COUNT(*)::int AS total FROM reservas WHERE usuario_id=$1 ${extra}`,[req.user.id]),
   db.query(`SELECT COUNT(*)::int AS solicitudes,COUNT(*) FILTER(WHERE estado='completada')::int AS completadas,COUNT(*) FILTER(WHERE estado='completada' AND spa<>'Ninguno')::int AS con_spa FROM reservas WHERE usuario_id=$1`,[req.user.id]),
   db.query(`SELECT ${fields} FROM reservas WHERE usuario_id=$1 AND estado IN ('pendiente','confirmada') AND COALESCE(fin,(("fechaReserva"+1)::timestamp AT TIME ZONE 'America/Bogota'))>NOW() ORDER BY COALESCE(inicio,("fechaReserva"::timestamp AT TIME ZONE 'America/Bogota')),id LIMIT 1`,[req.user.id])
  ]);
  res.json({data:list.rows,pagination:metadata(page,count.rows[0].total),summary:summary.rows[0],nextReservation:upcoming.rows[0]||null});
 }catch(e){next(e);}
});
router.patch('/:id/cancel',async(req,res,next)=>{
 try{
  if(!validId(req.params.id,'2147483647'))return res.status(400).json({message:'Solicitud inválida.'});
  const {rows}=await db.query(`UPDATE reservas SET estado='cancelada',"updatedAt"=NOW() WHERE id=$1 AND usuario_id=$2 AND estado='pendiente' RETURNING id`,[req.params.id,req.user.id]);
  if(!rows.length)return res.status(409).json({message:'Solo puedes cancelar tus solicitudes pendientes. Para otras reservas contacta al alojamiento.'});
  res.json({message:'Solicitud cancelada.'});
 }catch(e){next(e);}
});
router.post('/',async(req,res,next)=>{
 let client;
 try{
  const {suite,subplan,numPersonas,fechaReserva,decoracion,spa,comentarios}=req.body||{};
  if(typeof suite!=='string'||typeof fechaReserva!=='string'||typeof comentarios!=='string'&&comentarios!==undefined||String(comentarios||'').length>1000)return res.status(400).json({message:'Revisa los datos de la reserva.'});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva)||fechaReserva<today)return res.status(400).json({message:'La fecha no puede ser anterior a hoy.'});
  let slot;try{slot=schedule(req.body);}catch(e){return res.status(400).json({message:e.message});}
  if(Date.parse(slot.inicio)<Date.now())return res.status(400).json({message:'La hora de entrada ya pasó. Selecciona una fecha y hora futuras.'});
  client=await db.pool.connect();await client.query('BEGIN');
  const tariffRows=(await client.query('SELECT clave,valor FROM tarifas')).rows;
  const rates=Object.fromEntries(tariffRows.map(r=>[r.clave,Number(r.valor)]));
  let quote;
  try{quote=calculateQuote({suite,subplan,numPersonas,fechaReserva,decoracion,spa},rates);}catch(e){await client.query('ROLLBACK');return res.status(400).json({message:e.message});}
  // Bloquear el espacio físico, incluso para reservas que cruzan medianoche.
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[slot.habitacion]);
  if(await conflicts(client,slot)){await client.query('ROLLBACK');return res.status(409).json({message:'La habitación está reservada en ese horario o en limpieza. Elige otro horario o habitación.'});}
  const {rows}=await client.query(`INSERT INTO reservas (usuario_id,"clienteNombre",suite,subplan,"numPersonas","fechaReserva",decoracion,spa,"esTarifaSemana",comentarios,"precioTotal",precio_alojamiento,precio_decoracion,precio_spa,habitacion,inicio,fin,estado)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pendiente') RETURNING id,suite,habitacion,inicio,fin,subplan,"numPersonas","fechaReserva",decoracion,spa,"esTarifaSemana","precioTotal",estado`,
   [req.user.id,req.user.nombre,suite,suite==='Casita Mágica'?subplan:null,Number(numPersonas),fechaReserva,decoracion||'Ninguna',spa||'Ninguno',quote.esTarifaSemana,comentarios||'',quote.total,quote.alojamiento,quote.decoracion,quote.spa,slot.habitacion,slot.inicio,slot.fin]);
  await client.query('COMMIT');res.status(201).json({message:'Solicitud guardada. Pendiente de confirmación.',data:rows[0],desglose:quote});
 }catch(e){if(client)try{await client.query('ROLLBACK')}catch{}next(e);}finally{if(client)client.release();}
});
module.exports=router;
