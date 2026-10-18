import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
if (path.resolve(out) !== path.resolve(root, 'dist') || path.dirname(out) !== path.resolve(root)) throw new Error('Unexpected output directory');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'favicon.svg', 'src', 'vendor']) {
  await cp(path.join(root, name), path.join(out, name), { recursive: true });
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
for (let i = 1; i <= 5; i++) {
  const dir = path.join(out, `lesson-0${i}`);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html.replaceAll('href="./', 'href="../').replaceAll('src="./', 'src="../'));
}
await writeFile(path.join(out, '.nojekyll'), '');
console.log('Built homepage and five lesson entries in dist/.');
