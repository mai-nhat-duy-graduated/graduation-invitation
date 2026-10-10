const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
  const output = process.env.SCREENSHOT_DIR || os.tmpdir();
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route(/https:\/\/(www\.)?(google\.com\/maps|facebook\.com\/plugins)/, route => route.fulfill({ contentType: 'text/html', body: '<p>Embedded media preview</p>' }));
  await context.addInitScript(() => {
    window.musicPlays = 0;
    HTMLMediaElement.prototype.play = function () { window.musicPlays++; return Promise.resolve(); };
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const closed = async () => {
    assert.equal(await page.locator('#invitation-content').isVisible(), false);
    assert.equal(await page.locator('#music-toggle').isVisible(), false);
    assert.equal(await page.evaluate(() => window.musicPlays), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#letter-open').evaluate(el => el === document.activeElement), true);
    await noOverflow();
  };
  const opened = async () => {
    await page.waitForFunction(() => document.body.dataset.state === 'open');
    assert.equal(await page.locator('#letter-gate').isVisible(), false);
    assert.equal(await page.locator('#invitation-content').evaluate(el => el.inert), false);
    assert.equal(await page.locator('#hero-title').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.equal(await page.evaluate(() => window.musicPlays), 1);
    await noOverflow();
  };
  try {
    await page.goto(base + '/');
    await closed();
    await page.screenshot({ path: path.join(output, 'invitation-mobile-closed.png') });
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('body').getAttribute('data-state'), 'opening');
    assert.equal(await page.locator('#invitation-content').evaluate(el => el.inert), true);
    await page.locator('#letter-open').evaluate(el => el.click());
    await opened();
    await page.screenshot({ path: path.join(output, 'invitation-mobile-open.png') });
    await page.locator('.sky-nav a[href="#details"]').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#details').getBoundingClientRect().top - 30) < 3);
    assert.equal(await page.locator('#event-time').innerText(), '10:30 · Giờ bắt đầu');
    await page.reload();
    await closed();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(output, 'invitation-desktop-closed.png') });
    await page.locator('#letter-open').click();
    await opened();
    await page.screenshot({ path: path.join(output, 'invitation-desktop-open.png') });
    await page.locator('#invitation').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.glass-letter').classList.contains('visible'));
    await page.screenshot({ path: path.join(output, 'invitation-desktop-letter.png') });
    await noOverflow();

    // Exercise actual generated guest markup, including its base URL and anchor rewriting.
    const { prepare, renderGuests } = await import('../scripts/build-guests.mjs');
    const guestName = 'Nguyễn Hoàng Minh Anh và những người bạn thân thương cùng chung một hành trình';
    const guests = prepare(`name\trole\n${guestName}\tChị`);
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'invitation-browser-'));
    let html;
    try {
      renderGuests(guests, fs.readFileSync('index.html', 'utf8'), fixture);
      html = fs.readFileSync(path.join(fixture, guests[0].suffix, 'index.html'), 'utf8');
    } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
    const guestUrl = `${base}/${guests[0].suffix}/`;
    await page.route(guestUrl, route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(guestUrl);
    assert.match(await page.locator('.envelope-address').innerText(), /chị Nguyễn/i);
    const nameBox = await page.locator('.envelope-address').boundingBox();
    const sealBox = await page.locator('.envelope-seal').boundingBox();
    assert.ok(nameBox.y + nameBox.height < sealBox.y, 'Long recipient name stays above the seal');
    await page.locator('#letter-open').click();
    await page.waitForFunction(() => document.body.dataset.state === 'open', { timeout: 500 });
    await opened();
    assert.equal(await page.locator('.letter-lead').innerText(), 'Em sắp tốt nghiệp rồi ạ!');
    assert.equal(await page.locator('.sky-nav a').nth(1).getAttribute('href'), `${guests[0].suffix}/#details`);
    await page.locator('.sky-nav a').nth(1).click();
    await page.waitForFunction(() => location.hash === '#details');
    assert.ok(page.url().startsWith(guestUrl));
    await noOverflow();

    await page.route('**/assets/os-x-mountain-lion-3840x2160-24072.jpg', route => route.abort());
    await page.goto(base + '/');
    await page.locator('#letter-open').click();
    await opened();
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(24, 61, 96)');

    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const fallback = await noJs.newPage();
    await fallback.goto(base + '/', { waitUntil: 'domcontentloaded' });
    assert.equal(await fallback.locator('#letter-gate').isVisible(), false);
    assert.equal(await fallback.locator('#invitation-content').isVisible(), true);
    assert.match(await fallback.locator('#personal-message').innerText(), /Mình mời bạn/);
    await noJs.close();
    assert.deepEqual(errors, []);
    console.log('Invitation browser checks passed: sealed gate, keyboard, single opening, music gesture, scroll navigation, reload, desktop/mobile, long personalized name, generated links, reduced motion, failed background, no JavaScript.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
