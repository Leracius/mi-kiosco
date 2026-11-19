import { createRoot } from 'react-dom/client'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import { App } from './App'
import './catalog/catalog.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)

if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error: unknown) => {
    console.warn('No se pudo registrar el Service Worker de Mi Kiosco.', error)
  })
}
