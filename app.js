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
  const invitation = $('#invitation');
  const letterOpen = $('#letter-open');
  const letterClose = $('#letter-close');
  const letterContent = $('#letter-content');
  let letterFocusTimer;
  function setLetterOpen(open, moveFocus = true) {
    clearTimeout(letterFocusTimer);
    invitation.classList.toggle('is-open', open);
    letterOpen.setAttribute('aria-expanded', String(open));
    letterOpen.disabled = open;
    letterContent.inert = !open;
    letterContent.setAttribute('aria-hidden', String(!open));
    $('#letter-hint').textContent = open ? 'Có những lời, mình muốn gửi riêng đến bạn.' : 'Chạm vào dấu sáp để mở thư';
    if (moveFocus) {
      if (open) {
        letterFocusTimer = setTimeout(() => {
          // Do not steal focus if the guest has already moved to another control.
          if (document.activeElement !== document.body && document.activeElement !== letterOpen) return;
          const title = $('#letter-title');
          title.focus({ preventScroll: true });
          const bounds = title.getBoundingClientRect();
          if (bounds.top < 0 || bounds.bottom > innerHeight) title.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
        }, reducedMotion ? 0 : 1250);
      } else {
        letterOpen.focus({ preventScroll: true });
        letterFocusTimer = setTimeout(() => {
          if (document.activeElement !== letterOpen) return;
          const bounds = letterOpen.getBoundingClientRect();
          if (bounds.top < 0 || bounds.bottom > innerHeight) letterOpen.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center' });
        }, reducedMotion ? 0 : 1250);
      }
    }
  }
  setLetterOpen(false, false);
  invitation.classList.add('mail-ready');
  letterOpen.hidden = false;
  letterClose.hidden = false;
  letterOpen.addEventListener('click', () => setLetterOpen(true));
  letterClose.addEventListener('click', () => setLetterOpen(false));
  letterContent.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); setLetterOpen(false); }
  });
  $('#event-venue').textContent = config.venue || '';
  $('#event-venue').hidden = !config.venue || config.venue === config.university;
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
  }
  let countdownTimer;
  function updateCountdown() {
    const remaining = validDate ? Math.max(0, ceremony.getTime() - Date.now()) : 0;
    const total = Math.floor(remaining / 1000);
    const values = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => { $(`#${id}`).textContent = String(values[i]).padStart(2, '0'); });
    if (!remaining) clearInterval(countdownTimer);
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
