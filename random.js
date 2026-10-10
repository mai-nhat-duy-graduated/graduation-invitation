(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const settings = PhotoIdeas.settings();
  const sessionKey = 'photo-admin-session';
  let session, items = [], seen = new Set(), historyKey, generation = 0, busy = false, refreshTimer;
  const authStatus = $('#auth-status'), sourceStatus = $('#source-status'), drawStatus = $('#draw-status');
  async function request(path, options = {}, authenticated = true) {
    const response = await fetch(settings.url + path, {
      ...options, signal: AbortSignal.timeout(30000),
      headers: { apikey: settings.key, ...(authenticated && session ? { Authorization: `Bearer ${session.access_token}` } : {}), ...options.headers },
    });
    if (!response.ok) {
      const error = new Error('Yêu cầu không thành công'); error.status = response.status; throw error;
    }
    return response.status === 204 ? null : response.json();
  }
  function saveSession(value) {
    session = value;
    try { sessionStorage.setItem(sessionKey, JSON.stringify(value)); } catch { /* memory-only session */ }
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshSession().catch(() => lock('Phiên đăng nhập hết hạn. Bạn đăng nhập lại nhé.')), Math.max(1000, (value.expires_in - 60) * 1000));
  }
  async function refreshSession() {
    const version = generation;
    const value = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) }, false);
    if (version === generation) saveSession(value);
  }
  function lock(message = '') {
    generation++; clearTimeout(refreshTimer); session = null; items = []; seen = new Set(); busy = false;
    try { sessionStorage.removeItem(sessionKey); } catch { /* unavailable storage */ }
    $('#password').value = ''; $('#login-form').hidden = false; $('#random-panel').hidden = true; $('#logout').hidden = true;
    $('#result').hidden = true; $('#result-image').removeAttribute('src'); authStatus.textContent = message;
    $('#login-button').disabled = false;
  }
  function updateCount() {
    const count = PhotoIdeas.remaining(items, seen).length;
    $('#remaining').textContent = `${count} / ${items.length} kiểu còn lại`;
    $('#draw').disabled = busy || count === 0;
  }
  function storeHistory() {
    try { localStorage.setItem(historyKey, JSON.stringify([...seen])); }
    catch { drawStatus.textContent = 'Trình duyệt không lưu được lịch sử; lượt này chỉ được giữ khi trang đang mở.'; }
  }
  async function enter() {
    const allowed = await request('/rest/v1/rpc/is_photo_admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!allowed) { lock('Tài khoản này không có quyền xem ảnh.'); return; }
    historyKey = `photo-draw:${settings.url}:${session.user.id}`;
    try {
      const saved = JSON.parse(localStorage.getItem(historyKey) || '[]');
      seen = new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []);
    } catch { seen = new Set(); }
    $('#login-form').hidden = true; $('#random-panel').hidden = false; $('#logout').hidden = false; authStatus.textContent = '';
    await loadSources();
  }
  async function loadSources() {
    const version = generation;
    busy = true; updateCount(); $('#reload').disabled = true; $('#reset').disabled = true; sourceStatus.textContent = 'Đang tải hai nguồn ảnh…';
    const results = await Promise.allSettled([
      fetch('memes/manifest.json', { cache: 'no-cache', signal: AbortSignal.timeout(30000) }).then(response => { if (!response.ok) throw new Error(); return response.json(); }),
      (async () => {
        const rows = [];
        for (let offset = 0; ; offset += 1000) {
          const page = await request(`/rest/v1/photo_ideas?select=id,name,description,image_path&order=created_at.asc,id.asc&limit=1000&offset=${offset}`);
          rows.push(...page); if (page.length < 1000) return rows;
        }
      })(),
    ]);
    if (version !== generation) return;
    const [samples, guests] = results;
    if (guests.status === 'rejected' && guests.reason.status === 401) { lock('Phiên đăng nhập hết hạn. Bạn đăng nhập lại nhé.'); return; }
    const warnings = [];
    items = [];
    if (samples.status === 'fulfilled' && Array.isArray(samples.value)) items.push(...samples.value.map(item => ({ ...item, source: 'sample' })));
    else warnings.push('Chưa tải được ảnh mẫu.');
    if (guests.status === 'fulfilled') items.push(...guests.value.map(row => ({ id: `guest:${row.id}`, name: row.name, description: row.description, path: row.image_path, source: 'guest' })));
    else warnings.push('Chưa tải được nguồn bạn bè. Bạn vẫn có thể random ảnh mẫu.');
    items = [...new Map(items.map(item => [item.id, item])).values()];
    sourceStatus.textContent = warnings.join(' ') || `Đã tải ${items.filter(i => i.source === 'sample').length} ảnh mẫu và ${items.filter(i => i.source === 'guest').length} ảnh bạn bè.`;
    busy = false; $('#reload').disabled = false; $('#reset').disabled = false; updateCount();
  }
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault(); if (!settings || $('#login-button').disabled) return;
    $('#login-button').disabled = true; authStatus.textContent = 'Đang đăng nhập…';
    try {
      saveSession(await request('/auth/v1/token?grant_type=password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#email').value.trim(), password: $('#password').value }) }, false));
      $('#password').value = ''; await enter();
    } catch { lock('Chưa đăng nhập được. Kiểm tra email, mật khẩu và kết nối mạng.'); }
    finally { $('#login-button').disabled = false; }
  });
  $('#logout').addEventListener('click', () => {
    request('/auth/v1/logout', { method: 'POST' }).catch(() => {});
    lock('Đã đăng xuất trên thiết bị này.');
  });
  $('#reload').addEventListener('click', loadSources);
  $('#reset').addEventListener('click', () => {
    seen.clear(); storeHistory(); $('#result').hidden = true; $('#result-image').removeAttribute('src'); drawStatus.textContent = 'Đã bắt đầu lượt mới.'; updateCount();
  });
  $('#draw').addEventListener('click', async () => {
    if (busy || !session) return;
    const item = PhotoIdeas.draw(items, seen); if (!item) return;
    const version = generation;
    busy = true; updateCount(); $('#reload').disabled = true; $('#reset').disabled = true;
    $('#result').hidden = true; $('#result-image').removeAttribute('src'); drawStatus.textContent = 'Đang mở kiểu chụp…';
    try {
      let url;
      if (item.source === 'guest') {
        const signed = await request(`/storage/v1/object/sign/guest-photo-ideas/${item.path.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 3600 }) });
        url = `${settings.url}/storage/v1${signed.signedURL.startsWith('/') ? '' : '/'}${signed.signedURL}`;
      } else url = new URL(item.url, location.href).href;
      const image = new Image(); image.src = url;
      await image.decode();
      if (version !== generation) return;
      $('#result-image').src = url; $('#result-title').textContent = item.source === 'guest' ? `Ý tưởng của ${item.name}` : 'Ảnh mẫu của Duy';
      $('#result-description').textContent = item.description || ''; $('#result').hidden = false;
      seen.add(item.id); drawStatus.textContent = ''; storeHistory();
      if (!PhotoIdeas.remaining(items, seen).length) drawStatus.textContent += ' Đã hết lượt! Bấm “Bắt đầu lượt mới” để random tiếp.';
    } catch (error) {
      if (version !== generation) return;
      if (error.status === 401) { lock('Phiên đăng nhập hết hạn. Bạn đăng nhập lại nhé.'); return; }
      drawStatus.textContent = 'Chưa mở được ảnh. Kiểu này chưa tính là đã rút; bạn thử lại hoặc tải lại nguồn.';
    } finally {
      if (version === generation) { busy = false; $('#reload').disabled = false; $('#reset').disabled = false; updateCount(); }
    }
  });
  if (!settings) { $('#login-button').disabled = true; authStatus.textContent = 'Chưa cấu hình Supabase. Xem hướng dẫn thiết lập trong README.'; return; }
  (async () => {
    try {
      session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
      if (session?.refresh_token) { $('#login-button').disabled = true; await refreshSession(); await enter(); }
    } catch { lock('Bạn đăng nhập để xem ảnh nhé.'); }
    finally { $('#login-button').disabled = false; }
  })();
})();
