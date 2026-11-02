const assert=require('node:assert/strict');const express=require('express');const db=require('../src/config/db');const auth=require('../src/middleware/auth');
(async()=>{const client=await db.pool.connect();let server;
 const connect=db.pool.connect.bind(db.pool),query=db.query;
 try{
 await client.query('BEGIN');
 await client.query(`CREATE TEMP TABLE reservas(id integer,suite text,"fechaReserva" date,estado text,inicio timestamptz,fin timestamptz,ingreso_registrado timestamptz,"updatedAt" timestamptz) ON COMMIT PRESERVE ROWS`);
 await client.query(`CREATE TEMP TABLE historial_reservas(reserva_id integer,usuario_id integer,accion text) ON COMMIT PRESERVE ROWS`);
 await client.query(`INSERT INTO reservas(id,suite,"fechaReserva",estado,inicio,fin) VALUES(1,'Casita Mágica',CURRENT_DATE,'confirmada',NOW()-INTERVAL '1 hour',NOW()+INTERVAL '3 hours'),(2,'Casita Mágica',CURRENT_DATE+1,'confirmada',NOW()+INTERVAL '1 day',NOW()+INTERVAL '28 hours'),(3,'Casita Mágica',CURRENT_DATE,'pendiente',NOW()-INTERVAL '1 hour',NOW()+INTERVAL '3 hours')`);
 await client.query('COMMIT');
 db.pool.connect=async()=>({query:client.query.bind(client),release(){}});db.query=client.query.bind(client);
 auth.requireAuth=(req,res,next)=>{req.user={id:7,rol:'admin'};next();};auth.requireAdmin=(req,res,next)=>next();
 const app=express();app.use(express.json());app.use('/admin',require('../src/routes/admin.routes'));app.use((e,req,res,next)=>{console.error(e.message);res.status(500).end();});
 server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 for(const [id,expected] of [[1,200],[1,409],[2,409],[3,409]]){const response=await fetch(base+'/admin/reservas/'+id+'/ingreso',{method:'POST'});assert.equal(response.status,expected,await response.text());}
 assert.equal((await client.query('SELECT * FROM historial_reservas')).rows.length,1);
 const response=await fetch(base+'/admin/reservas/1/estado',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({estado:'completada'})});assert.equal(response.status,409);
 console.log('✓ PostgreSQL: ingreso confirmado, rechazo de ingresos futuros/duplicados/pendientes, auditoría y salida futura');
 }finally{
 if(server)await new Promise(r=>server.close(r));db.pool.connect=connect;db.query=query;
 try{await client.query('ROLLBACK');await client.query('DROP TABLE IF EXISTS pg_temp.reservas,pg_temp.historial_reservas');}finally{client.release();await db.pool.end();}
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
