import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const NODE_MODULES = fileURLToPath(new URL('./node_modules/', import.meta.url))

/** `name` and every package it depends on (read from node_modules' package.json files). */
function dependencyTree(name: string, found = new Set<string>()): Set<string> {
  if (found.has(name)) return found
  found.add(name)
  try {
    const pkg = JSON.parse(readFileSync(`${NODE_MODULES}${name}/package.json`, 'utf8'))
    for (const dep of Object.keys(pkg.dependencies ?? {})) dependencyTree(dep, found)
  } catch {
    // not installed at the top level: nothing more to follow
  }
  return found
}

/** The package a module id belongs to, e.g. "react-dom" or "@floating-ui/dom". */
function packageOf(id: string): string | null {
  // `[\\/]`: module ids may use either path separator (Windows).
  const parts = id.split(/[\\/]node_modules[\\/]/)
  if (parts.length < 2) return null
  const [first, second] = parts[parts.length - 1].split(/[\\/]/)
  return first.startsWith('@') ? `${first}/${second}` : first
}

// The tutorial (react-joyride) is lazy-loaded; keep it and its dependencies out of the
// vendor file so players who never turn the tutorial on don't download them.
const LAZY_ONLY = dependencyTree('react-joyride')

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
        // Bird photos (src/bird-images.ts) come from Wikimedia: cache each the first time it
        // is shown, so cards keep their photos offline. Wikimedia sends CORS headers, so the
        // cards load them with crossOrigin="anonymous" and only real 200 responses are kept.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.wikimedia.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bird-photos',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Two files for the app itself: "vendor" (libraries: React, i18next, dnd-kit, …) and
        // "app" (our code). Libraries change rarely, so after an update browsers and the
        // service worker usually only fetch the smaller app file again.
        entryFileNames: 'assets/app-[hash].js',
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: (id) => {
                const pkg = packageOf(id)
                return pkg !== null && !LAZY_ONLY.has(pkg)
              },
            },
          ],
        },
      },
    },
  },
  server: {
    port: 8546,
    host: true,
    open: true,
  }
})
