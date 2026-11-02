const {ROOMS}=require('./pricing');
const PHYSICAL=Object.keys(ROOMS).filter(x=>x!=='Pasadía');
const PASADIA=['Casita Mágica','Suite Aves del Paraíso','Suite Margaritas'];
const CLEANING_MS=60*60*1000;
function dateValid(date){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;}
function schedule(data){
 const {suite,fechaReserva:date}=data;if(!ROOMS[suite]||!dateValid(date))throw new Error('Alojamiento o fecha inválidos.');
 const room=suite==='Pasadía'?data.habitacion:suite;
 if(!PHYSICAL.includes(room)||(suite==='Pasadía'&&!PASADIA.includes(room)))throw new Error('Elige la habitación física del Pasadía.');
 let time,hours;
 if(suite==='Casita Mágica'){
  time=data.horaEntrada;hours={'Plan Relax':4,'Plan Spa':5,'Plan Full':5}[data.subplan];
  if(!hours||typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Selecciona un plan y una hora de entrada válidos.');
 }else if(suite==='Pasadía'){time='10:00';hours=7;}
 else {const slot={'Suite Orquídeas':['16:00',22],'Suite Aves del Paraíso':['19:00',22],'Suite Margaritas':['19:00',22],'Suite Eugenias':['17:00',22]}[suite];[time,hours]=slot;}
 const inicio=new Date(date+'T'+time+':00-05:00');const fin=new Date(+inicio+hours*3600000);
 return {habitacion:room,inicio:inicio.toISOString(),fin:fin.toISOString()};
}
// Las reservas antiguas sin horario se bloquean conservadoramente hasta revisar sus datos.
const START=`COALESCE(inicio, ("fechaReserva"::timestamp AT TIME ZONE 'America/Bogota'))`;
const END=`COALESCE(fin, (("fechaReserva" + CASE WHEN suite IN ('Casita Mágica','Pasadía') THEN 1 ELSE 2 END)::timestamp AT TIME ZONE 'America/Bogota'))`;
const ROOM=`(habitacion=$1 OR (habitacion IS NULL AND (suite=$1 OR (suite='Pasadía' AND $1 IN ('Casita Mágica','Suite Aves del Paraíso','Suite Margaritas')))))`;
async function conflicts(client,slot,exclude=0){
 const {rows}=await client.query(`SELECT id FROM reservas WHERE ${ROOM} AND estado IN ('pendiente','confirmada','completada') AND id<>$4 AND ${START} < $3::timestamptz + INTERVAL '1 hour' AND ${END} + INTERVAL '1 hour' > $2::timestamptz LIMIT 1`,[slot.habitacion,slot.inicio,slot.fin,exclude]);return rows.length>0;
}
async function dayReservations(client,date,privateData=false){
 if(!dateValid(date))throw new Error('Fecha inválida.');
 const {rows}=await client.query(`SELECT ${privateData?'*':'suite,habitacion,estado'}, ${START} AS inicio_efectivo,${END} AS fin_efectivo FROM reservas WHERE estado IN ('pendiente','confirmada','completada') AND ${START}< (($1::date+1)::timestamp AT TIME ZONE 'America/Bogota') AND ${END}+INTERVAL '1 hour'>($1::date::timestamp AT TIME ZONE 'America/Bogota') ORDER BY ${START}`,[date]);return rows;
}
module.exports={PHYSICAL,PASADIA,CLEANING_MS,dateValid,schedule,conflicts,dayReservations};
