import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const origins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'apikey, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers});
  if (!origins.length) return reply(503, {error: 'Đăng nhập chưa sẵn sàng.'});
  if (origin && !origins.includes(origin)) return reply(403, {error: 'Nguồn không được hỗ trợ.'});
  if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers});
  if (req.method !== 'POST') return reply(405, {error: 'Chỉ hỗ trợ đăng nhập.'});
  try {
    // Bound JSON even when Content-Length is absent.
    const chunks: Uint8Array[] = []; let size = 0;
    const reader = req.body?.getReader();
    if (!reader) return reply(400, {error: 'Thiếu thông tin đăng nhập.'});
    for (;;) {
      const {value, done} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return reply(413, {error: 'Thông tin đăng nhập quá dài.'}); }
      chunks.push(value);
    }
    const data = JSON.parse(await new Blob(chunks).text());
    if (typeof data?.username !== 'string' || data.username.trim().toLowerCase() !== 'duy' || typeof data.password !== 'string' || !data.password || data.password.length > 256) return reply(401, {error: 'Tên đăng nhập hoặc mật khẩu không đúng.'});
    const uid = Deno.env.get('PHOTO_ADMIN_UID');
    if (!uid) return reply(503, {error: 'Đăng nhập chưa sẵn sàng.'});
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false, autoRefreshToken: false}});
    const {data: account, error: accountError} = await admin.auth.admin.getUserById(uid);
    if (accountError || !account.user?.email) return reply(503, {error: 'Đăng nhập chưa sẵn sàng.'});
    // Verify the supplied password with normal Supabase Auth, never bypass authentication.
    const auth = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {auth: {persistSession: false, autoRefreshToken: false}});
    const {data: login, error} = await auth.auth.signInWithPassword({email: account.user.email, password: data.password});
    if (error || !login.session || login.user?.id !== uid) return reply(error?.status === 429 ? 429 : 401, {error: 'Tên đăng nhập hoặc mật khẩu không đúng.'});
    const session = login.session;
    return reply(200, {access_token: session.access_token, refresh_token: session.refresh_token, expires_in: session.expires_in, user: {id: uid}});
  } catch { return reply(400, {error: 'Chưa đăng nhập được. Bạn thử lại nhé.'}); }
});
