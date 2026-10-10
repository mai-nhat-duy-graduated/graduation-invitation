(function (root) {
  'use strict';

  function normalizePronoun(pronoun) {
    if (!pronoun) return null;
    const p = pronoun.toLowerCase().trim();
    if (p.includes('tao') || p.includes('mày') || p.includes('may')) return 'tao-may';
    if (p.includes('chú') || p.includes('chu')) return 'tui-chu';
    if (p.includes('tên') || p.includes('ten')) return 'tui-ten';
    return p;
  }

  function copy(guest) {
    const role = guest?.role || 'bạn';
    const pronounStyle = normalizePronoun(guest?.pronoun);
    const guestName = guest?.name || '';
    const givenName = guestName ? guestName.trim().split(/\s+/).pop() : 'bạn';

    let self = 'Tui';
    let you = 'bạn';
    let youUpper = 'BẠN';
    let youTitle = 'Bạn';
    let polite = false;
    let greeting = guest ? guestName : 'bạn';
    let envelopeGreeting = guest ? guestName : 'bạn';

    if (role === 'em') {
      self = 'Anh';
      you = 'em';
      youUpper = 'EM';
      youTitle = 'Em';
      greeting = guest ? `em ${guestName}` : 'em';
      envelopeGreeting = guest ? `Em ${guestName}` : 'Em';
    } else if (role === 'anh') {
      self = 'Em';
      you = 'anh';
      youUpper = 'ANH';
      youTitle = 'Anh';
      polite = true;
      greeting = guest ? `anh ${guestName}` : 'anh';
      envelopeGreeting = guest ? `Anh ${guestName}` : 'Anh';
    } else if (role === 'chị') {
      self = 'Em';
      you = 'chị';
      youUpper = 'CHỊ';
      youTitle = 'Chị';
      polite = true;
      greeting = guest ? `chị ${guestName}` : 'chị';
      envelopeGreeting = guest ? `Chị ${guestName}` : 'Chị';
    } else {
      // role === 'bạn'
      if (pronounStyle === 'tao-may') {
        self = 'Tao';
        you = 'mày';
        youUpper = 'MÀY';
        youTitle = 'Mày';
        greeting = guest ? guestName : 'mày';
        envelopeGreeting = guest ? guestName : 'bạn';
      } else if (pronounStyle === 'tui-chu') {
        self = 'Tui';
        you = 'chú';
        youUpper = 'CHÚ';
        youTitle = 'Chú';
        greeting = guest ? `chú ${guestName}` : 'chú';
        envelopeGreeting = guest ? `Chú ${guestName}` : 'Chú';
      } else if (pronounStyle === 'tui-ten') {
        self = 'Tui';
        you = givenName;
        youUpper = givenName.toUpperCase();
        youTitle = givenName;
        greeting = guest ? guestName : 'bạn';
        envelopeGreeting = guest ? guestName : 'bạn';
      } else {
        self = 'Tui';
        you = 'bạn';
        youUpper = 'BẠN';
        youTitle = 'Bạn';
        greeting = guest ? guestName : 'bạn';
        envelopeGreeting = guest ? guestName : 'bạn';
      }
    }

    const selfLower = self.toLowerCase();

    return {
      self,
      you,
      youUpper,
      youTitle,
      greeting,
      envelopeGreeting,
      lead: `${self} sắp tốt nghiệp rồi${polite ? ' ạ' : ''}!`,
      message: `${self} mời ${you} đến chung vui và chụp vài tấm ảnh kỷ niệm trong ngày tốt nghiệp.`,
      closing: `Nếu đến được, ${you} nhắn ${selfLower} biết hen!`,
      signoff: `Hẹn gặp ${you} ngày hôm đó ♡`,
      photoTitle: role === 'em'
        ? 'Gợi ý cho anh một kiểu ảnh để anh em mình chụp nha'
        : `${youTitle} muốn chụp kiểu nào cùng ${selfLower}?`,
      photoDescription: `Gửi một ảnh mẫu nhé. Đến buổi lễ, ${selfLower} sẽ random từ ảnh mẫu và những ý tưởng mọi người gửi!`,
      heroLink: `MỘT LỜI MỜI DÀNH RIÊNG CHO ${youUpper}`,
      parking: `Xem video hướng dẫn chỗ gửi xe trước khi đến. Hẹn ${you} ở trong khuôn viên trường!`,
      memory: `Thanh xuân có những người bạn, những bài học, và cả những giấc mơ. Cảm ơn ${you} đã cùng ${selfLower} đi qua một phần hành trình này.`,
      photoHint: `Ảnh và lời nhắn được lưu riêng để Duy xem và random khi chụp cùng ${you}.`,
      photoPreviewAlt: `Ảnh mẫu ${you} sắp gửi`,
    };
  }

  if (typeof module !== 'undefined') module.exports = { copy };
  else root.InvitationCopy = { copy };
})(typeof window !== 'undefined' ? window : globalThis);
