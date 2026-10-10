(() => {
  'use strict';
  const config = window.INVITATION;
  const $ = (selector) => document.querySelector(selector);
  const setAll = (selector, value) => document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  const guest = new URLSearchParams(location.search).get('name')?.trim().slice(0, 80) || 'bạn';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ceremony = new Date(config.ceremony);
  const validDate = Number.isFinite(ceremony.getTime());
  const timeZone = 'Asia/Ho_Chi_Minh';
  const format = (options) => new Intl.DateTimeFormat('vi-VN', { timeZone, ...options }).format(ceremony);
  const safeUrl = (value) => {
    if (!value) return null;
    try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  };
  setAll('[data-guest]', guest);
  setAll('[data-graduate]', config.graduateName);
  setAll('[data-initials]', config.initials);
  setAll('[data-university]', config.university);
  document.title = `Lời mời tốt nghiệp · ${config.graduateName}`;
  $('meta[name="description"]').content = `Lời mời đến lễ tốt nghiệp của ${config.graduateName}, ${config.university}.`;
  $('#personal-message').textContent = config.message;
  $('#event-venue').textContent = config.venue === config.university ? 'Cùng mình lưu lại khoảnh khắc đáng nhớ.' : config.venue;
  $('#event-address').textContent = config.address;
  const mapsUrl = safeUrl(config.mapsUrl);
  if (mapsUrl) $('#maps-link').href = mapsUrl;
  else $('#maps-link').hidden = true;
  const mapsEmbedUrl = safeUrl(config.mapsEmbedUrl);
  if (mapsEmbedUrl) {
    $('#maps-frame').src = mapsEmbedUrl;
    $('#venue-map').hidden = false;
  }
  if (validDate) {
    $('#event-month').textContent = `THÁNG ${format({ month: 'numeric' })} · ${format({ year: 'numeric' })}`;
    $('#event-day').textContent = format({ day: '2-digit' });
    $('#event-weekday').textContent = format({ weekday: 'long' });
    $('#event-time').textContent = `${format({ hour: '2-digit', minute: '2-digit', hour12: false })} · Giờ bắt đầu`;
  } else {
    $('#event-month').textContent = 'NGÀY TỔ CHỨC';
    $('#event-day').textContent = '—';
    $('#event-weekday').textContent = 'Sẽ cập nhật';
    $('#event-time').textContent = 'Giờ tổ chức sẽ được cập nhật';
    $('#calendar-button').hidden = true;
  }
  let countdownTimer;
  function updateCountdown() {
    const remaining = validDate ? Math.max(0, ceremony.getTime() - Date.now()) : 0;
    const total = Math.floor(remaining / 1000);
    const values = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => { $(`#${id}`).textContent = String(values[i]).padStart(2, '0'); });
    if (!validDate) $('#countdown-label').textContent = 'Ngày vui sẽ sớm được cập nhật';
    else if (!remaining) {
      $('#countdown-label').textContent = Date.now() < ceremony.getTime() + config.durationMinutes * 60000 ? 'Ngày vui đã đến. Hẹn gặp bạn!' : 'Cảm ơn bạn đã cùng mình lưu giữ ngày vui.';
      clearInterval(countdownTimer);
    }
  }
  updateCountdown();
  if (validDate && ceremony.getTime() > Date.now()) countdownTimer = setInterval(updateCountdown, 1000);
  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
  }
  if ('IntersectionObserver' in window && !reducedMotion) {
    document.documentElement.classList.add('js');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  const icsEscape = value => String(value).replaceAll('\\', '\\\\').replaceAll('\r', '').replaceAll('\n', '\\n').replaceAll(';', '\\;').replaceAll(',', '\\,');
  const icsDate = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  $('#calendar-button').addEventListener('click', () => {
    if (!validDate) return;
    const end = new Date(ceremony.getTime() + config.durationMinutes * 60000);
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Graduation Invitation//VI', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:graduation-${ceremony.getTime()}@${location.hostname}`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(ceremony)}`, `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsEscape(`Lễ tốt nghiệp · ${config.graduateName}`)}`, `LOCATION:${icsEscape(`${config.venue} — ${config.address}`)}`, `DESCRIPTION:${icsEscape(`Hẹn gặp bạn trong ngày tốt nghiệp! ${mapsUrl || ''}`)}`, 'END:VEVENT', 'END:VCALENDAR'];
    // Fold long UTF-8 lines at 75 octets as required by calendar clients.
    const encoder = new TextEncoder();
    const folded = lines.map(line => {
      let output = '', part = '', length = 0;
      for (const char of line) {
        const size = encoder.encode(char).length;
        if (length + size > 75) { output += `${part}\r\n`; part = ' '; length = 1; }
        part += char; length += size;
      }
      return output + part;
    });
    const url = URL.createObjectURL(new Blob([folded.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'le-tot-nghiep.ics'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Đã tạo lịch hẹn. Mở file để lưu vào lịch của bạn nhé.');
  });
  const campusUrl = safeUrl(config.campusMapUrl);
  const campusSource = safeUrl(config.campusMapSource);
  const campusPreview = safeUrl(config.campusMapPreviewUrl);
  if (campusUrl) {
    $('#campus-preview-link').href = campusUrl;
    $('#campus-image-open').href = campusUrl;
  }
  if (campusPreview) $('#campus-preview').src = campusPreview;
  const parkingUrl = safeUrl(config.parkingVideoUrl);
  if (campusSource) $('#campus-source').href = campusSource;
  if (parkingUrl) {
    $('#parking-source').href = parkingUrl;
    const embed = new URL('https://www.facebook.com/plugins/video.php');
    embed.searchParams.set('href', parkingUrl);
    embed.searchParams.set('show_text', 'false');
    embed.searchParams.set('width', '420');
    $('#parking-frame').src = embed.href;
  } else {
    $('#parking-frame').removeAttribute('src');
    $('#parking-video').hidden = true;
    $('#parking-source').hidden = true;
  }
  if (!campusUrl) {
    $('#campus-image-open').hidden = true;
    $('#campus-preview-link').hidden = true;
  }
  const portrait = safeUrl(config.portraitUrl);
  if (portrait) {
    $('#portrait').src = portrait;
    $('#portrait').alt = `Ảnh kỷ niệm của ${config.graduateName}`;
    $('#memory').hidden = false;
    $('#portrait').addEventListener('error', () => { $('#memory').hidden = true; });
  }
  const rsvp = safeUrl(config.rsvpUrl);
  if (rsvp) {
    $('#rsvp-link').href = rsvp; $('#rsvp-link').hidden = false;
    $('#rsvp-description').textContent = 'Cho mình biết bạn sẽ đến nhé. Mình rất mong được gặp bạn trong ngày đặc biệt này.';
  }
  $('#share-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#guest-input').value.trim();
    if (!name) { $('#guest-input').focus(); return; }
    const url = new URL(location.href);
    url.search = ''; url.hash = ''; url.searchParams.set('name', name);
    $('#share-url').value = url.href;
    $('#share-result').hidden = false;
    $('#copy-status').textContent = 'Gửi link này để người nhận thấy tên riêng trên thiệp.';
  });
  $('#copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('#share-url').value);
      $('#copy-status').textContent = 'Đã sao chép link lời mời.';
    } catch {
      $('#share-url').focus(); $('#share-url').select();
      $('#copy-status').textContent = 'Link đã được chọn. Bạn có thể sao chép thủ công.';
    }
  });
  const musicUrl = safeUrl(config.musicUrl);
  if (musicUrl) {
    const music = new Audio(musicUrl); music.loop = true; music.preload = 'auto'; music.volume = .35;
    const button = $('#music-toggle'); button.hidden = false;
    function musicState(playing) {
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
      button.textContent = playing ? 'Ⅱ' : '♫';
    }
    music.addEventListener('play', () => musicState(true));
    music.addEventListener('pause', () => musicState(false));
    music.addEventListener('error', () => { musicState(false); toast('Chưa tải được nhạc nền.'); });
    button.addEventListener('click', async () => {
      musicInteracted = true;
      if (!music.paused) { music.pause(); musicState(false); return; }
      await playMusic();
    });
    let musicInteracted = false;
    async function playMusic(silent = false) {
      try { await music.play(); }
      catch { if (!silent) toast('Bấm nút ♫ để bật nhạc nhé.'); }
    }
    function playOnFirstInteraction() {
      if (musicInteracted || !music.paused) return;
      musicInteracted = true;
      void playMusic(true);
    }
    document.addEventListener('click', playOnFirstInteraction, { once: true });
    document.addEventListener('keydown', playOnFirstInteraction, { once: true });
    void playMusic(true);
  }
})();
