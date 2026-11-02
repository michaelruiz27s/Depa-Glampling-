const assert=require('node:assert/strict');
const express=require('express');
const db=require('../src/config/db');
const auth=require('../src/middleware/auth');
let current,updates=0,cancelRows=[],busy=[];
const client={release(){},async query(sql,args){
 if(sql.startsWith('SELECT id,suite'))return {rows:[current]};
 if(sql.startsWith('SELECT id FROM reservas'))return {rows:busy};
 if(sql.startsWith('UPDATE reservas')){updates++;return {rows:[{id:1,estado:args[0]}]};}
 return {rows:[]};
}};
db.pool.connect=async()=>client;
db.query=async(sql,args)=>{if(sql.startsWith('UPDATE reservas')){assert.equal(args[1],7);return {rows:cancelRows};}return {rows:[]};};
auth.requireAuth=(req,res,next)=>{req.user={id:7,rol:'cliente'};next();};
auth.requireAdmin=(req,res,next)=>next();
const app=express();app.use(express.json());app.use('/admin',require('../src/routes/admin.routes'));app.use('/bookings',require('../src/routes/booking.routes'));
(async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  async function change(from,to,date,expected){current={id:1,suite:'Suite Orquídeas',fechaReserva:date,estado:from};const before=updates;const res=await fetch(base+'/admin/reservas/1/estado',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({estado:to})});assert.equal(res.status,expected,await res.text());assert.equal(updates-before,expected===200?1:0);}
  await change('cancelada','completada','2020-01-01',409);
  await change('pendiente','completada','2020-01-01',409);
  await change('confirmada','completada','2999-01-01',409);
  await change('confirmada','completada','2020-01-01',200);
  await change('pendiente','confirmada','2999-01-01',200);
  await change('completada','pendiente','2020-01-01',409);
  await change('pendiente','cancelada','2999-01-01',200);
  cancelRows=[];assert.equal((await fetch(base+'/bookings/8/cancel',{method:'PATCH'})).status,409);
  cancelRows=[{id:8}];assert.equal((await fetch(base+'/bookings/8/cancel',{method:'PATCH'})).status,200);
  assert.equal((await fetch(base+'/bookings/invalid/cancel',{method:'PATCH'})).status,400);
  console.log('✓ 10 verificaciones de transiciones, fechas, colisiones y cancelación del cliente');
 }finally{await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

