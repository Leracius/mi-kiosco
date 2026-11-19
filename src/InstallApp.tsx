import { useEffect, useRef, useState } from 'react'

type InstallPrompt = Event & {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type StandaloneNavigator = Navigator & { standalone?: boolean }

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as StandaloneNavigator).standalone === true
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(isInstalled)
  const [instructions, setInstructions] = useState(false)
  const prompting = useRef(false)
  const appleMobile = isAppleMobile()

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)')
    function onPrompt(event: Event) {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }
    function onInstalled() {
      setPrompt(null)
      setInstalled(true)
    }
    function onDisplayModeChange() {
      setInstalled(isInstalled())
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    standalone.addEventListener('change', onDisplayModeChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      standalone.removeEventListener('change', onDisplayModeChange)
    }
  }, [])

  async function install() {
    if (!prompt || prompting.current) return
    prompting.current = true
    setPrompt(null)
    try {
      const { outcome } = await prompt.prompt()
      if (outcome === 'accepted') setInstalled(true)
    } catch {
      setInstructions(true)
    } finally {
      prompting.current = false
    }
  }

  if (installed) return null
  if (!prompt && !appleMobile && !instructions) return null

  return (
    <div className="install-app">
      <button
        type="button"
        aria-expanded={prompt ? undefined : instructions}
        onClick={prompt ? install : () => setInstructions(!instructions)}
      >
        Instalar Mi Kiosco
      </button>
      {instructions && (
        <p role="status">
          {appleMobile
            ? 'En Safari, tocá Compartir → Agregar a pantalla de inicio. Activá Abrir como app web si aparece y tocá Agregar.'
            : 'Abrí el menú del navegador y buscá la opción para instalar la aplicación.'}
        </p>
      )}
    </div>
  )
}
