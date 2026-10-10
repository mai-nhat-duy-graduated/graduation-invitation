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
  assert.equal(copy({name:'Minh',role:'em'}).heroLink,'MỘT LỜI MỜI DÀNH RIÊNG CHO EM');
  assert.equal(copy({name:'Minh',role:'bạn'}).greeting,'Minh');
  for(const role of ['anh','chị']) {
    assert.equal(copy({name:'Minh',role}).greeting,`${role} Minh`);
    assert.equal(copy({name:'Minh',role}).lead,'Em sắp tốt nghiệp rồi ạ!');
    assert.equal(copy({name:'Minh',role}).heroLink,`MỘT LỜI MỜI DÀNH RIÊNG CHO ${role.toUpperCase()}`);
  }
});
test('friend pronouns support Tao-mày, Tui-chú and Tui-Tên with full-page wording',()=>{
  const taoMay = copy({name:'Lê Duy',role:'bạn',pronoun:'Tao mày'});
  assert.equal(taoMay.self,'Tao');
  assert.equal(taoMay.you,'mày');
  assert.equal(taoMay.greeting,'Lê Duy');
  assert.equal(taoMay.envelopeGreeting,'Lê Duy');
  assert.equal(taoMay.lead,'Tao sắp tốt nghiệp rồi!');
  assert.equal(taoMay.message,'Tao mời mày đến chung vui và chụp vài tấm ảnh kỷ niệm trong ngày tốt nghiệp.');
  assert.equal(taoMay.closing,'Nếu đến được, mày nhắn tao biết hen!');
  assert.equal(taoMay.signoff,'Hẹn gặp mày ngày hôm đó ♡');
  assert.equal(taoMay.photoTitle,'Mày muốn chụp kiểu nào cùng tao?');
  assert.equal(taoMay.heroLink,'MỘT LỜI MỜI DÀNH RIÊNG CHO MÀY');
  assert.equal(taoMay.parking,'Xem video hướng dẫn chỗ gửi xe trước khi đến. Hẹn mày ở trong khuôn viên trường!');
  assert.equal(taoMay.memory,'Thanh xuân có những người bạn, những bài học, và cả những giấc mơ. Cảm ơn mày đã cùng tao đi qua một phần hành trình này.');
  assert.equal(taoMay.photoHint,'Ảnh và lời nhắn được lưu riêng để Duy xem và random khi chụp cùng mày.');

  const tuiChu = copy({name:'Trọng Hiệp',role:'bạn',pronoun:'Tui Chú'});
  assert.equal(tuiChu.self,'Tui');
  assert.equal(tuiChu.you,'chú');
  assert.equal(tuiChu.greeting,'chú Trọng Hiệp');
  assert.equal(tuiChu.envelopeGreeting,'Chú Trọng Hiệp');
  assert.equal(tuiChu.lead,'Tui sắp tốt nghiệp rồi!');
  assert.equal(tuiChu.message,'Tui mời chú đến chung vui và chụp vài tấm ảnh kỷ niệm trong ngày tốt nghiệp.');
  assert.equal(tuiChu.closing,'Nếu đến được, chú nhắn tui biết hen!');
  assert.equal(tuiChu.signoff,'Hẹn gặp chú ngày hôm đó ♡');
  assert.equal(tuiChu.photoTitle,'Chú muốn chụp kiểu nào cùng tui?');
  assert.equal(tuiChu.heroLink,'MỘT LỜI MỜI DÀNH RIÊNG CHO CHÚ');
  assert.equal(tuiChu.parking,'Xem video hướng dẫn chỗ gửi xe trước khi đến. Hẹn chú ở trong khuôn viên trường!');
  assert.equal(tuiChu.memory,'Thanh xuân có những người bạn, những bài học, và cả những giấc mơ. Cảm ơn chú đã cùng tui đi qua một phần hành trình này.');
  assert.equal(tuiChu.photoHint,'Ảnh và lời nhắn được lưu riêng để Duy xem và random khi chụp cùng chú.');

  const tuiTen = copy({name:'Võ Luyện',role:'bạn',pronoun:'Tui - Tên'});
  assert.equal(tuiTen.self,'Tui');
  assert.equal(tuiTen.you,'Luyện');
  assert.equal(tuiTen.greeting,'Võ Luyện');
  assert.equal(tuiTen.envelopeGreeting,'Võ Luyện');
  assert.equal(tuiTen.lead,'Tui sắp tốt nghiệp rồi!');
  assert.equal(tuiTen.message,'Tui mời Luyện đến chung vui và chụp vài tấm ảnh kỷ niệm trong ngày tốt nghiệp.');
  assert.equal(tuiTen.closing,'Nếu đến được, Luyện nhắn tui biết hen!');
  assert.equal(tuiTen.signoff,'Hẹn gặp Luyện ngày hôm đó ♡');
  assert.equal(tuiTen.photoTitle,'Luyện muốn chụp kiểu nào cùng tui?');
  assert.equal(tuiTen.heroLink,'MỘT LỜI MỜI DÀNH RIÊNG CHO LUYỆN');
  assert.equal(tuiTen.parking,'Xem video hướng dẫn chỗ gửi xe trước khi đến. Hẹn Luyện ở trong khuôn viên trường!');
  assert.equal(tuiTen.memory,'Thanh xuân có những người bạn, những bài học, và cả những giấc mơ. Cảm ơn Luyện đã cùng tui đi qua một phần hành trình này.');
  assert.equal(tuiTen.photoHint,'Ảnh và lời nhắn được lưu riêng để Duy xem và random khi chụp cùng Luyện.');
});
test('prepare and renderGuests preserve pronoun metadata for personalized pages', async () => {
  const {prepare,renderGuests} = await import('../scripts/build-guests.mjs');
  const source = 'name\trole\tpronoun\nLê Duy\tBạn\tTao mày\nTrọng Hiệp\tBạn\tTui Chú';
  const guests = prepare(source);
  assert.equal(guests[0].pronoun, 'Tao mày');
  assert.equal(guests[1].pronoun, 'Tui Chú');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'guest-pronouns-'));
  try {
    renderGuests(guests,fs.readFileSync('index.html','utf8'),dir);
    const leDuyPage = fs.readFileSync(path.join(dir,guests[0].suffix,'index.html'),'utf8');
    assert.ok(leDuyPage.includes('"pronoun":"Tao mày"'));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
