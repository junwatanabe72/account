import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/account/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/01-types': path.resolve(__dirname, './src/01-types'),
      '@/02-core': path.resolve(__dirname, './src/02-core'),
      '@/03-services': path.resolve(__dirname, './src/03-services'),
      '@/04-stores': path.resolve(__dirname, './src/04-stores'),
      '@/05-ui': path.resolve(__dirname, './src/05-ui'),
      '@/06-data': path.resolve(__dirname, './src/06-data'),
      '@/07-utils': path.resolve(__dirname, './src/07-utils'),
    }
  }
})
