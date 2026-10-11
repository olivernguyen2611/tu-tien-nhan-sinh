import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// `base` must match the repo name so assets load correctly on GitHub Pages
// (https://olivernguyen2611.github.io/tu-tien-nhan-sinh/).
export default defineConfig({
  base: '/tu-tien-nhan-sinh/',
  plugins: [preact()],
});
