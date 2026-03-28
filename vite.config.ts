/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
export default defineConfig({
  plugins: [],
  build: {
    minify: 'esbuild',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        react: resolve(__dirname, 'src/react/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const base = entryName === 'index' ? 'inkflow-editor' : entryName;
        if (format === 'es') return `${base}.mjs`;
        if (format === 'cjs') return `${base}.cjs`;
        return `${base}.js`;
      },
    },
    rollupOptions: {
      // Ensure to externalize deps that shouldn't be bundled
      external: ['dompurify', 'react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          dompurify: 'DOMPurify',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
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
