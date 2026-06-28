import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'React Vite Demo SEO',
        short_name: 'React Vite Demo SEO',
        description: 'React Vite Demo SEO',
      }
    })
  ],
  build: {
    ssr: true,
    rolldownOptions: {
      input: 'src/entry-server.tsx'
    },
  },
})
