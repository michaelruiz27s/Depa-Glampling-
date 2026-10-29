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
   if(info) info.textContent=`Reserva como ${user.nombre}. La solicitud se guardará en tu cuenta y estará pendiente de confirmación.`;
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
   document.getElementById('booking-date')?.dispatchEvent(new Event('change'));
   set('decor-select',saved.decor);set('spa-select',saved.spa);set('extra-comments',saved.notes);
   document.getElementById('spa-select')?.dispatchEvent(new Event('change'));
   sessionStorage.removeItem('dapa-reserva-borrador');
  }
 }catch(e){console.warn('No se pudo comprobar la sesión del usuario.');}
});
