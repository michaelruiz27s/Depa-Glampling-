(async()=>{
 const $=id=>document.getElementById(id),money=n=>Number(n).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}),number=n=>Number(n)||0;
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e;};
 const status=msg=>{$('admin-status').textContent=msg||'';};
 const api=async(url,opts)=>{const response=await fetch(url,opts);let data;try{data=await response.json();}catch{throw new Error('Servidor sin respuesta válida.');}if(!response.ok)throw new Error(data.message||'No se pudo completar la operación');return data;};
 const jsonPatch=(url,body)=>api(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const mkTable=(headers,rows)=>{const wrap=node('div');wrap.className='portal-table-wrap';const table=node('table');table.className='portal-table';const head=node('thead'),tr=node('tr');headers.forEach(h=>tr.append(node('th',h)));head.append(tr);table.append(head);const tbody=node('tbody');for(const cells of rows){const row=node('tr');for(const value of cells){const td=node('td');if(value instanceof Node)td.append(value);else td.textContent=String(value??'');row.append(td);}tbody.append(row);}table.append(tbody);wrap.append(table);return wrap;};
 const btn=(title,fn)=>{const b=node('button',title);b.className='portal-btn';b.type='button';b.onclick=fn;return b;};
 let bookings=[],clients=[],report=null;
 function dashboard(){
  const confirmed=bookings.filter(r=>['confirmada','completada'].includes(r.estado));
  const entries=[['Solicitudes pendientes',bookings.filter(r=>r.estado==='pendiente').length],['Hospedajes completados',bookings.filter(r=>r.estado==='completada').length],['Clientes registrados',clients.length],['Importe de reservas activas',money(confirmed.reduce((s,x)=>s+number(x.precioTotal),0))]];
  $('dashboard-kpis').replaceChildren(...entries.map(([label,value])=>{const div=node('div');div.className='portal-kpi';div.append(node('strong',value),node('span',label));return div;}));
 }
 async function loadBookings(){
  bookings=(await api('/api/admin/reservas')).data;dashboard();
  const rows=bookings.map(r=>{
   const select=node('select');select.setAttribute('aria-label','Estado reserva #'+r.id);
   for(const state of ['pendiente','confirmada','completada','cancelada']){const option=node('option',state);option.value=state;option.selected=state===r.estado;select.append(option);}
   select.addEventListener('change',async()=>{const desired=select.value;select.disabled=true;try{await jsonPatch('/api/admin/reservas/'+r.id+'/estado',{estado:desired});status('Estado actualizado: reserva #'+r.id);await Promise.all([loadBookings(),loadClients()]);}catch(e){select.value=r.estado;status(e.message);}finally{select.disabled=false;}});
   return [r.id,r.clienteNombre,r.correo||'Sin cuenta vinculada',String(r.fechaReserva).slice(0,10),r.suite,r.spa,r.decoracion,money(r.precioTotal),select];
  });
  $('admin-bookings').replaceChildren(mkTable(['#','Cliente','Correo','Fecha','Alojamiento','Spa','Decoración','Total','Estado'],rows));
 }
 async function loadRates(){
  const rates=(await api('/api/admin/tarifas')).data;
  const rows=rates.map(r=>{
   const input=node('input');input.type='number';input.min='0';input.max='1000000000';input.step='1';input.value=Number(r.valor);input.setAttribute('aria-label','Nuevo precio '+r.descripcion);
   const save=btn('Guardar',async()=>{
    const value=Number(input.value);
    if(!Number.isSafeInteger(value)||value<0||value>1e9){status('Introduce un precio entero válido en COP.');return;}
    save.disabled=true;try{await jsonPatch('/api/admin/tarifas/'+encodeURIComponent(r.clave),{valor:value});status('Tarifa actualizada: '+r.descripcion);await loadRates();}catch(e){status(e.message);}finally{save.disabled=false;}
   });
   return [r.categoria,r.descripcion,money(r.valor),input,save];
  });
  $('admin-rates').replaceChildren(mkTable(['Categoría','Concepto','Precio publicado','Nuevo precio (COP)','Acción'],rows));
  await loadHistory();
 }
 async function loadHistory(){
  const rows=(await api('/api/admin/tarifas/historial')).data;
  $('rate-history').replaceChildren(mkTable(['Fecha','Tarifa','Anterior','Nuevo','Editado por'],rows.map(r=>[new Date(r.fecha).toLocaleString('es-CO'),r.clave,money(r.valor_anterior),money(r.valor_nuevo),r.editor||'Sin registro'])));
 }
 async function loadClients(){
  clients=(await api('/api/admin/clientes')).data;dashboard();renderClients();
 }
 function renderClients(){
  const query=$('customer-search').value.toLocaleLowerCase().trim();
  const selected=clients.filter(c=>(c.nombre+' '+c.correo).toLocaleLowerCase().includes(query));
  const rows=selected.map(c=>[c.nombre,c.correo,c.telefono||'—',c.hospedajes,c.con_spa,btn('Ver historial',()=>openClient(c.id))]);
  $('admin-clients').replaceChildren(mkTable(['Nombre','Correo','Teléfono','Hospedajes','Con spa','Detalle'],rows));
 }
 $('customer-search').addEventListener('input',renderClients);
 async function openClient(id){
  try{
   const c=(await api('/api/admin/clientes/'+id)).data;
   const container=$('client-detail');container.replaceChildren();
   const h=node('h3','Historial de '+c.nombre);h.style.marginTop='28px';container.append(h,node('p','Correo: '+c.correo+' · Teléfono: '+(c.telefono||'Sin registrar')));
   const rows=c.reservas.map(r=>[String(r.fechaReserva).slice(0,10),r.suite,r.subplan||'—',r.spa,r.decoracion,money(r.precioTotal),r.estado]);
   container.append(mkTable(['Fecha','Suite','Plan','Spa','Decoración','Precio','Estado'],rows));
  }catch(e){status(e.message);}
 }
 const monday=()=>{const now=new Date();const d=new Date(now.getFullYear(),now.getMonth(),now.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 $('report-start').value=monday();
 function bars(items,labelField,countField){
  const div=node('div');div.className='portal-bars';const max=Math.max(1,...items.map(x=>number(x[countField])));
  for(const entry of items){const row=node('div');row.className='portal-bar';row.append(node('span',entry[labelField]));const track=node('div');track.className='portal-bar-track';const fill=node('span');fill.style.width=(100*number(entry[countField])/max)+'%';track.append(fill);row.append(track,node('strong',entry[countField]));div.append(row);}return div;
 }
 async function loadReport(){
  try{
   const start=$('report-start').value;report=await api('/api/admin/reportes/semana?inicio='+encodeURIComponent(start));
   const container=$('report-result');container.replaceChildren();
   const desc=node('p','Del '+report.inicio+' al '+report.finExclusivo+' (fecha de cierre exclusiva).');desc.className='portal-muted';container.append(desc);
   const grid=node('div');grid.className='portal-grid';for(const [label,value] of [['Reservas confirmadas o completadas',report.resumen.reservas],['Importe estimado',money(report.resumen.ingresos)],['Clientes identificados',report.resumen.clientes]]){const item=node('div');item.className='portal-kpi';item.append(node('strong',value),node('span',label));grid.append(item);}container.append(grid);
   container.append(node('h3','Habitaciones más solicitadas'));
   container.append(report.habitaciones.length?bars(report.habitaciones,'suite','reservas'):node('p','Sin reservas confirmadas en esta semana.'));
   container.append(node('h3','Solicitudes por día de llegada'));
   container.append(bars(report.dias.map(x=>({...x,nombre:['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][x.dia]})),'nombre','reservas'));
   container.append(node('h3','Servicios de spa contratados'));
   container.append(bars(report.serviciosSpa,'spa','reservas'));
  }catch(e){status(e.message);}
 }
 $('generate-report').onclick=loadReport;
 $('print-report').onclick=()=>{if(!report)return status('Genera primero el informe.');window.print();};
 $('export-report').onclick=()=>{
  if(!report)return status('Genera primero el informe.');
  const lines=[['Informe semanal Dapa Glamping'],['Inicio',report.inicio],['Fin (exclusivo)',report.finExclusivo],['Total reservas',report.resumen.reservas],['Importe',report.resumen.ingresos],[],['Habitación','Reservas','Importe'],...report.habitaciones.map(r=>[r.suite,r.reservas,r.ingresos]),[],['Día ISO','Reservas'],...report.dias.map(r=>[r.dia,r.reservas]),[],['Spa','Reservas'],...report.serviciosSpa.map(r=>[r.spa,r.reservas])];
  const csv='\ufeff'+lines.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=node('a');a.href=url;a.download='dapa-reporte-'+report.inicio+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 };
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-tab]').forEach(c=>c.classList.toggle('active',c===b));
  document.querySelectorAll('.portal-section').forEach(s=>s.hidden=s.id!=='tab-'+b.dataset.tab);status('');
 }));
 $('logout').onclick=async()=>{try{await api('/api/auth/logout',{method:'POST'});location.href='/acceso.html';}catch(e){status(e.message)}};
 try{
  const me=await api('/api/auth/me');
  if(!me.user||me.user.rol!=='admin'){location.replace('/acceso.html');return;}
  $('admin-user').textContent=me.user.nombre;
  await Promise.all([loadBookings(),loadClients(),loadRates(),loadReport()]);
 }catch(e){status('No se pudo abrir el panel: '+e.message);}
})();
