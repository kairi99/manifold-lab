import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // served from https://kairi99.github.io/manifold-lab/ in production builds
  base: process.env.GITHUB_PAGES ? '/manifold-lab/' : '/',
})
