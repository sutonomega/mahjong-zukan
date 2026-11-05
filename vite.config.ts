import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Actions replaces this with the repository-specific base path.
  base: '/',
})
