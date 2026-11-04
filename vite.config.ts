/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vendor groups cache separately from app code; three.js alone is ~700 kB minified.
const VENDOR: [string, RegExp][] = [
  ['three', /node_modules[\\/](three|three-stdlib)[\\/]/],
  ['r3f', /node_modules[\\/](@react-three|@monogrid|troika-|camera-controls|maath|meshline|stats)/],
  ['katex', /node_modules[\\/]katex[\\/]/],
  ['react', /node_modules[\\/](react|react-dom|scheduler|zustand)[\\/]/],
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'] },
  // served from https://kairi99.github.io/manifold-lab/ in production builds
  base: process.env.GITHUB_PAGES ? '/manifold-lab/' : '/',
  build: {
    chunkSizeWarningLimit: 800, // the three.js group is ~700 kB and cannot be split further usefully
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: VENDOR.map(([name, test]) => ({ name, test })),
        },
      },
    },
  },
})
