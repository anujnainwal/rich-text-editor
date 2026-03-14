/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  plugins: [
    obfuscator({
      apply: 'build', // Only apply during build (production)
      debugger: true,
      options: {
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringArray: true,
        rotateStringArray: true,
        shuffleStringArray: true,
        stringArrayThreshold: 0.75,
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'InkFlowEditor',
      fileName: (format) => `inkflow-editor.${format === 'es' ? 'mjs' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Ensure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
