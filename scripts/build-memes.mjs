import { readdir, writeFile } from 'node:fs/promises';
const files = (await readdir(new URL('../memes/', import.meta.url))).filter(file => /\.(jpe?g|png|webp)$/i.test(file)).sort();
const manifest = files.map(file => ({ id: `sample:${file}`, url: `memes/${encodeURIComponent(file)}` }));
await writeFile(new URL('../memes/manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest: ${files.length} ảnh mẫu`);
