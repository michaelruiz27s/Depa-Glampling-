(()=>{
 let mode='login';
 const $=id=>document.getElementById(id);
 const form=$('auth-form');
 const status=$('auth-status');
 const modalPoliticas=$('modal-politicas');
 const qs=new URLSearchParams(location.search);
 if(qs.get('modo')==='registro' || qs.get('mode')==='register' || qs.get('registro')==='1') mode='register';

 function redraw(){
  $('mode-login').classList.toggle('active',mode==='login');
  $('mode-register').classList.toggle('active',mode==='register');
  $('register-fields').hidden=mode!=='register';
  $('register-terms').hidden=mode!=='register';
  form.elements.nombre.required=mode==='register';
  form.elements.password.autocomplete=mode==='login'?'current-password':'new-password';
  form.elements.password.minLength=mode==='register'?10:1;
  if(form.elements.politicas) form.elements.politicas.required=mode==='register';

  if(mode==='register'){
   $('auth-title').textContent='Crear cuenta';
   $('auth-subtitle').textContent='Regístrate para reservar directamente en Dapa Glamping.';
   $('auth-footer-note').textContent='Tus datos están protegidos conforme a las políticas de privacidad.';
   $('identifier-label').childNodes[0].textContent='Correo electrónico';
   $('input-identifier').placeholder='tu@correo.com';
  }else{
   $('auth-title').textContent='Iniciar sesión';
   $('auth-subtitle').textContent='Accede a tus reservas y a tu historial de hospedajes.';
   $('auth-footer-note').textContent='Los clientes pueden crear cuentas. Las cuentas administrativas las habilita únicamente el responsable del sistema.';
   $('identifier-label').childNodes[0].textContent='Correo electrónico';
   $('input-identifier').placeholder='tu@correo.com';
  }

  $('auth-submit').textContent=mode==='login'?'Iniciar sesión':'Crear cuenta';
  status.textContent='';
 }

 $('mode-login').onclick=()=>{mode='login';redraw();};
 $('mode-register').onclick=()=>{mode='register';redraw();};

 function openModal(){modalPoliticas.hidden=false;}
 function closeModal(agree=false){
  modalPoliticas.hidden=true;
  if(agree && $('reg-politicas')) $('reg-politicas').checked=true;
 }
 $('btn-show-politicas')?.addEventListener('click',e=>{e.preventDefault();openModal();});
 $('btn-close-politicas')?.addEventListener('click',e=>{e.preventDefault();closeModal(false);});
 $('btn-accept-modal')?.addEventListener('click',e=>{e.preventDefault();closeModal(true);});
 modalPoliticas?.addEventListener('click',e=>{if(e.target===modalPoliticas) closeModal(false);});
 window.addEventListener('keydown',e=>{if(e.key==='Escape' && !modalPoliticas.hidden) closeModal(false);});

 const destination=(user,isLogin=true)=>{
  const requested=qs.get('continuar');
  if(user.rol==='admin') return '/admin.html';
  if(isLogin) return '/';
  if(requested && requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')) return requested;
  return '/cuenta.html';
 };

 form.addEventListener('submit',async e=>{
  e.preventDefault();
  status.textContent='';
  const btn=$('auth-submit');
  btn.disabled=true;
  const data={correo:form.elements.correo.value.trim(),password:form.elements.password.value};
  if(mode==='register'){
   if(!form.elements.politicas?.checked){
    status.textContent='Debes aceptar las políticas de privacidad para continuar.';
    btn.disabled=false;
    return;
   }
   data.nombre=form.elements.nombre.value.trim();
   data.telefono=form.elements.telefono.value.trim();
   data.politicas=true;
  }
  try{
   const res=await fetch(mode==='register'?'/api/auth/register':'/api/auth/login',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
   });
   const payload=await res.json();
   if(!res.ok) throw new Error(payload.message||'No se pudo completar la operación.');
   location.assign(destination(payload.user,mode==='login'));
  }catch(err){
   status.textContent=err.message;
  }finally{
   btn.disabled=false;
  }
 });

 redraw();
 fetch('/api/auth/me').then(r=>r.json()).then(d=>{if(d.user) location.replace(destination(d.user));}).catch(()=>{});
})();
