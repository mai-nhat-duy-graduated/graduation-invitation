const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/submit-photo-idea/index.ts','utf8').replace(/^import .*;\n/,''));
function harness({insertError=false, uploadError=false}={}) {
  let handler; const calls=[];
  const bucket={upload:async(path,bytes,options)=>{calls.push(['upload',path,options]);return {error:uploadError};},remove:async(paths)=>{calls.push(['remove',paths]);return {error:null};}};
  vm.runInNewContext(source,{Deno:{env:{get:key=>({ALLOWED_ORIGINS:'https://invitation.example',SUPABASE_URL:'https://backend.example',SUPABASE_SERVICE_ROLE_KEY:'server-secret'}[key])},serve:fn=>{handler=fn;}},createClient:()=>({storage:{from:()=>bucket},from:()=>({insert:async(row)=>{calls.push(['insert',row]);return {error:insertError};}})}),Response,Blob,File,Uint8Array,crypto,console});
  return {run:handler,calls};
}
function submission(bytes=[137,80,78,71,13,10,26,10],type='image/png',name='Minh') {
  const data=new FormData();data.set('name',name);data.set('description','Cùng chụp <3');data.set('file',new Blob([new Uint8Array(bytes)],{type}),'sample.png');
  return new Request('https://backend.example/functions/v1/submit-photo-idea',{method:'POST',headers:{Origin:'https://invitation.example'},body:data});
}
test('backend validates image signatures, name and size before storage',async()=>{
  const h=harness();
  for(const req of [submission([1,2,3]),submission(undefined,'image/svg+xml'),submission(undefined,'image/png',' '),submission(new Array(5242881).fill(0))]) assert.equal((await h.run(req)).status,400);
  assert.equal(h.calls.length,0);
});
test('successful submission stores UUID path and trimmed metadata',async()=>{
  const h=harness();const response=await h.run(submission(undefined,undefined,' Minh '));
  assert.equal(response.status,201);const {id}=await response.json();
  assert.match(id,/^[0-9a-f-]{36}$/);assert.equal(h.calls[0][1],`${id}.png`);assert.equal(h.calls[1][1].name,'Minh');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://invitation.example');
});
test('failed insert removes uploaded object and never acknowledges success',async()=>{
  const h=harness({insertError:true});assert.equal((await h.run(submission())).status,503);
  assert.deepEqual(h.calls.map(c=>c[0]),['upload','insert','remove']);assert.equal(h.calls[2][1][0],h.calls[0][1]);
});
test('failed upload never writes metadata',async()=>{
  const h=harness({uploadError:true});assert.equal((await h.run(submission())).status,503);assert.equal(h.calls.length,1);
});
test('CORS preflight and disallowed origins',async()=>{
  const h=harness();
  assert.equal((await h.run(new Request('https://backend.example',{method:'OPTIONS',headers:{Origin:'https://invitation.example'}}))).status,204);
  assert.equal((await h.run(new Request('https://backend.example',{method:'POST',headers:{Origin:'https://other.example'}}))).status,403);
});
test('deployment requires an actual Auth UID and substitutes it atomically',async()=>{
  const {configureSchema}=await import('../scripts/setup-photo-backend.mjs');
  const schema=fs.readFileSync('supabase/schema.sql','utf8');
  for(const uid of ['mai-nhat-duy-graduated','',"'; drop table public.photo_ideas; --",'00000000-0000-0000-0000-000000000000']) assert.throws(()=>configureSchema(schema,uid));
  const sql=configureSchema(schema,'12345678-1234-1234-1234-123456789abc');
  assert.ok(sql.startsWith('begin;'));assert.ok(sql.endsWith('commit;'));assert.ok(!sql.includes('00000000-0000-0000-0000-000000000000'));
});

test('initial deployment without Auth user keeps the admin allowlist empty', async () => {
  const {configureSchema} = await import('../scripts/setup-photo-backend.mjs');
  const sql = configureSchema(fs.readFileSync('supabase/schema.sql', 'utf8'), undefined);
  assert.ok(!sql.includes('insert into public.photo_admins'));
  assert.ok(sql.includes('enable row level security'));
});
