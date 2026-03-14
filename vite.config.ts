/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
export default defineConfig({
  plugins: [],
  build: {
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'InkFlowEditor',
      fileName: (format) => `inkflow-editor.${format === 'es' ? 'mjs' : 'js'}`,
      formats: ['es'],
    },
    rollupOptions: {
      // Ensure to externalize deps that shouldn't be bundled
      // into your library
      external: ['dompurify'],
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
