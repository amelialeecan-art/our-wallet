import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 사이트(/our-wallet/)에 맞춰 빌드 시에만 base 적용.
// 로컬 dev는 루트('/')에서 동작.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/our-wallet/' : '/',
  plugins: [react()],
}))
