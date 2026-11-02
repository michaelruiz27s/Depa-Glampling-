(()=>{
 const labels={pendiente:['◷','Pendiente'],confirmada:['✓','Confirmada'],ocupada:['●','Ocupada'],completada:['✓','Completada'],cancelada:['×','Cancelada'],limpieza:['◌','Limpieza'],libre:['○','Sin reservas']};
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const badge=state=>{const [icon,label]=labels[state]||['○',state];return el('span',icon+' '+label,'state-badge state-'+state);};
 const images={'Casita Mágica':'habitaciones/casita/portada.webp','Suite Orquídeas':'habitaciones/orquideas/portada.webp','Suite Aves del Paraíso':'habitaciones/aves/portada.webp','Suite Margaritas':'habitaciones/margaritas/portada.webp','Suite Eugenias':'habitaciones/eugenias/portada.webp','Pasadía':'fotos-sin-tarifas/pasadia.webp'};
 const photo=room=>{const img=el('img');img.src='assets/'+(images[room]||'hero-bg.webp');img.alt=room;img.loading='lazy';return img;};
 const date=value=>value?new Date(value).toLocaleString('es-CO',{timeZone:'America/Bogota',dateStyle:'medium',timeStyle:'short'}):'Horario por precisar';
 const loading=(container,active)=>{container.setAttribute('aria-busy',String(active));};
 const pager=(meta,onPage,label='Páginas de resultados')=>{const nav=el('nav',null,'portal-pagination');nav.setAttribute('aria-label',label);const previous=el('button','← Anterior','portal-btn pagination-btn'),next=el('button','Siguiente →','portal-btn pagination-btn');previous.type=next.type='button';previous.disabled=meta.page<=1;next.disabled=meta.page>=meta.pages;previous.onclick=()=>onPage(meta.page-1);next.onclick=()=>onPage(meta.page+1);const position=el('span','Página '+meta.page+' de '+meta.pages+' · '+meta.total+' resultados');position.setAttribute('role','status');nav.append(previous,position,next);return nav;};
 window.DapaUI={el,badge,photo,date,loading,pager};
 document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;button.classList.remove('tap-feedback');void button.offsetWidth;button.classList.add('tap-feedback');});
})();
