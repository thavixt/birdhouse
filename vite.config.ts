import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // Local HTTPS for `npm run dev` / `npm run preview` (not used by `npm run build`).
    // First run downloads mkcert and installs its local CA into your trust store.
    mkcert(),
    VitePWA({
      // New versions install in the background and apply on the next load.
      registerType: 'autoUpdate',
      // Icons (favicon, apple-touch, 192/512, maskable) are generated from this image
      // at build time, added to the manifest, and linked in index.html.
      pwaAssets: {
        image: 'public/duck.png',
        preset: 'minimal-2023',
      },
      manifest: {
        name: 'Birdhouse',
        short_name: 'Birdhouse',
        description: 'A bird-themed engine-building card game.',
        lang: 'en',
        display: 'fullscreen',
        start_url: '/',
        theme_color: '#064e3b', // emerald-900, matches the title colour
        background_color: '#ecfdf5', // emerald-50, matches the page background
      },
      workbox: {
        // Precache everything so the installed app works fully offline.
        // (No `webmanifest` here: the plugin adds the manifest itself, and a duplicate
        // entry makes Workbox's precache fail silently.)
        globPatterns: ['**/*.{js,css,html,png,ico,svg}'],
      },
    }),
  ],
  server: {
    port: 8546,
    host: true,
    // open: true,
  }
})
