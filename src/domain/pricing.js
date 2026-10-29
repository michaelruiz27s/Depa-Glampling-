// Única fuente de los valores predeterminados. Los precios vigentes se leen de PostgreSQL.
const defaults = [];
const add = (key, category, label, amount) => defaults.push({ key, category, label, amount });
add('casita_relax','Alojamiento','Casita Mágica · Plan Relax',200000);
add('casita_spa','Alojamiento','Casita Mágica · Plan Spa',359900);
add('casita_full','Alojamiento','Casita Mágica · Plan Full',399900);
add('casita_extra','Extras','Casita Mágica · huésped adicional',30000);
add('casita_hora_extra','Extras','Casita Mágica · hora adicional (informativo)',30000);
for(const room of ['orquideas','eugenias']) {
  for(const [kind, amounts] of [['semana',[590000,710000,810000]],['finde',[650000,770000,880000]]]) {
    [2,3,4].forEach((people,i)=>add(`${room}_${kind}_${people}`,'Alojamiento',`${room==='orquideas'?'Suite Orquídeas':'Suite Eugenias'} · ${kind==='semana'?'Dom–Jue':'Vie–Sáb'} · ${people} personas`,amounts[i]));
  }
}
add('eugenias_extra','Extras','Suite Eugenias · huésped adicional (5 a 8)',160000);
for(const room of ['aves','margaritas']) {
  add(`${room}_semana`,'Alojamiento',`${room==='aves'?'Aves del Paraíso':'Margaritas'} · Dom–Jue`,420000);
  add(`${room}_finde`,'Alojamiento',`${room==='aves'?'Aves del Paraíso':'Margaritas'} · Vie–Sáb`,490000);
}
add('pasadia_semana','Alojamiento','Pasadía · excepto sábado',320000);
add('pasadia_sabado','Alojamiento','Pasadía · sábado',360000);
for(const [key,label,price] of [
 ['spa_relajante_1','Spa relajante · 1 persona',95000], ['spa_relajante_2','Spa relajante · 2 personas',165000],
 ['spa_piedras_1','Spa con piedras · 1 persona',140000], ['spa_piedras_2','Spa con piedras · 2 personas',240000]
])add(key,'Spa',label,price);
for(const [key,label,price] of [
 ['decor_estandar','Decoración estándar',59000],['decor_elios','Decoración Elios (Casita/Orquídeas/Eugenias)',180000],
 ['decor_elios_pareja','Decoración Elios (Aves/Margaritas)',140000],['decor_petalos','Decoración Pétalos',85000],
 ['decor_globos','Decoración Globos',125000],['decor_velas','Decoración Velas',136000],
 ['decor_pizarra','Decoración Pizarra',70000]
])add(key,'Decoraciones',label,price);
for(const [key,label,price] of [
 ['decor_elios_vino','Elios · con vino (informativo)',267000],['decor_elios_champana','Elios · con champaña (informativo)',321000],
 ['decor_estandar_vino','Estándar · con vino (informativo)',146000],['decor_estandar_champana','Estándar · con champaña (informativo)',200000],
 ['decor_pizarra_vino','Pizarra · con vino (informativo)',157000],['decor_pizarra_champana','Pizarra · con champaña (informativo)',211000]
])add(key,'Variaciones de decoración',label,price);
const DEFAULT_TARIFFS = Object.freeze(defaults);
const DEFAULT_MAP = Object.freeze(Object.fromEntries(defaults.map(x=>[x.key,x.amount])));
const ROOMS = Object.freeze({
 'Casita Mágica': { capacities: [2,3,4], decorations: ['Ninguna','Decoración Estándar','Decoración Elios'] },
 'Suite Orquídeas': { capacities: [2,3,4], decorations: ['Ninguna','Decoración Elios'] },
 'Suite Aves del Paraíso': { capacities: [2], decorations: ['Ninguna','Decoración Estándar','Decoración Pétalos','Decoración Globos','Decoración Velas','Decoración Elios'] },
 'Suite Margaritas': { capacities: [2], decorations: ['Ninguna','Decoración Estándar','Decoración Pétalos','Decoración Globos','Decoración Velas','Decoración Elios'] },
 'Suite Eugenias': { capacities: [2,3,4,5,6,7,8], decorations: ['Ninguna','Decoración Pizarra','Decoración Elios'] },
 'Pasadía': { capacities: [2], decorations: ['Ninguna'] }
});
const SPA_KEYS = Object.freeze({'Ninguno':null,'Spa Relajante 1p':'spa_relajante_1','Spa Relajante 2p':'spa_relajante_2','Spa Piedras 1p':'spa_piedras_1','Spa Piedras 2p':'spa_piedras_2'});
function decorationKey(suite, decor) {
  if (decor === 'Ninguna') return null;
  const keys = { 'Decoración Estándar':'decor_estandar', 'Decoración Elios':['Suite Aves del Paraíso','Suite Margaritas'].includes(suite)?'decor_elios_pareja':'decor_elios', 'Decoración Pétalos':'decor_petalos','Decoración Globos':'decor_globos','Decoración Velas':'decor_velas','Decoración Pizarra':'decor_pizarra' };
  return keys[decor];
}
function isWeekday(date, suite) {
  const day = new Date(date+'T12:00:00Z').getUTCDay();
  return suite === 'Pasadía' ? day!==6 : day<=4;
}
function calculateQuote(data, rates) {
  const {suite,subplan,numPersonas,fechaReserva} = data;
  const config=ROOMS[suite];
  if (!config) throw new Error('Alojamiento no disponible');
  const people=Number(numPersonas);
  if (!Number.isInteger(people)||!config.capacities.includes(people)) throw new Error('Número de huéspedes no permitido');
  if (typeof fechaReserva!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva)||Number.isNaN(Date.parse(fechaReserva+'T12:00:00Z'))||new Date(fechaReserva+'T12:00:00Z').toISOString().slice(0,10)!==fechaReserva) throw new Error('Fecha inválida');
  const decor=data.decoracion||'Ninguna';
  const spa=data.spa||'Ninguno';
  if (!config.decorations.includes(decor)) throw new Error('Decoración no disponible en la suite');
  if (!Object.prototype.hasOwnProperty.call(SPA_KEYS,spa)) throw new Error('Servicio de spa no válido');
  const week=isWeekday(fechaReserva,suite);
  let key;
  if(suite==='Casita Mágica') {
    key=({'Plan Relax':'casita_relax','Plan Spa':'casita_spa','Plan Full':'casita_full'})[subplan];
    if(!key) throw new Error('Selecciona un plan de Casita Mágica');
  } else if (suite==='Pasadía') key=week?'pasadia_semana':'pasadia_sabado';
  else if (['Suite Aves del Paraíso','Suite Margaritas'].includes(suite)) key=(suite==='Suite Margaritas'?'margaritas':'aves')+'_'+(week?'semana':'finde');
  else key=(suite==='Suite Orquídeas'?'orquideas':'eugenias')+'_'+(week?'semana':'finde')+'_'+Math.min(people,4);
  const price = k => k? Number(rates[k]) : 0;
  if(!Number.isFinite(price(key))) throw new Error('Tarifa no disponible');
  let accommodation=price(key);
  if(suite==='Casita Mágica') accommodation+=Math.max(0,people-2)*price('casita_extra');
  if(suite==='Suite Eugenias') accommodation+=Math.max(0,people-4)*price('eugenias_extra');
  const decorTotal=price(decorationKey(suite,decor));
  const spaTotal=price(SPA_KEYS[spa]);
  const result={alojamiento:accommodation,decoracion:decorTotal,spa:spaTotal,total:accommodation+decorTotal+spaTotal,esTarifaSemana:week};
  if(Object.values(result).some(v=>typeof v==='number'&&(!Number.isFinite(v)||v<0))) throw new Error('Tarifas no disponibles');
  return result;
}
module.exports={DEFAULT_TARIFFS,DEFAULT_MAP,ROOMS,SPA_KEYS,decorationKey,isWeekday,calculateQuote};
