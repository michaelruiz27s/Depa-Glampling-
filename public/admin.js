(async()=>{
 const $=id=>document.getElementById(id),money=n=>Number(n).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}),number=n=>Number(n)||0;
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e;};
 const status=msg=>{$('admin-status').textContent=msg?(/actualizad|registrad|guardad/i.test(msg)?'✓ ':'')+msg:'';};
 const badge=window.DapaUI.badge;const fmt=window.DapaUI.date;
 const api=async(url,opts)=>{const response=await fetch(url,opts);let data;try{data=await response.json();}catch{throw new Error('Servidor sin respuesta válida.');}if(!response.ok)throw new Error(data.message||'No se pudo completar la operación');return data;};
 const jsonPatch=(url,body)=>api(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const mkTable=(headers,rows)=>{const wrap=node('div');wrap.className='portal-table-wrap';const table=node('table');table.className='portal-table';const head=node('thead'),tr=node('tr');headers.forEach(h=>tr.append(Object.assign(node('th',h),{scope:'col'})));head.append(tr);table.append(head);const tbody=node('tbody');for(const cells of rows){const row=node('tr');for(const value of cells){const td=node('td');td.dataset.label=headers[row.children.length];if(value instanceof Node)td.append(value);else td.textContent=String(value??'');row.append(td);}tbody.append(row);}table.append(tbody);wrap.append(table);return wrap;};
 const btn=(title,fn)=>{const b=node('button',title);b.className='portal-btn';b.type='button';b.onclick=fn;return b;};
 let bookings=[],clients=[],report=null,bookingPage=1,clientPage=1,bookingSequence=0,clientSequence=0;
 const bookingPages=node('div'),clientPages=node('div');$('admin-bookings').after(bookingPages);$('admin-clients').after(clientPages);
 let bookingSearchTimer,clientSearchTimer;
 const refreshBookings=()=>{bookingPage=1;clearTimeout(bookingSearchTimer);bookingSearchTimer=setTimeout(()=>loadBookings().catch(e=>status(e.message)),250);};
 function detailButton(r){return btn('Ver #'+r.id,()=>{
  const d=document.createElement('dialog');d.className='portal-card reservation-drawer';d.setAttribute('aria-labelledby','reservation-detail-title');
  const title=node('h2','Solicitud #'+r.id);title.id='reservation-detail-title';const close=btn('Cerrar ×',()=>d.close());close.classList.add('drawer-close');d.append(close,node('p','DETALLE DE LA RESERVA'),title,badge(r.ingreso_registrado&&r.estado==='confirmada'?'ocupada':r.estado));
  for(const [label,value] of [['Cliente',r.clienteNombre],['Teléfono',r.telefono||'Sin registrar'],['Servicio',r.suite],['Habitación',r.habitacion||r.suite],['Entrada',r.inicio?new Date(r.inicio).toLocaleString('es-CO',{timeZone:'America/Bogota'}):'Sin horario registrado'],['Salida',r.fin?new Date(r.fin).toLocaleString('es-CO',{timeZone:'America/Bogota'}):'Sin horario registrado'],['Fecha',String(r.fechaReserva).slice(0,10)],['Plan',r.subplan||'Hospedaje'],['Huéspedes',r.numPersonas],['Spa',r.spa],['Decoración',r.decoracion],['Alojamiento',r.precio_alojamiento==null?'Sin desglose histórico':money(r.precio_alojamiento)],['Decoración COP',r.precio_decoracion==null?'Sin desglose histórico':money(r.precio_decoracion)],['Spa COP',r.precio_spa==null?'Sin desglose histórico':money(r.precio_spa)],['Total',money(r.precioTotal)],['Estado',r.ingreso_registrado&&r.estado==='confirmada'?'Ocupada':r.estado],['Observaciones',r.comentarios||'Sin observaciones']])d.append(node('p',label+': '+value));
  d.append(btn('Cerrar',()=>d.close()));d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();
 });}
 const filters=node('div');filters.className='portal-row';
 for(const [id,text,type] of [['booking-search','Buscar número, cliente o habitación','search'],['booking-day','Fecha de reserva','date']]){const l=node('label',text),i=node('input');i.id=id;i.type=type;i.className='portal-input';l.htmlFor=id;filters.append(l,i);i.oninput=refreshBookings;}
 const stateLabel=node('label','Estado'),stateFilter=node('select');stateLabel.htmlFor='booking-state';stateFilter.id='booking-state';stateFilter.className='portal-input';for(const value of ['','pendiente','confirmada','completada','cancelada']){const o=node('option',value||'Todos');o.value=value;stateFilter.append(o);}stateFilter.onchange=refreshBookings;filters.append(stateLabel,stateFilter);$('admin-bookings').before(filters,node('p','Busca en todas las reservas y navega por sus páginas. Los indicadores resumen todos los registros.'));
 const dateControl=document.createElement('input');dateControl.type='date';dateControl.className='portal-input';dateControl.id='availability-date';dateControl.value=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const availability=node('section');availability.className='portal-card';const label=node('label','Consultar disponibilidad por fecha ');label.htmlFor=dateControl.id;const availabilityRows=node('div');availability.append(node('h2','Disponibilidad de habitaciones'),label,dateControl,node('p','Pendiente y confirmada indican reservas, no ingreso del huésped. Se muestran horarios y una hora de limpieza. Pasadía bloquea la habitación física elegida. Las solicitudes pendientes no vencen automáticamente.'),availabilityRows);$('tab-calendario').append(availability);dateControl.onchange=()=>renderAvailability().catch(e=>status(e.message));
 const calendarMode=node('select');calendarMode.className='portal-input';calendarMode.setAttribute('aria-label','Vista del calendario');for(const [value,text] of [['dia','Un día'],['semana','Una semana']]){const option=node('option',text);option.value=value;calendarMode.append(option);}dateControl.after(calendarMode);calendarMode.onchange=()=>renderAvailability().catch(e=>status(e.message));
 const legend=node('div');legend.className='calendar-legend';for(const state of ['pendiente','confirmada','ocupada','limpieza'])legend.append(badge(state));availabilityRows.before(legend);
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const roomNames=['Casita Mágica','Suite Orquídeas','Suite Aves del Paraíso','Suite Margaritas','Suite Eugenias'];
 function roomReservations(rows,name){return rows.filter(r=>r.habitacion===name||(!r.habitacion&&(r.suite===name||(r.suite==='Pasadía'&&['Casita Mágica','Suite Aves del Paraíso','Suite Margaritas'].includes(name)))));}
 function roomCards(rows){const grid=node('div');grid.className='room-grid';for(const name of roomNames){const rs=roomReservations(rows,name);const occupied=rs.find(r=>r.ingreso_registrado&&r.estado==='confirmada');const cleaning=rs.find(r=>r.estado==='completada'&&Date.now()>=+new Date(r.fin_efectivo)&&Date.now()<+new Date(r.fin_efectivo)+3600000);const next=rs.find(r=>r.estado!=='completada'&&+new Date(r.fin_efectivo)>Date.now())||rs[0];const state=occupied?'ocupada':cleaning?'limpieza':next?next.estado:'libre';const card=node('article');card.className='room-card';const top=node('div');top.className='section-heading';top.append(node('span','ALOJAMIENTO'),badge(state));card.append(top,node('h3',name));if(!rs.length)card.append(node('p','Sin reservas registradas para esta fecha.'));for(const r of rs){const slot=node('div');slot.className='room-slot';slot.append(badge(r.ingreso_registrado&&r.estado==='confirmada'?'ocupada':r.estado),node('p',fmt(r.inicio_efectivo)+' → '+fmt(r.fin_efectivo)),node('small','Limpieza hasta '+fmt(new Date(+new Date(r.fin_efectivo)+3600000))+(r.inicio?'':' · Horario por precisar')),detailButton(r));card.append(slot);}grid.append(card);}return grid;}
 const holidayLabel=node('p');holidayLabel.className='portal-info';dateControl.after(holidayLabel);
 let availabilitySequence=0;
 async function renderAvailability(){
  const seq=++availabilitySequence,date=dateControl.value;if(!date)return;const holiday=window.DapaCalendar.holidayName(date);holidayLabel.hidden=!holiday;holidayLabel.textContent=holiday?'Festivo en Colombia: '+holiday:'';availabilityRows.setAttribute('aria-busy','true');
  try{
   const days=Array.from({length:calendarMode.value==='semana'?7:1},(_,i)=>new Date(Date.parse(date+'T12:00:00Z')+i*86400000).toISOString().slice(0,10));
   const results=await Promise.all(days.map(day=>api('/api/admin/disponibilidad?fecha='+encodeURIComponent(day))));if(seq!==availabilitySequence)return;
   if(calendarMode.value==='semana'){
    const grid=node('div');grid.className='week-calendar';const corner=node('strong','Habitación');grid.append(corner);for(const day of days)grid.append(node('strong',new Date(day+'T12:00:00Z').toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'})+(window.DapaCalendar.isHoliday(day)?' · Festivo':'')));
    for(const name of roomNames){grid.append(node('strong',name));results.forEach((result,i)=>{const cell=node('div');cell.className='calendar-cell';const rs=roomReservations(result.data,name);if(!rs.length)cell.append(node('span','Sin reservas'));rs.forEach(r=>{const button=detailButton(r);button.prepend(badge(r.ingreso_registrado&&r.estado==='confirmada'?'ocupada':r.estado));cell.append(button,node('small',fmt(r.inicio_efectivo)+' → '+fmt(r.fin_efectivo)),node('small','Limpieza hasta '+fmt(new Date(+new Date(r.fin_efectivo)+3600000))));});grid.append(cell);});}const wrap=node('div');wrap.className='calendar-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Calendario semanal. Desplaza horizontalmente para consultar los días.');wrap.append(grid);availabilityRows.replaceChildren(wrap);
   }else availabilityRows.replaceChildren(roomCards(results[0].data));
   if(date===today()){$('today-rooms').replaceChildren(roomCards(results[0].data));$('today-rooms').setAttribute('aria-busy','false');}
  }finally{if(seq===availabilitySequence)availabilityRows.setAttribute('aria-busy','false');}
 }

 async function loadSummary(){const values=(await api('/api/admin/resumen')).data;
  const entries=[['Solicitudes pendientes',values.pendientes],['Hospedajes completados',values.completadas],['Clientes registrados',values.clientes],['Importe confirmado y completado',money(values.importe_confirmado)]];
  $('dashboard-kpis').replaceChildren(...entries.map(([label,value])=>{const div=node('div');div.className='portal-kpi';div.append(node('strong',value),node('span',label));return div;}));
 }
 async function loadBookings(){
  const seq=++bookingSequence;$('admin-bookings').setAttribute('aria-busy','true');
  try{const params=new URLSearchParams({page:bookingPage,pageSize:30,q:$('booking-search').value,estado:$('booking-state').value,fecha:$('booking-day').value});
   const result=await api('/api/admin/reservas?'+params);if(seq!==bookingSequence)return;
   if(result.pagination.page>result.pagination.pages){bookingPage=result.pagination.pages;return loadBookings();}
   bookings=result.data;renderBookings();bookingPages.replaceChildren(window.DapaUI.pager(result.pagination,value=>{bookingPage=value;loadBookings().catch(e=>status(e.message));},'Páginas de reservas'));
   await Promise.all([loadSummary(),renderAvailability()]);
   if(dateControl.value!==today()){const result=await api('/api/admin/disponibilidad?fecha='+encodeURIComponent(today()));$('today-rooms').replaceChildren(roomCards(result.data));$('today-rooms').setAttribute('aria-busy','false');}
  }finally{if(seq===bookingSequence)$('admin-bookings').setAttribute('aria-busy','false');}
 }
 function renderBookings(){
  const rows=bookings.map(r=>{
   const select=node('select');select.setAttribute('aria-label','Estado reserva #'+r.id);
   for(const state of [...new Set([r.estado,...({pendiente:['confirmada','cancelada'],confirmada:['completada','cancelada']}[r.estado]||[])])]){const option=node('option',state);option.value=state;option.selected=state===r.estado;select.append(option);}
   select.addEventListener('change',async()=>{const desired=select.value;select.disabled=true;try{await jsonPatch('/api/admin/reservas/'+r.id+'/estado',{estado:desired});status('Estado actualizado: reserva #'+r.id);await Promise.all([loadBookings(),loadClients()]);}catch(e){select.value=r.estado;status(e.message);}finally{select.disabled=false;}});
   const actions=node('div');actions.append(select);
   if(r.estado==='confirmada'&&!r.ingreso_registrado){const enter=btn('Registrar ingreso',async()=>{enter.disabled=true;try{await api('/api/admin/reservas/'+r.id+'/ingreso',{method:'POST'});status('Ingreso registrado. Habitación ocupada.');await loadBookings();}catch(e){status(e.message);}finally{enter.disabled=false;}});actions.append(enter);}
   if(r.ingreso_registrado&&r.estado==='confirmada')actions.append(node('strong','Ocupada'));
   return [detailButton(r),r.clienteNombre,r.correo||'Sin cuenta vinculada',String(r.fechaReserva).slice(0,10),r.suite,r.spa,r.decoracion,money(r.precioTotal),actions];
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
 async function loadClients(){const seq=++clientSequence;$('admin-clients').setAttribute('aria-busy','true');try{
  const result=await api('/api/admin/clientes?'+new URLSearchParams({page:clientPage,pageSize:30,q:$('customer-search').value}));if(seq!==clientSequence)return;
  if(result.pagination.page>result.pagination.pages){clientPage=result.pagination.pages;return loadClients();}
  clients=result.data;
  const rows=clients.map(c=>[c.nombre,c.correo,c.telefono||'—',c.hospedajes,c.con_spa,btn('Ver historial',()=>openClient(c.id))]);
  $('admin-clients').replaceChildren(mkTable(['Nombre','Correo','Teléfono','Hospedajes','Con spa','Detalle'],rows));
  clientPages.replaceChildren(window.DapaUI.pager(result.pagination,value=>{clientPage=value;loadClients().catch(e=>status(e.message));},'Páginas de clientes'));
 }finally{if(seq===clientSequence)$('admin-clients').setAttribute('aria-busy','false');}}
 $('customer-search').addEventListener('input',()=>{clientPage=1;clearTimeout(clientSearchTimer);clientSearchTimer=setTimeout(()=>loadClients().catch(e=>status(e.message)),250);});
 let clientDetailSequence=0;
 async function openClient(id,page=1){const seq=++clientDetailSequence;
  try{const result=await api('/api/admin/clientes/'+id+'?'+new URLSearchParams({page,pageSize:30}));if(seq!==clientDetailSequence)return;const c=result.data;
   const container=$('client-detail');container.replaceChildren();const h=node('h3','Historial de '+c.nombre);h.style.marginTop='28px';container.append(h,node('p','Correo: '+c.correo+' · Teléfono: '+(c.telefono||'Sin registrar')));
   container.append(mkTable(['Fecha','Suite','Plan','Spa','Decoración','Precio','Estado'],c.reservas.map(r=>[String(r.fechaReserva).slice(0,10),r.suite,r.subplan||'—',r.spa,r.decoracion,money(r.precioTotal),r.estado])));
   container.append(window.DapaUI.pager(result.pagination,value=>openClient(id,value),'Páginas del historial del cliente'));
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
 const sectionNames={inicio:'Inicio',calendario:'Calendario',reservas:'Reservas',tarifas:'Tarifas',clientes:'Clientes',reportes:'Informes'};
 function openSection(key){document.querySelectorAll('[data-tab]').forEach(button=>{const active=button.dataset.tab===key;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});document.querySelectorAll('.portal-section').forEach(section=>section.hidden=section.id!=='tab-'+key);$('section-title').textContent=sectionNames[key];$('section-title').focus({preventScroll:true});status('');}
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>openSection(button.dataset.tab)));
 $('open-calendar').onclick=()=>openSection('calendario');
 $('logout').onclick=async()=>{try{await api('/api/auth/logout',{method:'POST'});location.href='/acceso.html';}catch(e){status(e.message)}};
 try{
  const me=await api('/api/auth/me');
  if(!me.user||me.user.rol!=='admin'){location.replace('/acceso.html');return;}
  $('admin-user').textContent=me.user.nombre;
  await Promise.all([loadBookings(),loadClients(),loadRates(),loadReport()]);
 }catch(e){status('No se pudo abrir el panel: '+e.message);}
})();
