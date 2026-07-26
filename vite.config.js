import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Function form (matches by resolved path, incl. package internals like
        // react-dom/cjs/*) so the React runtime is fully isolated. This makes
        // react-vendor the ONLY static vendor dep of the tiny entry; three/r3f/
        // motion/post stay async and are fetched solely by the lazy desktop app.
        // Result: phones download entry + react-vendor + the mobile wrapper — no
        // 3D code or assets.
        manualChunks(id) {
          // Vite's dynamic-import preload helper: keep it in react-vendor (an
          // entry dep already) so the entry doesn't hard-link a heavy chunk
          // (e.g. r3f -> three) just to reach the helper.
          if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill')) {
            return 'react-vendor';
          }
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three';
          if (/[\\/]node_modules[\\/]@react-three[\\/](fiber|drei)[\\/]/.test(id)) {
            return 'r3f';
          }
          if (
            /[\\/]node_modules[\\/](postprocessing|@react-three[\\/]postprocessing)[\\/]/.test(
              id,
            )
          ) {
            return 'post';
          }
          if (/[\\/]node_modules[\\/](gsap|framer-motion|lenis)[\\/]/.test(id)) {
            return 'motion';
          }
          return undefined;
        },
      },
    },
  },
});
