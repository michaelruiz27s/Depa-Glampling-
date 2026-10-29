const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../src/app');
const folder=path.resolve(__dirname,'../public');
const brochures=[
 ['Casita Mágica','plan-relax-spa.webp'],
 ['Suite Orquídeas','suite-orquideas.webp'],
 ['Suite Aves del Paraíso','suite_aves_del_paraiso.webp'],
 ['Suite Margaritas','suite_margaritas.webp'],
 ['Suite Eugenias','suite_eugenias.webp'],
 ['Pasadía','pasadia.webp']
];
(async()=>{
 const server=await new Promise(resolve=>{const s=app.listen(0,()=>resolve(s));});
 let checks=0;
 try{
  const host=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(host+'/');
  assert.equal(page.status,200);
  assert.match(page.headers.get('cache-control')||'',/no-store/);
  const html=await page.text();
  assert.match(html,/dapa-version[^>]+folletos-logo-2/);
  checks+=3;
  for(const [name,file] of brochures){
   assert(html.includes(`src="assets/${file}"`),`No se usa el folleto de ${name}`);
   const res=await fetch(`${host}/assets/${file}`);
   assert.equal(res.status,200,`${name} no carga`);
   assert.match(res.headers.get('content-type'),/image\/webp/);
   assert((await res.arrayBuffer()).byteLength>20000);
   checks+=4;
  }
  assert(html.includes('src="assets/logo.png?v=folletos-logo-2"'));
  const logo=await fetch(host+'/assets/logo.png?v=folletos-logo-2');
  assert.equal(logo.status,200);
  assert.match(logo.headers.get('content-type'),/image\/png/);
  assert((await logo.arrayBuffer()).byteLength>1000);
  checks+=4;
  for(const file of ['style.css','script.js']){
   const res=await fetch(host+'/'+file+'?v=folletos-logo-2');
   assert.equal(res.status,200);
   assert.match(res.headers.get('cache-control')||'',/no-store/);
   checks+=2;
  }
  const raw=fs.readFileSync(path.join(folder,'index.html'),'utf8');
  assert(!raw.includes('src="assets/logo.webp"'));
  checks++;
  console.log(`✓ ${checks} verificaciones de folletos, logo, servidor y caché correctas`);
 }finally{await new Promise(done=>server.close(done));}
})().catch(err=>{console.error(err);process.exitCode=1;});
