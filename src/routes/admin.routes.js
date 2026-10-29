const express=require('express');const db=require('../config/db');
const {requireAuth,requireAdmin}=require('../middleware/auth');
const {DEFAULT_MAP}=require('../domain/pricing');
const router=express.Router();router.use(requireAuth,requireAdmin);
router.get('/tarifas',async(req,res,next)=>{try{const {rows}=await db.query('SELECT clave,categoria,descripcion,valor,actualizado_en FROM tarifas ORDER BY categoria,descripcion');res.json({data:rows});}catch(e){next(e);}});
router.patch('/tarifas/:clave',async(req,res,next)=>{
 let client;
 try{
  const key=req.params.clave,valor=req.body?.valor;
  if(!Object.hasOwn(DEFAULT_MAP,key)||typeof valor!=='number'||!Number.isSafeInteger(valor)||valor<0||valor>1000000000)return res.status(400).json({message:'Clave o precio inválido (COP entero no negativo).'});
  client=await db.pool.connect();await client.query('BEGIN');
  const {rows}=await client.query('SELECT valor FROM tarifas WHERE clave=$1 FOR UPDATE',[key]);
  if(!rows.length){await client.query('ROLLBACK');return res.status(404).json({message:'Tarifa no encontrada.'});}
  const before=Number(rows[0].valor);
  if(before!==valor){await client.query('UPDATE tarifas SET valor=$1,actualizado_por=$2,actualizado_en=NOW() WHERE clave=$3',[valor,req.user.id,key]);await client.query('INSERT INTO historial_tarifas (clave,valor_anterior,valor_nuevo,usuario_id) VALUES ($1,$2,$3,$4)',[key,before,valor,req.user.id]);}
  await client.query('COMMIT');res.json({message:'Tarifa actualizada',clave:key,valor});
 }catch(e){if(client)try{await client.query('ROLLBACK')}catch{}next(e);}finally{if(client)client.release();}
});
router.get('/tarifas/historial',async(req,res,next)=>{try{const {rows}=await db.query(`SELECT h.clave,h.valor_anterior,h.valor_nuevo,h.fecha,u.nombre AS editor FROM historial_tarifas h LEFT JOIN usuarios u ON u.id=h.usuario_id ORDER BY h.fecha DESC LIMIT 100`);res.json({data:rows});}catch(e){next(e);}});
router.get('/reservas',async(req,res,next)=>{try{const {rows}=await db.query(`SELECT r.id,r."clienteNombre",u.correo,u.telefono,r.usuario_id,r.suite,r.subplan,r."numPersonas",r."fechaReserva",r.decoracion,r.spa,r."esTarifaSemana",r."precioTotal",r.precio_alojamiento,r.precio_decoracion,r.precio_spa,r.estado,r."createdAt" FROM reservas r LEFT JOIN usuarios u ON u.id=r.usuario_id ORDER BY r."createdAt" DESC LIMIT 500`);res.json({data:rows});}catch(e){next(e);}});
router.patch('/reservas/:id/estado',async(req,res,next)=>{
 let client;
 try{
  const id=Number(req.params.id),estado=req.body?.estado;
  if(!Number.isSafeInteger(id)||id<1||!['pendiente','confirmada','completada','cancelada'].includes(estado))return res.status(400).json({message:'Estado o reserva inválidos.'});
  client=await db.pool.connect();await client.query('BEGIN');
  const current=(await client.query('SELECT id,suite,"fechaReserva",estado FROM reservas WHERE id=$1',[id])).rows[0];
  if(!current){await client.query('ROLLBACK');return res.status(404).json({message:'Reserva no encontrada.'});}
  // Igual que al crear: serializar por suite y fecha para impedir reactivar reservas incompatibles.
  if(estado!=='cancelada'){
   const date=String(current.fechaReserva).slice(0,10); // pg devuelve Date o texto.
   const day=current.fechaReserva instanceof Date ? current.fechaReserva.toISOString().slice(0,10) : date;
   await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[current.suite,day]);
   const busy=(await client.query(`SELECT id FROM reservas WHERE id<>$1 AND suite=$2 AND "fechaReserva"=$3 AND estado IN ('pendiente','confirmada','completada') LIMIT 1`,[id,current.suite,day])).rows;
   if(busy.length){await client.query('ROLLBACK');return res.status(409).json({message:'No se puede activar: hay otra reserva para esa suite y fecha.'});}
  }
  const {rows}=await client.query('UPDATE reservas SET estado=$1,"updatedAt"=NOW() WHERE id=$2 RETURNING id,estado',[estado,id]);
  await client.query('COMMIT');res.json({data:rows[0]});
 }catch(e){if(client)try{await client.query('ROLLBACK')}catch{}next(e);}finally{if(client)client.release();}
});
router.get('/clientes',async(req,res,next)=>{try{
 const {rows}=await db.query(`SELECT u.id,u.nombre,u.correo,u.telefono,u.creado_en,COUNT(r.id) FILTER (WHERE r.estado='completada')::integer AS hospedajes,COUNT(r.id) FILTER (WHERE r.estado='completada' AND r.spa <> 'Ninguno')::integer AS con_spa FROM usuarios u LEFT JOIN reservas r ON r.usuario_id=u.id WHERE u.rol='cliente' GROUP BY u.id ORDER BY hospedajes DESC,u.nombre LIMIT 500`);res.json({data:rows});
 }catch(e){next(e);}});
router.get('/clientes/:id',async(req,res,next)=>{
 try{
  if(!/^\d+$/.test(req.params.id))return res.status(400).json({message:'Cliente inválido'});
  const {rows}=await db.query('SELECT id,nombre,correo,telefono,creado_en FROM usuarios WHERE id=$1 AND rol=$2',[req.params.id,'cliente']);
  if(!rows.length)return res.status(404).json({message:'Cliente no encontrado'});
  const reservations=(await db.query(`SELECT id,suite,subplan,"numPersonas","fechaReserva",decoracion,spa,"precioTotal",estado FROM reservas WHERE usuario_id=$1 ORDER BY "fechaReserva" DESC LIMIT 300`,[req.params.id])).rows;
  res.json({data:{...rows[0],reservas:reservations}});
 }catch(e){next(e);}
});
router.get('/reportes/semana',async(req,res,next)=>{
 try{
  const start=req.query.inicio;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||Number.isNaN(Date.parse(start))||new Date(start).toISOString().slice(0,10)!==start)return res.status(400).json({message:'Usa inicio con formato AAAA-MM-DD'});
  // Solo reservas confirmadas/completadas: las pendientes no cuentan como alquiler.
  const values=[start];const where=`"fechaReserva">=$1::date AND "fechaReserva"<($1::date + INTERVAL '7 days') AND estado IN ('confirmada','completada')`;
  const [summary,suites,days,services]=await Promise.all([
   db.query(`SELECT COUNT(*)::int AS reservas,COALESCE(SUM("precioTotal"),0) AS ingresos,COUNT(DISTINCT usuario_id)::int AS clientes FROM reservas WHERE ${where}`,values),
   db.query(`SELECT suite,COUNT(*)::int AS reservas,COALESCE(SUM("precioTotal"),0) AS ingresos FROM reservas WHERE ${where} GROUP BY suite ORDER BY reservas DESC,suite`,values),
   db.query(`SELECT EXTRACT(ISODOW FROM "fechaReserva")::int AS dia,COUNT(*)::int AS reservas FROM reservas WHERE ${where} GROUP BY dia ORDER BY dia`,values),
   db.query(`SELECT spa,COUNT(*)::int AS reservas FROM reservas WHERE ${where} GROUP BY spa ORDER BY reservas DESC`,values)
  ]);
  res.json({inicio:start,finExclusivo:new Date(Date.parse(start)+7*86400000).toISOString().slice(0,10),resumen:summary.rows[0],habitaciones:suites.rows,dias:days.rows,serviciosSpa:services.rows});
 }catch(e){next(e);}
});
module.exports=router;
