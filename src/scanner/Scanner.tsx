import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { IScannerControls } from '@zxing/browser'
import type { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { Icon } from '../Icon'
import { createScanSession } from './scanSession'

const scanTimeoutMs = 25_000

type CameraState =
  | { kind: 'idle' | 'starting' | 'active' }
  | { kind: 'found' | 'missing'; barcode: string }
  | { kind: 'error'; message: string }

function cameraError(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'El acceso a la cámara fue denegado. Revisá los permisos del sitio o buscá manualmente.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No encontramos una cámara disponible en este dispositivo.'
    case 'NotReadableError':
    case 'AbortError':
      return 'No pudimos abrir la cámara. Cerrá otras apps que la estén usando y reintentá.'
    default:
      return 'Hubo un error al usar la cámara. Volvé a intentar o buscá manualmente.'
  }
}

type ScannerProps = {
  enabled: boolean
  onLookup: (barcode: string) => boolean
  children?: ReactNode
}

export function Scanner({ enabled, onLookup, children }: ScannerProps) {
  const [state, setState] = useState<CameraState>({ kind: 'idle' })
  const [manual, setManual] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchError, setTorchError] = useState(false)
  const preview = useRef<HTMLDivElement>(null)
  const current = useRef<{ stop: () => void; controls?: IScannerControls } | null>(null)
  const lookup = useRef(onLookup)

  useEffect(() => {
    lookup.current = onLookup
  }, [onLookup])

  useEffect(() => {
    function stopWhenHidden() {
      if (current.current) {
        current.current.stop()
        setState({ kind: 'idle' })
      }
    }

    function onVisibilityChange() {
      if (document.hidden) stopWhenHidden()
    }

    window.addEventListener('pagehide', stopWhenHidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', stopWhenHidden)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      current.current?.stop()
    }
  }, [])

  function resetTorch() {
    setTorchAvailable(false)
    setTorchOn(false)
    setTorchError(false)
  }

  function showResult(barcode: string) {
    resetTorch()
    setState({ kind: lookup.current(barcode) ? 'found' : 'missing', barcode })
  }

  async function start() {
    if (current.current || !preview.current) return

    resetTorch()
    if (!window.isSecureContext) {
      setState({ kind: 'error', message: 'Para usar la cámara, abrí Mi Kiosco por HTTPS o desde localhost.' })
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ kind: 'error', message: 'La cámara no está disponible en este navegador.' })
      return
    }

    setManual(false)
    setState({ kind: 'starting' })

    const session = createScanSession()
    const video = document.createElement('video')
    video.autoplay = true
    video.muted = true
    video.playsInline = true
    video.setAttribute('aria-label', 'Vista previa de la cámara')
    preview.current.replaceChildren(video)

    let stream: MediaStream | undefined
    let timeout: number | undefined
    const attempt: { stop: () => void; controls?: IScannerControls } = { stop }
    current.current = attempt

    function stop() {
      if (!session.close()) return
      current.current = null
      window.clearTimeout(timeout)
      stream?.getTracks().forEach((track) => track.stop())
      try {
        attempt.controls?.stop()
      } finally {
        video.srcObject = null
        video.remove()
      }
    }

    function fail(message: string) {
      if (session.closed) return
      stop()
      resetTorch()
      setState({ kind: 'error', message })
    }

    try {
      // Keep the stream under our control even while ZXing is initializing.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      if (session.closed) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      for (const track of stream.getVideoTracks()) {
        track.addEventListener('ended', () => fail('La cámara se desconectó. Volvé a intentar.'), { once: true })
        if (track.readyState === 'ended') {
          fail('La cámara se desconectó. Volvé a intentar.')
          return
        }
      }

      const [{ BrowserMultiFormatReader }, zxing] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ])
      if (session.closed) return

      const formats = [zxing.BarcodeFormat.EAN_13, zxing.BarcodeFormat.EAN_8, zxing.BarcodeFormat.UPC_A]
      const hints = new Map<DecodeHintType, BarcodeFormat[] | boolean>([
        [zxing.DecodeHintType.POSSIBLE_FORMATS, formats],
        [zxing.DecodeHintType.TRY_HARDER, true],
      ])
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 250 })
      const controls = await reader.decodeFromStream(stream, video, (result, error) => {
        if (session.closed) return
        if (result) {
          stop()
          showResult(result.getText())
        } else if (error && !(
          error instanceof zxing.NotFoundException ||
          error instanceof zxing.ChecksumException ||
          error instanceof zxing.FormatException
        )) {
          fail('Hubo un error de lectura. Volvé a intentar o ingresá el código manualmente.')
        }
      })

      if (session.closed) {
        controls.stop()
        return
      }

      attempt.controls = controls
      setTorchAvailable(Boolean(controls.switchTorch))
      setState({ kind: 'active' })
      timeout = window.setTimeout(() => fail('No se detectó un código. Probá con más luz, ajustá la distancia hasta ver las barras nítidas o ingresalo manualmente.'), scanTimeoutMs)
    } catch (error) {
      fail(cameraError(error))
    }
  }

  async function toggleTorch() {
    const attempt = current.current
    const controls = attempt?.controls
    if (!controls?.switchTorch) return
    try {
      await controls.switchTorch(!torchOn)
      if (current.current === attempt) {
        setTorchOn(!torchOn)
        setTorchError(false)
      }
    } catch {
      if (current.current === attempt) setTorchError(true)
    }
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    stop()
    const barcode = String(new FormData(event.currentTarget).get('barcode')).trim()
    showResult(barcode)
  }

  function stop() {
    current.current?.stop()
    resetTorch()
    setState({ kind: 'idle' })
  }

  const busy = state.kind === 'starting' || state.kind === 'active'
  const messages = {
    idle: '',
    starting: 'Iniciando cámara…',
    active: 'Buscando un código… Mostrá todas las barras y sus márgenes. Si se ve borroso, alejalo un poco.',
    found: 'Código detectado: ' + (state.kind === 'found' ? state.barcode : ''),
    missing: state.kind === 'missing' ? 'Producto no registrado. Código leído: ' + state.barcode + '.' : '',
    error: state.kind === 'error' ? state.message : '',
  }

  return (
    <>
      <div className="scanner" aria-label="Visor del escáner">
        <div className="camera-preview" ref={preview} />
        <span className="scanner-label">Lector de código de barras</span>
        <button className="flash" type="button" aria-label="Linterna" aria-pressed={busy && torchOn} disabled={!busy || !torchAvailable} onClick={toggleTorch}><Icon name="flash" /></button>
        <div className="scan-guide" aria-hidden="true">
          <div className="scan-line" />
          {state.kind === 'found' && <span className="scan-dot"><Icon name="scanCheck" /></span>}
        </div>
        <span className="scanner-caption">Alineá el código dentro del recuadro</span>
      </div>
      {enabled ? (
        <div className="scanner-actions">
          <p className="scanner-status" role="status">{messages[state.kind]}</p>
          {torchError && busy && <p role="status">No pudimos encender o apagar la linterna.</p>}
          {busy
            ? <button className="button secondary" type="button" onClick={stop}>Detener escaneo</button>
            : <button className="button primary" type="button" onClick={start}>{state.kind === 'idle' ? 'Escanear producto' : 'Volver a escanear'}</button>}
          {(state.kind === 'missing' || state.kind === 'error') && <a className="button white" href="#productos">Buscar por nombre</a>}
        </div>
      ) : <a className="button primary scanner-open" href="#escanear">Escanear producto</a>}
      <div aria-live="polite">{enabled && state.kind === 'found' ? children : null}</div>
      {enabled && (
        <div className="manual">
          <button type="button" aria-expanded={manual} onClick={() => {
            if (!manual) stop()
            setManual(!manual)
          }}>También podés ingresar el código manualmente</button>
          {manual && (
            <form onSubmit={submitManual}>
              <input name="barcode" aria-label="Código de barras" placeholder="Código de barras" inputMode="numeric" pattern="[0-9]{8}|[0-9]{12,13}" title="Ingresá 8, 12 o 13 dígitos" required />
              <button className="button primary" type="submit">Buscar</button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
