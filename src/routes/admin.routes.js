const express=require('express');const db=require('../config/db');
const {requireAuth,requireAdmin}=require('../middleware/auth');
const {dateValid,dayReservations}=require('../domain/availability');
const {DEFAULT_MAP,DEFAULT_TARIFFS}=require('../domain/pricing');
const reportWorkbook=require('../domain/report-workbook');
const tariffLabels=Object.fromEntries(DEFAULT_TARIFFS.map(t=>[t.key,t.label]));
const {pagination,metadata,validId,search,STATES,bad}=require('../domain/listing');
const router=express.Router();router.use(requireAuth,requireAdmin);
router.get('/disponibilidad',async(req,res,next)=>{try{if(!dateValid(req.query.fecha))return res.status(400).json({message:'Fecha inválida.'});res.json({data:await dayReservations(db,req.query.fecha,true)});}catch(e){next(e);}});
router.get('/tarifas',async(req,res,next)=>{try{const {rows}=await db.query('SELECT clave,categoria,descripcion,valor,actualizado_en FROM tarifas ORDER BY categoria,descripcion');res.json({data:rows.map(row=>({...row,descripcion:tariffLabels[row.clave]||row.descripcion}))});}catch(e){next(e);}});
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
router.get('/resumen',async(req,res,next)=>{try{
 const {rows}=await db.query(`SELECT COUNT(*) FILTER(WHERE estado='pendiente')::int AS pendientes,COUNT(*) FILTER(WHERE estado='completada')::int AS completadas,COALESCE(SUM("precioTotal") FILTER(WHERE estado IN ('confirmada','completada')),0) AS importe_confirmado,(SELECT COUNT(*)::int FROM usuarios WHERE rol='cliente') AS clientes FROM reservas`);res.json({data:rows[0]});
}catch(e){next(e);}});
router.get('/reservas',async(req,res,next)=>{try{
 const page=pagination(req.query),q=search(req.query.q),state=req.query.estado,date=req.query.fecha;
 const params=[],where=[];const param=value=>{params.push(value);return '$'+params.length;};
 if(q){if(/^#?\d+$/.test(q))where.push('r.id::text='+param(q.replace(/^#/,'')));else{const key=param(q);where.push(`(STRPOS(LOWER(CONCAT_WS(' ',r.id,r."clienteNombre",u.correo,r.suite,r.habitacion)),LOWER(${key}))>0)`);}}
 if(state){if(typeof state!=='string'||!STATES.includes(state))bad('Estado inválido.');where.push('r.estado='+param(state));}
 if(date){if(!dateValid(date))bad('Fecha inválida.');where.push('r."fechaReserva"='+param(date));}
 const clause=where.length?' WHERE '+where.join(' AND '):'',join=' FROM reservas r LEFT JOIN usuarios u ON u.id=r.usuario_id';
 const fields=`r.id,r."clienteNombre",u.correo,u.telefono,r.usuario_id,r.suite,r.habitacion,r.inicio,r.fin,r.ingreso_registrado,r.subplan,r.comentarios,r."numPersonas",r."fechaReserva",r.decoracion,r.spa,r."esTarifaSemana",r."precioTotal",r.precio_alojamiento,r.precio_decoracion,r.precio_spa,r.estado,r."createdAt"`;
 const [list,count]=await Promise.all([db.query(`SELECT ${fields}${join}${clause} ORDER BY r."createdAt" DESC,r.id DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,page.pageSize,page.offset]),db.query(`SELECT COUNT(*)::int AS total${join}${clause}`,params)]);
 res.json({data:list.rows,pagination:metadata(page,count.rows[0].total)});
}catch(e){next(e);}});
router.post('/reservas/:id/ingreso',async(req,res,next)=>{
 let client;
 try{
  if(!validId(req.params.id,'2147483647'))return res.status(400).json({message:'Reserva inválida.'});
  client=await db.pool.connect();await client.query('BEGIN');
  const {rows}=await client.query(`UPDATE reservas SET ingreso_registrado=NOW(),"updatedAt"=NOW() WHERE id=$1 AND estado='confirmada' AND ingreso_registrado IS NULL AND inicio<=NOW() AND fin>NOW() RETURNING id`,[req.params.id]);
  if(!rows.length){await client.query('ROLLBACK');return res.status(409).json({message:'El ingreso requiere una reserva confirmada dentro de su horario y sin ingreso previo. Las reservas antiguas necesitan revisar primero sus horarios.'});}
  await client.query('INSERT INTO historial_reservas(reserva_id,usuario_id,accion) VALUES($1,$2,$3)',[req.params.id,req.user.id,'ingreso']);
  await client.query('COMMIT');res.json({message:'Ingreso registrado. Habitación ocupada.'});
 }catch(e){if(client)await client.query('ROLLBACK');next(e);}finally{if(client)client.release();}
});
router.patch('/reservas/:id/estado',async(req,res,next)=>{
 let client;
 try{
  const id=Number(req.params.id),estado=req.body?.estado;
  if(!validId(req.params.id,'2147483647')||!['pendiente','confirmada','completada','cancelada'].includes(estado))return res.status(400).json({message:'Estado o reserva inválidos.'});
  client=await db.pool.connect();await client.query('BEGIN');
  const current=(await client.query('SELECT id,suite,"fechaReserva"::text,fin,estado FROM reservas WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!current){await client.query('ROLLBACK');return res.status(404).json({message:'Reserva no encontrada.'});}
  const allowed={pendiente:['confirmada','cancelada'],confirmada:['completada','cancelada'],completada:[],cancelada:[]};
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(estado!==current.estado && !(allowed[current.estado]||[]).includes(estado)){await client.query('ROLLBACK');return res.status(409).json({message:'Cambio de estado no permitido.'});}
  if(estado==='completada' && (current.fin?new Date(current.fin)>new Date():current.fechaReserva>=today)){await client.query('ROLLBACK');return res.status(409).json({message:'Solo se puede completar una estadía después de su hora de salida. Las reservas antiguas sin horario requieren que pase su fecha.'});}
  const {rows}=await client.query('UPDATE reservas SET estado=$1,"updatedAt"=NOW() WHERE id=$2 RETURNING id,estado',[estado,id]);
  if(estado!==current.estado)await client.query('INSERT INTO historial_reservas(reserva_id,usuario_id,accion) VALUES($1,$2,$3)',[id,req.user.id,current.estado+' → '+estado]);
  await client.query('COMMIT');res.json({data:rows[0]});
 }catch(e){if(client)try{await client.query('ROLLBACK')}catch{}next(e);}finally{if(client)client.release();}
});
router.get('/clientes',async(req,res,next)=>{try{
 const page=pagination(req.query),q=search(req.query.q);const params=q?[q]:[];const where=" WHERE u.rol='cliente'"+(q?" AND STRPOS(LOWER(CONCAT_WS(' ',u.nombre,u.correo,u.telefono)),LOWER($1))>0":'');
 const [list,count]=await Promise.all([
 db.query(`SELECT u.id,u.nombre,u.correo,u.telefono,u.creado_en,COUNT(r.id) FILTER(WHERE r.estado='completada')::int AS hospedajes,COUNT(r.id) FILTER(WHERE r.estado='completada' AND r.spa<>'Ninguno')::int AS con_spa FROM usuarios u LEFT JOIN reservas r ON r.usuario_id=u.id ${where} GROUP BY u.id ORDER BY hospedajes DESC,u.nombre,u.id LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,page.pageSize,page.offset]),
 db.query(`SELECT COUNT(*)::int AS total FROM usuarios u ${where}`,params)]);
 res.json({data:list.rows,pagination:metadata(page,count.rows[0].total)});
 }catch(e){next(e);}});
router.get('/clientes/:id',async(req,res,next)=>{try{
 if(!validId(req.params.id))return res.status(400).json({message:'Cliente inválido.'});const page=pagination(req.query);
 const {rows}=await db.query("SELECT id,nombre,correo,telefono,creado_en FROM usuarios WHERE id=$1 AND rol='cliente'",[req.params.id]);
 if(!rows.length)return res.status(404).json({message:'Cliente no encontrado.'});
 const [list,count]=await Promise.all([db.query(`SELECT id,suite,subplan,"numPersonas","fechaReserva",decoracion,spa,"precioTotal",estado FROM reservas WHERE usuario_id=$1 ORDER BY "fechaReserva" DESC,id DESC LIMIT $2 OFFSET $3`,[req.params.id,page.pageSize,page.offset]),db.query('SELECT COUNT(*)::int AS total FROM reservas WHERE usuario_id=$1',[req.params.id])]);
 res.json({data:{...rows[0],reservas:list.rows},pagination:metadata(page,count.rows[0].total)});
 }catch(e){next(e);}});
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
  const report={inicio:start,finExclusivo:new Date(Date.parse(start)+7*86400000).toISOString().slice(0,10),resumen:summary.rows[0],habitaciones:suites.rows,dias:days.rows,serviciosSpa:services.rows};
  if(req.query.formato==='xlsx')return res.attachment('dapa-reporte-'+start+'.xlsx').send(reportWorkbook(report));
  res.json(report);
 }catch(e){next(e);}
});
module.exports=router;
