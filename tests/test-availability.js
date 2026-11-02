const assert=require('node:assert/strict');
const {schedule,conflicts,dateValid,dayReservations}=require('../src/domain/availability');
(async()=>{
 const slot=schedule({suite:'Casita Mágica',subplan:'Plan Relax',fechaReserva:'2026-11-10',horaEntrada:'23:30'});
 assert.equal(slot.inicio,'2026-11-11T04:30:00.000Z');assert.equal(slot.fin,'2026-11-11T08:30:00.000Z');
 assert.throws(()=>schedule({suite:'Casita Mágica',subplan:'Plan Relax',fechaReserva:'2026-11-10',horaEntrada:'24:00'}));
 assert.throws(()=>schedule({suite:'Pasadía',fechaReserva:'2026-11-10',habitacion:'Suite Eugenias'}));
 const day=schedule({suite:'Pasadía',fechaReserva:'2026-11-10',habitacion:'Casita Mágica'});assert.equal(day.fin,'2026-11-10T22:00:00.000Z');
 assert.equal(dateValid('2026-02-30'),false);
 const nights=schedule({suite:'Suite Margaritas',fechaReserva:'2026-11-10'});assert.equal(nights.fin,'2026-11-11T22:00:00.000Z');
 let params,query;
 const fake={async query(sql,args){query=sql;params=args;return {rows:[{id:1}]};}};
 assert.equal(await conflicts(fake,day),true);assert.equal(params[0],'Casita Mágica');assert.match(query,/INTERVAL '1 hour'/);assert.match(query,/habitacion IS NULL/);assert.match(query,/pendiente/);
 await dayReservations(fake,'2026-11-10');assert.equal(params[0],'2026-11-10');assert.match(query,/America\/Bogota/);assert(!query.includes('clienteNombre'));
 console.log('✓ Horarios libres, cruce de medianoche, Pasadía en Casita, validación y privacidad de disponibilidad');
})().catch(e=>{console.error(e);process.exitCode=1;});
