/* Calendario nacional colombiano. Reglas verificadas el 2026-11-01.
 * Ley 51 de 1983 y art. 6 de la Ley 2578 de 2026.
 * https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4954
 * https://www.mininterior.gov.co/noticias/gobierno-sanciona-ley-que-convierte-el-9-de-julio-en-nuevo-festivo-nacional/
 * Se comparte exactamente el mismo cálculo entre navegador y servidor.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DapaCalendar=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';const cache=new Map(),DAY=86400000;
 const iso=d=>d.toISOString().slice(0,10);
 function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>=1583&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&iso(new Date(value+'T12:00:00Z'))===value;}
 function easter(year){
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
  return new Date(Date.UTC(year,month-1,day,12));
 }
 const monday=date=>new Date(+date+((8-date.getUTCDay())%7)*DAY);
 function holidays(year){
  if(!Number.isInteger(year)||year<1583||year>9999)return Object.freeze([]);
  if(cache.has(year))return cache.get(year);const entries=new Map();
  const add=(date,name)=>{const key=iso(date);entries.set(key,entries.has(key)?entries.get(key)+' / '+name:name);};
  const fixed=(month,day,name,move=false)=>{const date=new Date(Date.UTC(year,month-1,day,12));add(move?monday(date):date,name);};
  for(const [month,day,name] of [[1,1,'Año Nuevo'],[5,1,'Día del Trabajo'],[7,20,'Independencia de Colombia'],[8,7,'Batalla de Boyacá'],[12,8,'Inmaculada Concepción'],[12,25,'Navidad']])fixed(month,day,name);
  for(const [month,day,name] of [[1,6,'Reyes Magos'],[3,19,'San José'],[6,29,'San Pedro y San Pablo'],[8,15,'Asunción de la Virgen'],[10,12,'Día de la Raza'],[11,1,'Todos los Santos'],[11,11,'Independencia de Cartagena']])fixed(month,day,name,true);
  const sunday=easter(year);for(const [offset,name,move] of [[-3,'Jueves Santo',false],[-2,'Viernes Santo',false],[39,'Ascensión del Señor',true],[60,'Corpus Christi',true],[68,'Sagrado Corazón de Jesús',true]]){const date=new Date(+sunday+offset*DAY);add(move?monday(date):date,name);}
  if(year>=2026)fixed(7,9,'Nuestra Señora del Rosario de Chiquinquirá',true);
  const result=Object.freeze([...entries].sort(([a],[b])=>a.localeCompare(b)).map(([date,name])=>Object.freeze({date,name})));
  if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(year,result);return result;
 }
 function holidayName(date){if(!validDate(date))return '';return holidays(Number(date.slice(0,4))).find(day=>day.date===date)?.name||'';}
 function isHoliday(date){return !!holidayName(date);}
 function isWeekday(date,suite){if(!validDate(date))return false;const day=new Date(date+'T12:00:00Z').getUTCDay();return !isHoliday(date)&&(suite==='Pasadía'?day!==6:day<=4);}
 return Object.freeze({holidays,holidayName,isHoliday,isWeekday});
});
