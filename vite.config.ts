import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  base: '/financial_report_project/',
  plugins: [vue(),
    viteMockServe({
      mockPath: 'mock',       // mock 文件存放目录
      enable: true,           // 开发环境启用，生产环境会自动关闭
    }),],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
