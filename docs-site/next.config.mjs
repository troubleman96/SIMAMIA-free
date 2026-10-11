import nextra from 'nextra';

const withNextra = nextra({
  defaultShowCopyCode: true
});

export default withNextra({
  output: 'standalone',
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.tsx'
    }
  }
});
