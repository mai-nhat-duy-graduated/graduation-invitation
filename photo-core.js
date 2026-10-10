/* Shared validation and sampling; also executable in Node tests. */
((root) => {
  'use strict';
  const MAX_BYTES = 5 * 1024 * 1024;
  function validate(name, description, file) {
    if (!name.trim() || name.trim().length > 80) return 'Vui lòng nhập tên, tối đa 80 ký tự.';
    if (description.trim().length > 500) return 'Mô tả tối đa 500 ký tự.';
    if (!file) return 'Bạn chọn một ảnh mẫu nhé.';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Chọn ảnh JPEG, PNG hoặc WebP.';
    if (!file.size || file.size > MAX_BYTES) return 'Ảnh phải có dung lượng từ 1 byte đến 5 MB.';
    return '';
  }
  function remaining(items, seen) { return items.filter(item => !seen.has(item.id)); }
  function draw(items, seen, rng = Math.random) {
    const pool = remaining(items, seen);
    return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
  }
  function settings() {
    const config = root.INVITATION || {};
    try {
      const url = new URL(config.supabaseUrl);
      if (url.protocol !== 'https:' || !config.supabasePublishableKey) return null;
      return { url: url.origin, key: config.supabasePublishableKey };
    } catch { return null; }
  }
  root.PhotoIdeas = { MAX_BYTES, validate, remaining, draw, settings };
})(typeof window === 'undefined' ? globalThis : window);
