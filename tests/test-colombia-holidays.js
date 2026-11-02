const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const cal=require('../public/colombia-calendar');const {calculateQuote,DEFAULT_MAP}=require('../src/domain/pricing');
const expected2026=['2026-01-01','2026-01-12','2026-03-23','2026-04-02','2026-04-03','2026-05-01','2026-05-18','2026-06-08','2026-06-15','2026-06-29','2026-07-13','2026-07-20','2026-08-07','2026-08-17','2026-10-12','2026-11-02','2026-11-16','2026-12-08','2026-12-25'];
// Calendario 2026 contrastado con las reglas de Ley 51/1983 y Ley 2578/2026.
assert.deepEqual(cal.holidays(2026).map(x=>x.date),expected2026);
for(const date of ['2026-01-06','2026-03-19','2026-07-09','2026-11-01','2026-11-11'])assert.equal(cal.isHoliday(date),false,date+' debe trasladarse al lunes');
assert.equal(cal.isHoliday('2026-11-02'),true);assert.equal(cal.isHoliday('2027-03-25'),true);assert.equal(cal.isHoliday('2027-03-26'),true);
for(const date of ['2027-05-10','2027-05-31','2027-06-07','2027-07-12'])assert.equal(cal.isHoliday(date),true,date);
assert.equal(cal.isHoliday('2025-07-14'),false);assert.match(cal.holidayName('2025-06-30'),/San Pedro/);assert.match(cal.holidayName('2025-06-30'),/Sagrado Corazón/);
for(const bad of ['2026-02-30','2026-13-01','abc',null,'2026-1-1'])assert.equal(cal.isHoliday(bad),false);
const quote=(suite,fechaReserva,patch={})=>calculateQuote({suite,fechaReserva,numPersonas:2,subplan:'Plan Relax',esTarifaSemana:true,...patch},DEFAULT_MAP);
for(const suite of ['Suite Orquídeas','Suite Eugenias','Suite Aves del Paraíso','Suite Margaritas']){
 const high=suite.includes('Orquídeas')||suite.includes('Eugenias')?650000:490000,low=high===650000?590000:420000;
 assert.equal(quote(suite,'2026-11-02').total,high,suite+' festivo');assert.equal(quote(suite,'2026-11-03').total,low,suite+' normal');assert.equal(quote(suite,'2026-11-02').esTarifaSemana,false);
}
assert.equal(quote('Suite Eugenias','2026-11-02',{numPersonas:4}).total,880000);
assert.equal(quote('Pasadía','2026-11-02').total,360000);assert.equal(quote('Pasadía','2026-11-03').total,320000);assert.equal(quote('Pasadía','2026-11-07').total,360000);assert.equal(quote('Pasadía','2026-11-08').total,320000);
assert.equal(quote('Casita Mágica','2026-11-02').total,200000);assert.equal(quote('Casita Mágica','2026-11-03').total,200000);
const browser={};vm.createContext(browser);vm.runInContext(fs.readFileSync(require.resolve('../public/colombia-calendar'),'utf8'),browser);
for(const year of [2025,2026,2027,2028])assert.equal(JSON.stringify(browser.DapaCalendar.holidays(year)),JSON.stringify(cal.holidays(year)));
const oldTimezone=process.env.TZ;try{for(const zone of ['UTC','America/Bogota','Pacific/Auckland','America/Los_Angeles']){process.env.TZ=zone;assert.equal(cal.isHoliday('2026-11-02'),true);assert.equal(quote('Suite Orquídeas','2026-11-02').total,650000);}}finally{if(oldTimezone===undefined)delete process.env.TZ;else process.env.TZ=oldTimezone;}
console.log('✓ Festivos colombianos 2026 y 2027, traslados, Semana Santa, Chiquinquirá, coincidencias, zonas horarias y tarifas compartidas');
