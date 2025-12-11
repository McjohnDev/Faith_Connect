/**
 * esbuild Configuration
 * Fast bundling for development and production
 */

const esbuild = require('esbuild');

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/index.js',
  format: 'cjs',
  sourcemap: !isProduction,
  minify: isProduction,
  external: [
    // Node.js built-ins
    'fs',
    'path',
    'crypto',
    'http',
    'https',
    'url',
    'util',
    'stream',
    'events',
    'buffer',
    'querystring',
    // Dependencies (keep as external for node_modules)
    'express',
    'cors',
    'helmet',
    'dotenv',
    'jsonwebtoken',
    'bcrypt',
    'redis',
    'mysql2',
    'pg',
    'zod',
    'express-rate-limit',
    'winston',
    'uuid'
  ],
  logLevel: 'info',
  banner: {
    js: isProduction ? '' : '// Development build'
  }
};

if (isProduction) {
  esbuild.build(config).catch(() => process.exit(1));
} else {
  const ctx = esbuild.context(config);
  ctx.then(context => {
    context.watch();
    console.log('👀 Watching for changes...');
  }).catch(() => process.exit(1));
}

module.exports = config;

