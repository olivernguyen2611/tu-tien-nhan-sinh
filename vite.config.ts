import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// `base` must match the repo name so assets load correctly on GitHub Pages
// (https://olivernguyen2611.github.io/tu-tien-nhan-sinh/).
export default defineConfig({
  base: '/tu-tien-nhan-sinh/',
  plugins: [preact()],
  build: {
    // The content chunk is expected to be large (all the game's JSON).
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split the bundle so a code-only release does not re-download the content,
        // and the browser can fetch the parts in parallel.
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/content/')) return 'content';
          if (id.includes('/src/systems/')) return 'systems';
          return undefined;
        },
      },
    },
  },
});
