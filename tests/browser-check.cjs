const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.PREVIEW_URL || 'http://127.0.0.1:4174';
 const originalConfig=fs.readFileSync('config.js','utf8');
 await page.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:originalConfig+";window.INVITATION.supabaseUrl='';window.INVITATION.supabasePublishableKey='';"}));
 await page.goto(base+'/?name=Minh');await page.locator('#photo-ideas').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#photo-name').inputValue(),'Minh');assert.equal(await page.locator('#photo-send').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(),'graduation-photo-form.png')});
 await page.unroute('**/config.js');
 await page.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:originalConfig+";window.INVITATION.supabaseUrl='https://mock.supabase.co';window.INVITATION.supabasePublishableKey='public';"}));
 const json=(r,data,status=200)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 let owner=true, offline=false;
 const manifest=JSON.parse(fs.readFileSync('memes/manifest.json'));
 await page.route('**/memes/manifest.json',r=>json(r,[manifest[0]]));
 const sample=fs.readFileSync(decodeURIComponent(manifest[0].url));
 await page.route('https://mock.supabase.co/**',r=>{
  const url=r.request().url();
  if(url.includes('/auth/v1/token')) return json(r,{access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'duy'}});
  if(url.includes('rpc/is_photo_admin')) return json(r,owner);
  if(url.includes('/rest/v1/photo_ideas')) return json(r,offline?{error:'offline'}:[{id:'friend',name:'<Minh & bạn>',description:'Kiểu chụp vui',image_path:'friend.png'}],offline?503:200);
  if(url.includes('/storage/v1/object/sign/')) {
   if(url.includes('?token=')) return r.fulfill({contentType:'image/png',body:sample});
   return json(r,{signedURL:'/object/sign/guest-photo-ideas/friend.png?token=test'});
  }
  if(url.includes('/auth/v1/logout')) return json(r,{});
  if(url.includes('/functions/v1/submit-photo-idea')) return json(r,{id:'new'},201);
  return json(r,{},404);
 });
 await page.goto(base+'/random.html');await page.locator('#email').fill('duy@example.com');await page.locator('#password').fill('test');await page.locator('#login-button').click();
 await page.waitForFunction(()=>document.querySelector('#remaining').textContent.includes('2 / 2'));
 await page.locator('#draw').click();await page.waitForFunction(()=>document.querySelector('#remaining').textContent.includes('1 / 2'));
 await page.reload();await page.waitForFunction(()=>document.querySelector('#remaining').textContent.includes('1 / 2'));
 await page.locator('#draw').click();await page.waitForFunction(()=>document.querySelector('#remaining').textContent.includes('0 / 2'));
 assert.equal(await page.locator('#draw').isDisabled(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(),'graduation-photo-random.png')});
 await page.locator('#reset').click();assert.match(await page.locator('#remaining').innerText(),/2 \/ 2/);
 offline=true;await page.locator('#reload').click();await page.waitForFunction(()=>document.querySelector('#source-status').textContent.includes('Chưa tải được nguồn bạn bè'));assert.equal(await page.locator('#draw').isDisabled(),false);
 await page.locator('#logout').click();assert.equal(await page.locator('#random-panel').isHidden(),true);assert.equal(await page.evaluate(()=>sessionStorage.getItem('photo-admin-session')),null);
 owner=false;await page.locator('#email').fill('other@example.com');await page.locator('#password').fill('test');await page.locator('#login-button').click();await page.waitForFunction(()=>document.querySelector('#auth-status').textContent.includes('không có quyền'));assert.equal(await page.locator('#random-panel').isHidden(),true);
 await page.goto(base+'/?name=Minh');await page.locator('#photo-file').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:sample});await page.locator('#photo-description').fill('Chụp chung nhé');await page.locator('#photo-send').click();await page.waitForFunction(()=>document.querySelector('#photo-status').textContent.includes('Đã lưu'));
 await page.setViewportSize({width:1440,height:1000});await page.locator('#photo-ideas').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('Browser checks passed: mobile/desktop, submit, private login, signed image, no repeats, restored history, reset, fallback, logout, denied user.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
