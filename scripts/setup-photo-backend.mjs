import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function configureSchema(schema, adminUid) {
  if (adminUid === undefined) {
    const adminInsert = "insert into public.photo_admins(user_id) values ('00000000-0000-0000-0000-000000000000')\non conflict do nothing;";
    if (!schema.includes(adminInsert)) throw new Error('Không tìm được cấu hình admin trong schema.');
    return `begin;\n${schema.replace(adminInsert, '')}\ncommit;`;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUid || '') || adminUid === '00000000-0000-0000-0000-000000000000') {
    throw new Error('PHOTO_ADMIN_UID phải là UID tài khoản trong Supabase Authentication → Users.');
  }
  return `begin;\n${schema.replaceAll('00000000-0000-0000-0000-000000000000', adminUid)}\ncommit;`;
}

async function main() {
  const project = process.env.SUPABASE_PROJECT_REF;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!/^[a-z]{20}$/.test(project || '') || !token) throw new Error('Thiếu SUPABASE_PROJECT_REF hoặc secret SUPABASE_ACCESS_TOKEN.');
  const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  const query = configureSchema(schema, process.env.PHOTO_ADMIN_UID || undefined);
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }), signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Thiết lập database thất bại (HTTP ${response.status}). Kiểm tra token, project và UID có tồn tại trong Authentication → Users.`);
  const authConfig = await fetch(`https://api.supabase.com/v1/projects/${project}/config/auth`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ disable_signup: true }), signal: AbortSignal.timeout(30000),
  });
  if (!authConfig.ok) throw new Error(`Không tắt được đăng ký công khai (HTTP ${authConfig.status}).`);
  console.log('Đã tắt đăng ký tài khoản công khai.');
  console.log(process.env.PHOTO_ADMIN_UID ? 'Đã tạo bảng, bucket riêng tư và cấp quyền cho UID đã cấu hình.' : 'Đã tạo bảng và bucket riêng tư. Chưa cấp quyền admin: cần tạo tài khoản Auth và đặt PHOTO_ADMIN_UID.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
