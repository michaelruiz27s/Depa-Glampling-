document.addEventListener('DOMContentLoaded',async()=>{
 try{
  const response=await fetch('/api/auth/me');
  if(!response.ok)return;
  const {user}=await response.json();
  const link=document.getElementById('account-link');
  if(user){
   if(link){
    link.href=user.rol==='admin'?'/admin.html':'/cuenta.html';
    link.textContent=user.rol==='admin'?'Administración':'Mi cuenta';
   }
   const name=document.getElementById('client-name');
   if(name){name.value=user.nombre;name.readOnly=true;name.title='Nombre registrado en tu cuenta';}
   const info=document.getElementById('booking-user-notice');
   if(info && user.rol==='admin') info.textContent='Sesión administrativa. Gestiona reservas desde Administración; para solicitar una reserva utiliza una cuenta de cliente.';
   else if(info) info.textContent=`Reserva como ${user.nombre}. La solicitud se guardará en tu cuenta y estará pendiente de confirmación.`;
  }else{
   if(link){link.href='/acceso.html?modo=registro&continuar=/#reservas';link.textContent='Ingresar';}
   const info=document.getElementById('booking-user-notice');
   if(info){
    info.textContent='Para reservar, crea tu cuenta o inicia sesión y tu solicitud quedará asociada a tu historial de hospedajes.';
   }
  }
  const raw=sessionStorage.getItem('dapa-reserva-borrador');
  if(raw && user?.rol==='cliente') {
   const saved=JSON.parse(raw);
   const set=(id,v)=>{const el=document.getElementById(id);if(el && v!=null)el.value=v;};
   set('suite-select',saved.suite);
   document.getElementById('suite-select')?.dispatchEvent(new Event('change'));
   set('subplan-select',saved.subplan);set('people-count',saved.people);set('booking-date',saved.date);
   set('booking-hour',saved.horaEntrada);set('physical-room',saved.habitacion);
   set('decor-select',saved.decor);set('spa-select',saved.spa);set('extra-comments',saved.notes);
   document.getElementById('subplan-select')?.dispatchEvent(new Event('change'));
   document.getElementById('booking-date')?.dispatchEvent(new Event('change'));
   document.getElementById('spa-select')?.dispatchEvent(new Event('change'));
   sessionStorage.removeItem('dapa-reserva-borrador');
  }
 }catch(e){console.warn('No se pudo comprobar la sesión del usuario.');}
});

document.addEventListener('DOMContentLoaded',()=>{
 const date=document.getElementById('booking-date'),suite=document.getElementById('suite-select'),hour=document.getElementById('booking-hour'),room=document.getElementById('physical-room'),plan=document.getElementById('subplan-select');if(!date||!suite)return;
 const notice=document.createElement('p');notice.setAttribute('role','status');notice.id='availability-notice';date.insertAdjacentElement('afterend',notice);let sequence=0;
 const schedule=document.getElementById('booking-schedule');
 const fmt=value=>new Date(value).toLocaleString('es-CO',{timeZone:'America/Bogota',dateStyle:'medium',timeStyle:'short'});
 async function refresh(){const seq=++sequence;
  document.getElementById('booking-hour-group').hidden=suite.value!=='Casita Mágica';hour.required=suite.value==='Casita Mágica';
  document.getElementById('physical-room-group').hidden=suite.value!=='Pasadía';room.required=suite.value==='Pasadía';schedule.textContent='';
  if(!date.value||!suite.value||(suite.value==='Casita Mágica'&&!hour.value)||(suite.value==='Pasadía'&&!room.value)){notice.textContent='Completa fecha, alojamiento y horario o habitación para consultar disponibilidad.';return;}
  notice.textContent='Consultando disponibilidad…';
  const query=new URLSearchParams({fecha:date.value,suite:suite.value,subplan:plan.value,horaEntrada:hour.value,habitacion:room.value});
  try{const response=await fetch('/api/availability?'+query);const result=await response.json();if(seq!==sequence)return;if(!response.ok)throw new Error(result.message);
   notice.textContent=result.disponible?'Disponible en el horario elegido. Se verificará nuevamente al guardar.':'No disponible en ese horario. Elige otra hora, fecha o habitación.';
   schedule.textContent=result.habitacion+' · Entrada: '+fmt(result.inicio)+' · Salida: '+fmt(result.fin)+'. Limpieza: una hora después de la salida. La solicitud pendiente conserva el espacio hasta su confirmación o cancelación.';
  }catch(e){if(seq===sequence)notice.textContent=e.message||'No se pudo consultar disponibilidad. Se verificará al guardar.';}
 }
 for(const control of [date,suite,hour,room,plan])control.addEventListener('change',refresh);refresh();
});
