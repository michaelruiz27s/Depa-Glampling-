(()=>{
 let mode='login';
 const $=id=>document.getElementById(id);
 const form=$('auth-form');
 const status=$('auth-status');
 const modalPoliticas=$('modal-politicas');
 const qs=new URLSearchParams(location.search);
 if(qs.get('modo')==='registro' || qs.get('mode')==='register' || qs.get('registro')==='1') mode='register';

 function redraw(){
  const registering=mode==='register';
  $('mode-login').classList.toggle('active',mode==='login');
  $('mode-register').classList.toggle('active',mode==='register');
  $('register-fields').hidden=mode!=='register';
  $('register-terms').hidden=mode!=='register';
  for(const field of ['nombre','telefono','politicas']) form.elements[field].disabled=!registering;
  form.elements.nombre.required=registering;
  form.elements.password.autocomplete=mode==='login'?'current-password':'new-password';
  form.elements.password.minLength=registering?8:1;
  form.elements.politicas.required=registering;
  $('password-hint').hidden=!registering;
  form.noValidate=registering;
  form.querySelector('[aria-invalid]')?.removeAttribute('aria-invalid');

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
  form.after(status);
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
  if(user.rol==='admin')return '/admin.html';const requested=qs.get('continuar');
  if(requested&&requested.startsWith('/')&&!requested.startsWith('//')&&!requested.includes('\\')&&!/[\u0000-\u0020]/.test(requested)){
   try{const target=new URL(requested,location.origin);if(target.origin===location.origin&&!['/acceso.html','/admin.html'].includes(target.pathname))return target.pathname+target.search+target.hash;}catch{}
  }
  return isLogin?'/':'/cuenta.html';
 };

 function showFieldError(field,message){
  const input=form.elements[field];
  if(input){
   const fieldContainer=field==='politicas'?$('register-terms'):input.closest('label');
   fieldContainer.after(status);
   input.setAttribute('aria-invalid','true');
   status.textContent=message;
   input.focus();
  }else status.textContent=message;
 }

 // --- Validación en tiempo real: bloquear caracteres no permitidos ---
 // Nombre: solo letras, espacios, acentos, apóstrofes, puntos y guiones (sin números)
 const nombreInput=form.elements.nombre;
 nombreInput.addEventListener('input',()=>{
  nombreInput.value=nombreInput.value.replace(/[0-9]/g,'');
 });
 nombreInput.addEventListener('keydown',e=>{
  if(e.key.length===1 && /[0-9]/.test(e.key)){e.preventDefault();}
 });

 // Teléfono: solo números, +, espacios, guiones y paréntesis (bloquea cualquier letra o símbolo no válido)
 const telefonoInput=form.elements.telefono;
 telefonoInput.addEventListener('input',()=>{
  telefonoInput.value=telefonoInput.value.replace(/[^\d\s+\-()]/g,'');
 });
 telefonoInput.addEventListener('keydown',e=>{
  if(e.key.length===1 && !/[\d\s+\-()]/.test(e.key)){e.preventDefault();}
 });

 form.addEventListener('input',e=>{
  if(e.target.hasAttribute('aria-invalid')){
   e.target.removeAttribute('aria-invalid');
   status.textContent='';
  }
 });

 form.addEventListener('submit',async e=>{
  e.preventDefault();
  status.textContent='';
  const btn=$('auth-submit');
  if(btn.disabled)return;
  form.after(status);
  form.querySelector('[aria-invalid]')?.removeAttribute('aria-invalid');
  const registering=mode==='register';
  let data={correo:form.elements.correo.value.trim(),password:form.elements.password.value};
  if(registering){
   data=globalThis.validateRegistration({
    ...data,
    nombre:form.elements.nombre.value,
    telefono:form.elements.telefono.value,
    politicas:form.elements.politicas.checked
   });
   if(data.field)return showFieldError(data.field,data.message);
   data.politicas=true;
  }
  btn.disabled=true;
  try{
   const res=await fetch(registering?'/api/auth/register':'/api/auth/login',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
   });
   const payload=await res.json();
   if(!res.ok&&registering&&mode==='register'&&payload.field)return showFieldError(payload.field,payload.message);
   if(!res.ok) throw new Error(payload.message||'No se pudo completar la operación.');
   location.assign(destination(payload.user,!registering));
  }catch(err){
   status.textContent=err.message;
  }finally{
   btn.disabled=false;
  }
 });

 redraw();
 fetch('/api/auth/me').then(r=>r.json()).then(d=>{if(d.user) location.replace(destination(d.user));}).catch(()=>{});
})();
