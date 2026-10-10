const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('../photo-core.js');
const { validate, remaining, draw, settings, MAX_BYTES } = global.PhotoIdeas;
const file = { type: 'image/png', size: 1024 };
test('submission validation: required fields, types, boundaries and trimmed input', () => {
  assert.equal(validate(' Minh ', 'Chụp cùng Duy', file), '');
  assert.equal(validate('a'.repeat(80), 'x'.repeat(500), { type: 'image/webp', size: MAX_BYTES }), '');
  for (const args of [ ['', '', file], ['   ', '', file], ['a'.repeat(81), '', file], ['Minh', 'x'.repeat(501), file], ['Minh', '', null], ['Minh', '', { type: 'image/svg+xml', size: 100 }], ['Minh', '', { type: 'image/jpeg', size: MAX_BYTES + 1 }], ['Minh', '', { type: 'image/jpeg', size: 0 }] ]) assert.ok(validate(...args));
});
test('mixed pool draws every item exactly once and restores history', () => {
  const pool = [{id:'sample:a'}, {id:'guest:b'}, {id:'sample:c'}];
  const seen = new Set();
  for (const rng of [() => 0.99, () => 0, () => 0.5]) {
    const result = draw(pool, seen, rng); assert.ok(result); assert.ok(!seen.has(result.id)); seen.add(result.id);
  }
  assert.equal(draw(pool, seen), null);
  const restored = new Set(JSON.parse(JSON.stringify([...seen])));
  assert.equal(remaining(pool, restored).length, 0);
  assert.deepEqual(remaining([...pool, {id:'guest:new'}], restored), [{id:'guest:new'}]);
  restored.clear(); assert.equal(remaining(pool, restored).length, 3);
});
test('each sample and guest occupies one equally sized selection interval', () => {
  const pool = [{id:'sample:a'}, {id:'guest:b'}, {id:'guest:c'}];
  assert.deepEqual([0.1,0.4,0.9].map(n => draw(pool, new Set(), () => n).id), pool.map(i => i.id));
});
test('configuration rejects missing or non-HTTPS backend', () => {
  global.INVITATION = {}; assert.equal(settings(), null);
  global.INVITATION = {supabaseUrl:'http://example.com',supabasePublishableKey:'public'}; assert.equal(settings(), null);
  global.INVITATION = {supabaseUrl:'https://example.supabase.co/',supabasePublishableKey:'public'};
  assert.deepEqual(settings(), {url:'https://example.supabase.co',key:'public'});
});
test('manifest contains every supported image with encoded relative URL', () => {
  const entries = JSON.parse(fs.readFileSync('memes/manifest.json'));
  const files = fs.readdirSync('memes').filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(entries.length, files.length); assert.equal(new Set(entries.map(i => i.id)).size, files.length);
  for (const entry of entries) assert.ok(fs.existsSync(decodeURIComponent(entry.url)));
});
function submissionHarness(fetcher) {
  const elements = {};
  for (const id of ['photo-form','photo-file','photo-description','photo-status','photo-send','photo-preview','photo-preview-wrap','photo-change']) {
    elements[id] = {value:'',files:[],disabled:false,hidden:true,textContent:'',events:{},addEventListener(event,fn){this.events[event]=fn;},removeAttribute(){},querySelectorAll(){return [elements['photo-file'],elements['photo-description'],elements['photo-send']];}};
  }
  const context = { document:{querySelector:selector=>elements[selector.slice(1)]},location:{search:'?name=Minh'},URLSearchParams,URL,FormData,AbortSignal,PhotoIdeas:{...global.PhotoIdeas, settings:()=>({url:'https://backend.example',key:'public'})},fetch:fetcher };
  vm.runInNewContext(fs.readFileSync('photo-submit.js','utf8'),context);
  elements['photo-file'].files = [new Blob(['photo'],{type:'image/png'})];
  elements['photo-description'].value = 'Kiểu vui';
  return elements;
}
test('submission prevents concurrent requests and clears image only after success', async () => {
  let finish, calls=0;
  const elements = submissionHarness((url, options) => {assert.equal(options.body.get('name'),'Minh'); calls++; return new Promise(resolve=>{finish=resolve;});});
  const submit=elements['photo-form'].events.submit;
  const first=submit({preventDefault(){}});
  await submit({preventDefault(){}});
  assert.equal(calls,1); assert.equal(elements['photo-send'].disabled,true);
  finish({ok:true,json:async()=>({id:'stored'})}); await first;
  assert.equal(elements['photo-file'].value,''); assert.equal(elements['photo-description'].value,'');
  assert.match(elements['photo-status'].textContent,/Đã lưu/); assert.equal(elements['photo-send'].disabled,false);
});
test('submission retains content and unlocks controls after backend failure', async () => {
  const elements = submissionHarness(async()=>({ok:false,json:async()=>({error:'Lỗi lưu ảnh'})}));
  await elements['photo-form'].events.submit({preventDefault(){}});
  assert.equal(elements['photo-description'].value,'Kiểu vui'); assert.equal(elements['photo-file'].files.length,1);
  assert.equal(elements['photo-status'].textContent,'Lỗi lưu ảnh'); assert.equal(elements['photo-send'].disabled,false);
});
