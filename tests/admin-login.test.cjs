const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/admin-login/index.ts','utf8').replace(/^import .*;\n/,''));
function harness({status=200,userId='owner'}={}) {
 let run;const calls=[];
 const session={access_token:'user-access',refresh_token:'user-refresh',expires_in:3600};
 vm.runInNewContext(source,{Deno:{env:{get:k=>({ALLOWED_ORIGINS:'https://site.example',PHOTO_ADMIN_UID:'owner',SUPABASE_URL:'https://backend.example',SUPABASE_SERVICE_ROLE_KEY:'server-secret',SUPABASE_ANON_KEY:'public-key'}[k])},serve:f=>run=f},createClient:(url,key)=>({auth:{admin:{getUserById:async uid=>{calls.push(['lookup',uid]);return {data:{user:{email:'owner@example.com'}},error:null};}},signInWithPassword:async credentials=>{calls.push(['password',key,credentials]);return status===200?{data:{session,user:{id:userId}},error:null}:{data:{},error:{status}};}}}),Response,Blob,Uint8Array,JSON});
 return {run,calls};
}
const request=(username='duy',password='test-password')=>new Request('https://backend.example',{method:'POST',headers:{Origin:'https://site.example','Content-Type':'application/json'},body:JSON.stringify({username,password})});
test('username alias uses ordinary password authentication and returns only user session',async()=>{
 const h=harness();const response=await h.run(request(' Duy '));assert.equal(response.status,200);
 const body=await response.json();assert.deepEqual(body,{access_token:'user-access',refresh_token:'user-refresh',expires_in:3600,user:{id:'owner'}});
 assert.equal(h.calls[1][1],'public-key');assert.equal(h.calls[1][2].email,'owner@example.com');assert.equal(h.calls[1][2].password,'test-password');
 assert.equal(response.headers.get('Cache-Control'),'no-store');assert.ok(!JSON.stringify(body).includes('server-secret'));
});
test('unknown username or empty password never contacts Auth',async()=>{
 for(const req of [request('someone'),request('duy','')]){const h=harness();assert.equal((await h.run(req)).status,401);assert.equal(h.calls.length,0);}
});
test('wrong password, wrong authenticated UID and rate limits never return a session',async()=>{
 for(const [options,expected] of [[{status:400},401],[{userId:'other'},401],[{status:429},429]]){const h=harness(options);const r=await h.run(request());assert.equal(r.status,expected);assert.ok(!(await r.json()).access_token);}
});
