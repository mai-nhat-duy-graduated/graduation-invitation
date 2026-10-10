(function (root) {
  'use strict';
  function copy(guest) {
    const role = guest?.role || 'bạn';
    const self = role === 'em' ? 'Anh' : role === 'bạn' ? 'Mình' : 'Em';
    const you = role === 'bạn' ? 'bạn' : role;
    const polite = ['anh', 'chị'].includes(role);
    return {
      greeting: guest ? `${role === 'bạn' ? '' : `${you} `}${guest.name}` : 'bạn',
      lead: `${self} sắp tốt nghiệp rồi${polite ? ' ạ' : ''}!`,
      message: `${self} mời ${you} đến chung vui và chụp vài tấm ảnh kỷ niệm trong ngày tốt nghiệp.`,
      closing: `Nếu đến được, ${you} nhắn ${self.toLowerCase()} biết hen!`,
      signoff: `Hẹn gặp ${you} ở ngày vui ♡`,
      photoTitle: role === 'em' ? 'Gợi ý cho anh một kiểu ảnh để anh em mình chụp nha' : `${you[0].toUpperCase() + you.slice(1)} muốn chụp kiểu nào cùng ${self.toLowerCase()}?`,
      photoDescription: `Gửi một ảnh mẫu nhé. Đến buổi lễ, ${self.toLowerCase()} sẽ random từ ảnh mẫu và những ý tưởng mọi người gửi!`,
    };
  }
  if (typeof module !== 'undefined') module.exports = { copy };
  else root.InvitationCopy = { copy };
})(typeof window !== 'undefined' ? window : globalThis);
