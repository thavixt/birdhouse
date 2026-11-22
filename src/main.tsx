import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { initDebugLogging } from './debug'

initDebugLogging()

// Dev-only tools: the condition is `false` in production builds, so the import is dropped.
const DevCardGallery = import.meta.env.DEV ? lazy(() => import('./components/DevCardGallery')) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {DevCardGallery && (
      <Suspense fallback={null}>
        <DevCardGallery />
      </Suspense>
    )}
  </StrictMode>,
)
