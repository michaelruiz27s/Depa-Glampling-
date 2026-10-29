(async()=>{
 const money=n=>Number(n).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
 const el=(name,text)=>{const e=document.createElement(name);e.textContent=text??'';return e;};
 async function api(url,opts){const r=await fetch(url,opts),body=await r.json();if(!r.ok)throw new Error(body.message);return body;}
 document.getElementById('logout').onclick=async()=>{try{await api('/api/auth/logout',{method:'POST'});location.href='/';}catch(e){alert(e.message)}};
 try{
  const auth=await api('/api/auth/me');if(!auth.user){location.replace('/acceso.html');return;}if(auth.user.rol==='admin'){location.replace('/admin.html');return;}
  document.getElementById('greeting').textContent='Hola, '+auth.user.nombre+'. Este es tu historial personal.';
  const rows=(await api('/api/bookings/mine')).data;
  const completed=rows.filter(x=>x.estado==='completada');
  const stats=[['Solicitudes',rows.length],['Hospedajes realizados',completed.length],['Con spa',completed.filter(x=>x.spa!=='Ninguno').length]];
  document.getElementById('my-stats').replaceChildren(...stats.map(([label,value])=>{const div=el('div');div.className='portal-kpi';div.append(el('strong',value),el('span',label));return div;}));
  if(!rows.length){document.getElementById('my-reservations').replaceChildren(el('p','Todavía no tienes reservas.'));return;}
  const table=el('table');table.className='portal-table';const head=el('thead'),tr=el('tr');['Número','Fecha','Suite','Servicio de spa','Decoración','Precio','Estado'].forEach(t=>tr.append(el('th',t)));head.append(tr);table.append(head);const tbody=el('tbody');
  for(const r of rows){const tr=el('tr');[r.id,String(r.fechaReserva).slice(0,10),r.suite,r.spa,r.decoracion,money(r.precioTotal),r.estado].forEach(t=>tr.append(el('td',t)));tbody.append(tr);}
  table.append(tbody);document.getElementById('my-reservations').replaceChildren(table);
 }catch(e){document.getElementById('client-message').textContent=e.message||'No pudimos cargar tus reservas.';}
})();
