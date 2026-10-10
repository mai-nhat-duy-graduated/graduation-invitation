(() => {
  'use strict';
  const form = document.querySelector('#photo-form');
  const name = document.querySelector('#photo-name');
  const file = document.querySelector('#photo-file');
  const description = document.querySelector('#photo-description');
  const status = document.querySelector('#photo-status');
  const send = document.querySelector('#photo-send');
  const preview = document.querySelector('#photo-preview');
  const wrap = document.querySelector('#photo-preview-wrap');
  const change = document.querySelector('#photo-change');
  const settings = PhotoIdeas.settings();
  let busy = false, previewUrl;
  name.value = new URLSearchParams(location.search).get('name')?.trim().slice(0, 80) || '';
  if (!settings) {
    send.disabled = true;
    status.textContent = 'Chỗ gửi ảnh chưa sẵn sàng. Bạn nhắn ảnh trực tiếp cho Duy nhé.';
  }
  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null; preview.removeAttribute('src'); wrap.hidden = true;
  }
  file.addEventListener('change', () => {
    clearPreview();
    const image = file.files[0];
    if (!image) return;
    const error = PhotoIdeas.validate(name.value || 'Bạn', '', image);
    if (error) { status.textContent = error; file.value = ''; return; }
    previewUrl = URL.createObjectURL(image); preview.src = previewUrl; wrap.hidden = false;
    status.textContent = settings ? '' : 'Chỗ gửi ảnh chưa sẵn sàng. Bạn nhắn ảnh trực tiếp cho Duy nhé.';
  });
  preview.addEventListener('error', () => { clearPreview(); file.value = ''; status.textContent = 'Ảnh không mở được. Bạn chọn ảnh khác nhé.'; });
  change.addEventListener('click', () => file.click());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !settings) return;
    const error = PhotoIdeas.validate(name.value, description.value, file.files[0]);
    if (error) { status.textContent = error; return; }
    const data = new FormData();
    data.set('name', name.value.trim()); data.set('description', description.value.trim()); data.set('file', file.files[0]);
    busy = true;
    const controls = [...form.querySelectorAll('input, textarea, button')];
    controls.forEach(control => { control.disabled = true; });
    send.textContent = 'Đang gửi…'; status.textContent = 'Đang lưu ảnh của bạn…';
    try {
      const response = await fetch(`${settings.url}/functions/v1/submit-photo-idea`, {
        method: 'POST', headers: { apikey: settings.key }, body: data, signal: AbortSignal.timeout(60000),
      });
      const result = await response.json();
      if (!response.ok || !result.id) throw new Error(result.error || 'Chưa gửi được ảnh. Bạn thử lại nhé.');
      file.value = ''; description.value = ''; clearPreview();
      status.textContent = 'Đã lưu kiểu chụp của bạn! Hẹn chụp cùng Duy tại buổi lễ ♡';
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? 'Mạng phản hồi chậm. Ảnh có thể đã được lưu; kiểm tra với Duy trước khi gửi lại.' : (error.message === 'Failed to fetch' ? 'Chưa kết nối được. Nội dung vẫn còn, bạn thử lại nhé.' : error.message);
    } finally {
      busy = false; controls.forEach(control => { control.disabled = false; }); send.textContent = 'Gửi kiểu chụp ↗';
    }
  });
})();
