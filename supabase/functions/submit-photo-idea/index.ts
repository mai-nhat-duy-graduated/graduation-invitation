import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const maxBytes = 5 * 1024 * 1024;
const origins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Vary': 'Origin' };
  if (origins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'apikey, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (!origins.length) return reply(503, { error: 'Chỗ gửi ảnh chưa sẵn sàng.' });
  if (origin && !origins.includes(origin)) return reply(403, { error: 'Nguồn gửi không được hỗ trợ.' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'Chỉ hỗ trợ gửi ảnh.' });
  if (!req.headers.get('content-type')?.startsWith('multipart/form-data')) return reply(400, { error: 'Dữ liệu gửi không hợp lệ.' });
  // Bound the entire multipart body, including requests without Content-Length.
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    if (!req.body) return reply(400, { error: 'Thiếu ảnh.' });
    const reader = req.body.getReader();
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > maxBytes + 64 * 1024) { await reader.cancel(); return reply(413, { error: 'Ảnh tối đa 5 MB.' }); }
      chunks.push(value);
    }
    const data = await new Response(new Blob(chunks), { headers: { 'Content-Type': req.headers.get('content-type')! } }).formData();
    const name = data.get('name'), description = data.get('description') || '', file = data.get('file');
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) return reply(400, { error: 'Tên bắt buộc, tối đa 80 ký tự.' });
    if (typeof description !== 'string' || description.trim().length > 500) return reply(400, { error: 'Mô tả tối đa 500 ký tự.' });
    if (!(file instanceof File) || !file.size || file.size > maxBytes) return reply(400, { error: 'Chọn một ảnh tối đa 5 MB.' });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const matches = (offset: number, signature: number[]) => signature.every((byte, i) => bytes[offset + i] === byte);
    const jpeg = matches(0, [255, 216, 255]);
    const png = matches(0, [137, 80, 78, 71, 13, 10, 26, 10]);
    const webp = matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80]);
    const extension = file.type === 'image/jpeg' && jpeg ? 'jpg' : file.type === 'image/png' && png ? 'png' : file.type === 'image/webp' && webp ? 'webp' : null;
    if (!extension) return reply(400, { error: 'Ảnh phải là JPEG, PNG hoặc WebP hợp lệ.' });
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const id = crypto.randomUUID(), path = `${id}.${extension}`;
    const { error: uploadError } = await client.storage.from('guest-photo-ideas').upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) return reply(503, { error: 'Chưa lưu được ảnh. Bạn thử lại nhé.' });
    const { error: insertError } = await client.from('photo_ideas').insert({ id, name: name.trim(), description: description.trim(), image_path: path });
    if (insertError) {
      const { error: cleanupError } = await client.storage.from('guest-photo-ideas').remove([path]);
      if (cleanupError) console.error('Photo cleanup failed', path);
      return reply(503, { error: 'Chưa lưu được ý tưởng. Bạn thử lại nhé.' });
    }
    return reply(201, { id });
  } catch {
    return reply(400, { error: 'Chưa xử lý được ảnh. Kiểm tra ảnh và thử lại nhé.' });
  }
});
