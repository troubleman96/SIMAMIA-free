import { readFile, writeFile } from 'node:fs/promises';

const layoutPath = new URL('../node_modules/nextra-theme-docs/dist/layout.js', import.meta.url);
const source = await readFile(layoutPath, 'utf8');
const upstream = 'LayoutPropsSchema.safeParse(themeConfig)';
const fixed = 'LayoutPropsSchema.safeParse({ children, ...themeConfig })';

if (source.includes(fixed)) {
  process.exit(0);
}

if (!source.includes(upstream)) {
  throw new Error(`Could not find the expected Nextra layout validation in ${layoutPath}`);
}

await writeFile(layoutPath, source.replace(upstream, fixed));
console.info('Applied Nextra 4.6.1 Layout children validation workaround.');
