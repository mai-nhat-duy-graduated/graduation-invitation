const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {copy} = require('../guest-copy.js');
test('guest links use random 128-bit tokens, remain stable and reject invalid roster', async () => {
  const {prepare} = await import('../scripts/build-guests.mjs');
  const source = 'name\trole\nChí Trung\tEm\nVăn Hậu\tAnh';
  const guests = prepare(source);
  assert.match(guests[0].suffix, /^chi_trung_[a-f0-9]{32}$/);
  assert.notEqual(guests[0].token, guests[1].token);
  assert.deepEqual(prepare(source, guests), guests);
  assert.throws(()=>prepare('name\trole\nMinh\tUnknown'));
  assert.throws(()=>prepare('name\trole\nMinh\tBạn\nMinh\tEm'));
});
test('each page contains only its own guest and keeps assets, anchors and privacy metadata', async () => {
  const {prepare,renderGuests} = await import('../scripts/build-guests.mjs');
  const guests = prepare('name\trole\nChí Trung\tEm\nVăn Hậu\tAnh');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'guest-links-'));
  try {
    renderGuests(guests,fs.readFileSync('index.html','utf8'),dir);
    const page = fs.readFileSync(path.join(dir,guests[0].suffix,'index.html'),'utf8');
    assert.ok(page.includes('Chí Trung'));
    assert.ok(!page.includes('Văn Hậu'));
    assert.ok(!page.includes(guests[1].token));
    assert.match(page, /<base href="\.\.\/">/);
    assert.ok(page.includes(`href="${guests[0].suffix}/#details"`));
    assert.match(page, /name="referrer" content="no-referrer"/);
    assert.ok(!page.includes('referrerpolicy="no-referrer-when-downgrade"'));
    assert.ok(!page.includes('referrerpolicy="strict-origin-when-cross-origin"'));
    assert.match(page, /noindex, nofollow, noarchive/);
    assert.throws(()=>renderGuests([{...guests[0],suffix:'../escape'}],page,dir));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('role selects consistent Vietnamese address',()=>{
  assert.equal(copy({name:'Minh',role:'em'}).greeting,'em Minh');
  assert.equal(copy({name:'Minh',role:'em'}).lead,'Anh sắp tốt nghiệp rồi!');
  assert.equal(copy({name:'Minh',role:'bạn'}).greeting,'Minh');
  for(const role of ['anh','chị']) {
    assert.equal(copy({name:'Minh',role}).greeting,`${role} Minh`);
    assert.equal(copy({name:'Minh',role}).lead,'Em sắp tốt nghiệp rồi ạ!');
  }
});
