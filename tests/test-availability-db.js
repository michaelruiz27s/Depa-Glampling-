const assert=require('node:assert/strict');
const db=require('../src/config/db');
const {schedule,conflicts,dayReservations}=require('../src/domain/availability');
(async()=>{const c=await db.pool.connect();try{
 await c.query('BEGIN');await c.query(`CREATE TEMP TABLE reservas (id serial,suite text,habitacion text,estado text,"fechaReserva" date,inicio timestamptz,fin timestamptz) ON COMMIT DROP`);
 const slot=schedule({suite:'Casita Mágica',subplan:'Plan Relax',fechaReserva:'2026-11-10',horaEntrada:'10:00'});
 await c.query('INSERT INTO reservas(suite,habitacion,estado,"fechaReserva",inicio,fin) VALUES($1,$2,$3,$4,$5,$6)',['Casita Mágica',slot.habitacion,'pendiente','2026-11-10',slot.inicio,slot.fin]);
 for(const [time,expected] of [['13:59',true],['14:00',true],['14:59',true],['15:00',false],['05:00',false],['05:01',true]])assert.equal(await conflicts(c,schedule({suite:'Casita Mágica',subplan:'Plan Relax',fechaReserva:'2026-11-10',horaEntrada:time})),expected,time);
 assert.equal(await conflicts(c,schedule({suite:'Pasadía',habitacion:'Casita Mágica',fechaReserva:'2026-11-10'})),true);
 assert.equal(await conflicts(c,schedule({suite:'Pasadía',habitacion:'Suite Margaritas',fechaReserva:'2026-11-10'})),false);
 assert.equal((await dayReservations(c,'2026-11-10')).length,1);
 await c.query("UPDATE reservas SET estado='cancelada'");assert.equal(await conflicts(c,slot),false);
 await c.query(`INSERT INTO reservas(suite,estado,"fechaReserva") VALUES('Pasadía','pendiente','2026-11-10')`);
 assert.equal(await conflicts(c,slot),true);
 console.log('✓ PostgreSQL: solapamientos, limpieza exacta, Casita/Pasadía compartidos, cancelación y reservas antiguas');
 }finally{await c.query('ROLLBACK');c.release();await db.pool.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
