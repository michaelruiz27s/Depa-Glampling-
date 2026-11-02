const STATES=['pendiente','confirmada','completada','cancelada'];
function bad(message){const error=new Error(message);error.status=400;throw error;}
function pagination(query){const positive=(value,fallback,max)=>{if(value===undefined)return fallback;if(typeof value!=='string'||!/^\d+$/.test(value))bad('Paginación inválida.');const n=Number(value);if(!Number.isSafeInteger(n)||n<1||n>max)bad('Paginación inválida.');return n;};const page=positive(query.page,1,1000000),pageSize=positive(query.pageSize,30,100);return {page,pageSize,offset:(page-1)*pageSize};}
function metadata(page,total){return {page:page.page,pageSize:page.pageSize,total:Number(total),pages:Math.max(1,Math.ceil(Number(total)/page.pageSize))};}
function validId(value,max='9223372036854775807'){return typeof value==='string'&&/^[1-9]\d{0,18}$/.test(value)&&BigInt(value)<=BigInt(max);}
function search(value){if(value===undefined)return '';if(typeof value!=='string'||value.length>150)bad('La búsqueda admite hasta 150 caracteres.');return value.trim();}
module.exports={pagination,metadata,validId,search,STATES,bad};
