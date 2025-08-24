import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/account/',
  build: {
    // チャンクサイズ警告の閾値を調整（デフォルト500KB → 1000KB）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手動でチャンクを分割
        manualChunks: {
          // React関連を別チャンクに
          'react-vendor': ['react', 'react-dom'],
          // 日付処理ライブラリ
          'date-vendor': ['date-fns'],
          // データ処理ライブラリ
          'data-vendor': ['papaparse', 'xlsx', 'uuid'],
          // 状態管理
          'state-vendor': ['zustand'],
          // バリデーション
          'validation-vendor': ['zod'],
        },
        // チャンクファイル名のパターン
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `${facadeModuleId}-[hash].js`;
        },
      },
    },
  },
})
