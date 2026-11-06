import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { privateGoalGlobs, protectGoalSources } from './verification/goalSourceProtection.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [protectGoalSources(), react(), tailwindcss()],
  server: { fs: { deny: ['**/.env*', '**/.git/**', ...privateGoalGlobs] } },
})
