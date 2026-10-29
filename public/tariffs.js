// Tarifa oficial: la devuelve el servidor. Sin acceso a BD se mantiene el catálogo
// visual, pero no se permite guardar solicitudes con cotizaciones no verificadas.
(function(){
 const rates={};let loaded=false;
 const money=n=>'$'+Number(n).toLocaleString('es-CO',{maximumFractionDigits:0})+' COP';
 const compact=n=>'$'+Number(n).toLocaleString('es-CO',{maximumFractionDigits:0});
 const get=(key,fallback=0)=>Object.hasOwn(rates,key)?Number(rates[key]):fallback;
 function render(){
  document.querySelectorAll('[data-rate-key]').forEach(el=>{
   const v=get(el.dataset.rateKey);
   if(el.tagName==='OPTION')el.textContent=(el.dataset.baseLabel||el.value)+' — '+money(v);
   else if(el.dataset.ratePrefix) el.textContent=el.dataset.ratePrefix+compact(v)+(el.dataset.rateSuffix||'');
   else el.textContent=money(v);
  });
  document.querySelectorAll('[data-rate-template]').forEach(el=>{
   el.textContent=el.dataset.rateTemplate.replace(/\[\[([\w]+)\]\]/g,(_,key)=>compact(get(key)));
  });
 }
 async function refresh(){
  try{
   const response=await fetch('/api/catalog',{cache:'no-store'});
   if(!response.ok)throw new Error('No se pudo consultar el catálogo');
   const payload=await response.json();
   if(!payload.tarifas||Object.keys(payload.tarifas).length<30)throw new Error('Catálogo incompleto');
   Object.assign(rates,payload.tarifas);loaded=true;
   render();window.dispatchEvent(new CustomEvent('dapa:tarifas-cargadas'));
   const error=document.getElementById('tariff-status');if(error)error.hidden=true;
  }catch(e){loaded=false;const error=document.getElementById('tariff-status');if(error){error.textContent='No se pueden verificar los precios en este momento. El formulario de reservas estará disponible cuando se restablezca la conexión.';error.hidden=false;}}
 }
 window.DapaTarifas={get,money,compact,refresh,ready:()=>loaded};
 document.addEventListener('DOMContentLoaded',refresh);
})();
