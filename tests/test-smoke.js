/* Pruebas sin PostgreSQL: detectan errores de arranque y rutas públicas. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../src/app');
async function main(){
 const server=await new Promise(resolve=>{const s=app.listen(0,()=>resolve(s));});
 const base='http://127.0.0.1:'+server.address().port;
 let count=0;
 try{
  async function check(url,options,expected){
   const res=await fetch(base+url,options);
   assert.equal(res.status,expected,`Error en ${url}: HTTP ${res.status}, esperado ${expected}`);
   count++;
   return res;
  }
  assert.equal((await(await check('/api/health',undefined,200)).json()).status,'UP');
  assert.equal((await(await check('/api/auth/me',undefined,200)).json()).user,null);
  assert.equal((await(await check('/api/auth/logout',{method:'POST'},200)).json()).ok,true);
  await check('/api/admin/tarifas',undefined,401);
  await check('/api/bookings/mine',undefined,401);
  const validRegistration={nombre:'María José O’Neill',correo:'prueba@example.org',telefono:'+57 (300) 123-4567',password:'123456789ABC',politicas:true};
  for(const [field,value] of [
   ['nombre','Cliente123'],['nombre',{}],['telefono','abc1234567'],['telefono','123456'],
   ['correo','prueba..dapa@example.org'],['correo','prueba@example'],['correo','prueba@-dapa.org'],
   ['password','1234567'],['password','        '],['politicas',false],['politicas','true']
  ]){
   const response=await check('/api/auth/register',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...validRegistration,[field]:value})
   },400);
   assert.equal((await response.json()).field,field);
  }
  const validateRegistration=require('../public/registration-validation');
  const {politicas,...normalized}=validRegistration;
  assert.deepEqual(validateRegistration({...validRegistration,correo:' PRUEBA@EXAMPLE.ORG '}),normalized);
  assert.deepEqual(validateRegistration({...validRegistration,telefono:''}),{...normalized,telefono:''});
  assert.deepEqual(validateRegistration({...validRegistration,password:'abceluna'}),{...normalized,password:'abceluna'});
  for(const telefono of ['+505 8888 1234','+50588881234','+1 (202) 555-0123','+34 612 34 56 78']){
   assert.deepEqual(validateRegistration({...validRegistration,telefono}),{...normalized,telefono});
  }
  await check('/acceso.html',undefined,200);
  await check('/registration-validation.js',undefined,200);
  await check('/menu-carousel.js',undefined,200);
  for(const name of ['01_hamburguesa','02_cazuela_con_arroz','03_sopa','04_platillo_al_horno','05_panini_con_papas','06_waffles','07_desayuno_con_huevos']){
   assert(fs.existsSync(path.join(__dirname,'../public/assets/menu',name+'.webp')));
   count++;
  }
  const source=fs.readFileSync(path.join(__dirname,'../src/routes/auth.routes.js'),'utf8');
  assert(!source.includes('signedCookies'), 'No usar cookie firmada sin cookie-parser');
  assert(!source.includes('authOptional'), 'La función authOptional no existe');
  console.log(`✓ ${count} comprobaciones de arranque, acceso y carrusel`);
 }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
