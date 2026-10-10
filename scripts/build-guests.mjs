import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function slug(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
export function prepare(source, previous = []) {
  const lines = source.trim().split(/\r?\n/);
  if (lines.shift() !== 'name\trole') throw new Error('Expected name and role TSV columns');
  const seen = new Set();
  return lines.map(line => {
    const [rawName, rawRole, extra] = line.split('\t');
    const name = rawName?.trim(), role = rawRole?.trim().toLowerCase();
    if (!name || !['em', 'bạn', 'anh', 'chị'].includes(role) || extra !== undefined) throw new Error('Invalid guest row');
    if (seen.has(name)) throw new Error('Duplicate guest name');
    seen.add(name);
    const existing = previous.find(guest => guest.name === name);
    const token = existing?.token || randomBytes(16).toString('hex');
    return { name, role, token, suffix: `${slug(name)}_${token}` };
  });
}
export function renderGuests(guests, html, output) {
  const seen = new Set();
  // Validate everything before creating output; never accept path traversal.
  for (const guest of guests) {
    if (!guest.name || !['em', 'bạn', 'anh', 'chị'].includes(guest.role) || !/^[a-f0-9]{32}$/.test(guest.token) || guest.suffix !== `${slug(guest.name)}_${guest.token}` || seen.has(guest.suffix)) throw new Error('Invalid invitation data');
    seen.add(guest.suffix);
  }
  for (const guest of guests) {
    const data = JSON.stringify({name: guest.name, role: guest.role}).replace(/</g, '\\u003c');
    const page = html.replace(/referrerpolicy="[^"]*"/g, 'referrerpolicy="no-referrer"').replace(/href="(#[^"]*)"/g, `href="${guest.suffix}/$1"`).replace('<head>', '<head>\n  <base href="../">\n  <meta name="robots" content="noindex, nofollow, noarchive">\n  <meta name="referrer" content="no-referrer">')
      .replace('<script src="config.js"', `<script>window.INVITATION_GUEST = ${data};</script>\n  <script src="config.js"`);
    const directory = resolve(output, guest.suffix);
    mkdirSync(directory, {recursive: true});
    writeFileSync(resolve(directory, 'index.html'), page);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--prepare')) {
    const path = 'resources/guest-private.json';
    const previous = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
    const guests = prepare(readFileSync('resources/guest.tsv', 'utf8'), previous);
    writeFileSync(path, JSON.stringify(guests, null, 2) + '\n', {mode: 0o600});
    const base = 'https://mai-nhat-duy-graduated.github.io/graduation-invitation/';
    writeFileSync('resources/guest-links.tsv', 'name\trole\turl\n' + guests.map(g => `${g.name}\t${g.role}\t${base}${g.suffix}/`).join('\n') + '\n', {mode: 0o600});
    console.log(`Prepared ${guests.length} private invitation links.`);
  } else {
    const data = process.env.INVITATION_GUESTS || readFileSync('resources/guest-private.json', 'utf8');
    const guests = JSON.parse(data);
    renderGuests(guests, readFileSync('index.html', 'utf8'), '_site');
    console.log(`Built ${guests.length} invitations.`);
  }
}
