import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js', 'favicon.svg', 'robots.txt', 'sitemap.xml']) {
  await cp(join(root, file), join(output, file));
}
