const assert=require('node:assert/strict');const {pagination,validId}=require('../src/domain/listing');const app=require('../src/app');
assert.equal(validId('9223372036854775807'),true);assert.equal(validId('9223372036854775808'),false);assert.equal(validId('0'),false);assert.equal(validId('-1'),false);assert.equal(validId('2147483648','2147483647'),false);
for(const query of [{page:'0'},{page:'-1'},{page:['1','2']},{page:'Infinity'},{pageSize:'101'}])assert.throws(()=>pagination(query),error=>error.status===400);
assert.deepEqual(pagination({page:'3',pageSize:'12'}),{page:3,pageSize:12,offset:24});
(async()=>{const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;try{
 for(const [body,status] of [['{',400],[JSON.stringify({comentarios:'x'.repeat(26000)}),413]]){const response=await fetch(base+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body});assert.equal(response.status,status);assert.match(response.headers.get('content-type'),/application\/json/);assert.equal(typeof(await response.json()).message,'string');}
 const missing=await fetch(base+'/api/no-existe');assert.equal(missing.status,404);assert.match(missing.headers.get('content-type'),/application\/json/);assert.equal(typeof(await missing.json()).message,'string');
 assert.equal((await fetch(base+'/api/health')).status,200);
 console.log('✓ Errores 400/413, API 404 en JSON, servicio disponible, rango de identificadores y paginación válida');
 }finally{await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
