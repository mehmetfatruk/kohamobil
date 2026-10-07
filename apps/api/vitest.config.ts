import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// NestJS DI, decorator meta verisine ihtiyaç duyar; SWC bunu test sırasında üretir.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: { include: ['src/**/*.test.ts'] },
});
