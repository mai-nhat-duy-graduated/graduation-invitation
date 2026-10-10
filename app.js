(() => {
  'use strict';
  const config = window.INVITATION;
  const $ = (selector) => document.querySelector(selector);
  const setAll = (selector, value) => document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  const recipient = window.INVITATION_GUEST;
  const wording = window.InvitationCopy.copy(recipient);
  const guest = wording.greeting;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ceremony = new Date(config.ceremony);
  const validDate = Number.isFinite(ceremony.getTime());
  const timeZone = 'Asia/Ho_Chi_Minh';
  const format = (options) => new Intl.DateTimeFormat('vi-VN', { timeZone, ...options }).format(ceremony);
  const safeUrl = (value) => {
    if (!value) return null;
    try { const url = new URL(value, document.baseURI); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  };
  setAll('[data-guest]', guest);
  const envelopeGuest = wording.envelopeGreeting || guest;
  const envelopeGuestEl = $('.envelope-address [data-guest]');
  if (envelopeGuestEl) envelopeGuestEl.textContent = envelopeGuest;
  $('.envelope-address').classList.toggle('long-name', envelopeGuest.length > 32);
  $('.envelope-address').classList.toggle('very-long-name', envelopeGuest.length > 55);
  setAll('[data-graduate]', config.graduateName);
  setAll('[data-initials]', config.initials);
  setAll('[data-university]', config.university);
  document.title = `Lời mời tốt nghiệp · ${config.graduateName}`;
  $('meta[name="description"]').content = `Lời mời đến lễ tốt nghiệp của ${config.graduateName}, ${config.university}.`;
  const heroLink = $('#hero-invitation-link') || $('.sky-hero-bottom a[href="#invitation"]');
  if (heroLink && wording.heroLink) {
    heroLink.innerHTML = `${wording.heroLink} <span aria-hidden="true">↓</span>`;
  }
  $('.letter-lead').textContent = wording.lead;
  $('#personal-message').textContent = wording.message;
  $('#letter-closing').textContent = wording.closing;
  $('#letter-signoff').textContent = wording.signoff;
  if ($('#parking-note') && wording.parking) {
    $('#parking-note').textContent = wording.parking;
  }
  if ($('#memory-desc') && wording.memory) {
    $('#memory-desc').textContent = wording.memory;
  }
  $('#photo-title').textContent = wording.photoTitle;
  $('#photo-intro').textContent = wording.photoDescription;
  if ($('#photo-preview') && wording.photoPreviewAlt) {
    $('#photo-preview').alt = wording.photoPreviewAlt;
  }
  if ($('#photo-hint') && wording.photoHint) {
    $('#photo-hint').textContent = wording.photoHint;
  }
  const letterOpen = $('#letter-open');
  const gate = $('#letter-gate');
  const content = $('#invitation-content');
  const envelope = $('.sealed-envelope');
  let state = 'closed';
  let startMusic = () => {};
  content.inert = true;
  content.setAttribute('aria-hidden', 'true');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (envelope) {
    envelope.addEventListener('click', (e) => {
      if (state === 'closed' && e.target !== letterOpen && !letterOpen.contains(e.target)) {
        letterOpen.click();
      }
    });
  }
  letterOpen.addEventListener('click', () => {
    if (state !== 'closed') return;
    state = 'opening';
    document.body.dataset.state = state;
    letterOpen.disabled = true;
    letterOpen.setAttribute('aria-expanded', 'true');
    // Playback must begin within the opening gesture for mobile browsers.
    startMusic();
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      state = 'open';
      document.body.dataset.state = state;
      document.documentElement.classList.add('invitation-open');
      gate.hidden = true;
      content.inert = false;
      content.removeAttribute('aria-hidden');
      $('meta[name="theme-color"]').content = '#183d60';
      window.scrollTo({ top: 0, behavior: 'instant' });
      $('#hero-title').focus({ preventScroll: true });
    }, reducedMotion ? 0 : 1800);
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
    $('#hero-date').textContent = format({ day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '.');
    $('#hero-year').textContent = format({ year: 'numeric' });
    $('#event-month').textContent = `THÁNG ${format({ month: 'numeric' })} · ${format({ year: 'numeric' })}`;
    $('#event-day').textContent = format({ day: '2-digit' });
    $('#event-weekday').textContent = format({ weekday: 'long' });
    $('#event-time').textContent = `${format({ hour: '2-digit', minute: '2-digit', hour12: false })} · Giờ bắt đầu`;
  } else {
    $('#hero-date').textContent = 'Ngày tổ chức sẽ được cập nhật';
    $('#hero-year').textContent = '—';
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
    const music = new Audio(musicUrl); music.loop = true; music.preload = 'none'; music.volume = .35;
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
      if (!music.paused) { music.pause(); musicState(false); return; }
      await playMusic();
    });
    async function playMusic(silent = false) {
      try { await music.play(); }
      catch { if (!silent) toast('Bấm nút ♫ để bật nhạc nhé.'); }
    }
    startMusic = () => { void playMusic(true); };
  }
})();
