const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const lambdas = [
  'auth',
  'categories',
  'products',
  'cart',
  'orders',
  'payments',
  'reports',
  'uploads',
  'users',
];

async function buildAll() {
  console.log('🚀 Building individual TypeScript AWS Lambda functions...');

  // Build each lambda into its own isolated directory
  for (const name of lambdas) {
    const entry = path.join(__dirname, `src/lambdas/${name}.ts`);
    const outdir = path.join(__dirname, `dist/lambdas/${name}`);

    if (fs.existsSync(entry)) {
      console.log(`📦 Bundling Lambda: ${name} -> dist/lambdas/${name}/index.js`);
      await esbuild.build({
        entryPoints: { index: entry },
        bundle: true,
        platform: 'node',
        target: 'node22',
        format: 'cjs',
        outdir: outdir,
        sourcemap: true,
        minify: true,
        external: ['@aws-sdk/*'], // provided by AWS Lambda runtime
      });
    }
  }

  // Also build the unified entrypoint for local dev & single lambda fallback
  console.log('📦 Bundling main API handler -> dist/main.js');
  await esbuild.build({
    entryPoints: { main: path.join(__dirname, 'src/index.ts') },
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outdir: path.join(__dirname, 'dist'),
    sourcemap: true,
    minify: false,
    external: ['@aws-sdk/*'],
  });

  console.log('✅ All Lambda functions successfully built!');
}

buildAll().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
