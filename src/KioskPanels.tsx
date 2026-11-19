import { useRef, useState, type FormEvent } from 'react'
import { formatPrice } from './catalog/formatPrice'
import { Icon } from './Icon'
import { parsePrice, type ProductInput } from './catalog/productInput'
import type { Product } from './catalog/product'

function Badge({ children }: { children: string }) {
  return <span className="badge"><Icon name="check" /> {children}</span>
}

export function ScanResult({ product, readOnly = false }: { product?: Product; readOnly?: boolean }) {
  return (
    <>
      {product && (
        <section className="scan-result" aria-label="Producto encontrado">
          <Badge>Producto encontrado</Badge>
          <h2>{product.name}</h2>
          <p>{[product.presentation, product.category].filter(Boolean).join(' · ')}</p>
          {product.barcode && <p>Código de barras: {product.barcode}</p>}
          <div className="result-action">
            <strong>{formatPrice(product.priceInCents)}</strong>
            {!readOnly && <a className="button secondary" href={'#precio/' + product.id}><Icon name="edit" /> Editar precio</a>}
          </div>
        </section>
      )}
    </>
  )
}

function useSave() {
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function save(action: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError('')
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos guardar los cambios.')
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return { save, pending, error, setError }
}

function suggestedPrice(cents: number) {
  return formatPrice(cents).slice(2)
}

export function PriceEditor({ product, compact = false, onSave }: { product: Product; compact?: boolean; onSave: (cents: number) => Promise<void> }) {
  const [draft, setDraft] = useState(suggestedPrice(product.priceInCents))
  const { save, pending, error, setError } = useSave()
  const next = parsePrice(draft)
  const delta = next === null ? null : next - product.priceInCents
  const percentage = delta !== null && product.priceInCents > 0
    ? new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(delta / product.priceInCents)
    : null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (next === null) return
    void save(() => onSave(next))
  }

  return (
    <form className={compact ? 'price-form price-form--compact' : 'price-form'} onSubmit={submit}>
      {compact && <Badge>Producto encontrado</Badge>}
      <div className="product-identity">
        {!compact && <span className="product-icon"><Icon name="scan" /></span>}
        <div>
          <h2>{product.name}</h2>
          <p>{[product.presentation, product.category].filter(Boolean).join(' · ')}</p>
        </div>
        {!compact && product.barcode && <p className="identity-code">{product.barcode}</p>}
      </div>
      <div className="current-price"><span>Precio actual</span><strong>{formatPrice(product.priceInCents)}</strong></div>
      <label className="field">
        Nuevo precio de venta {!compact && '*'}
        <span className="money-input">
          <span aria-hidden="true">$</span>
          <input inputMode="decimal" required value={draft} onChange={(event) => { setDraft(event.target.value); setError('') }} aria-invalid={next === null && draft !== ''} />
        </span>
      </label>
      {delta !== null && (
        <p className="price-difference">{delta > 0 ? '+ ' : delta < 0 ? '− ' : ''}{formatPrice(Math.abs(delta))}{percentage && '  (' + percentage + ')'}</p>
      )}
      {next === null && draft !== '' && <p className="field-error">Ingresá un importe válido, por ejemplo 1.700,50.</p>}
      {!compact && (
        <>
          <div className="price-summary">
            <p>Así quedará el precio</p>
            <span>{formatPrice(product.priceInCents)}</span><span aria-hidden="true">→</span><strong>{next === null ? '—' : formatPrice(next)}</strong>
          </div>
          <p className="form-help"><Icon name="info" /> <span>El cambio se aplica al guardar.<br />No modifica el resto del producto.</span></p>
        </>
      )}
      <div className={compact ? undefined : 'form-footer'}>
        <button className="button primary" type="submit" disabled={pending || next === null || next === product.priceInCents}>{pending ? 'Guardando…' : 'Guardar nuevo precio'}</button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  )
}

export function ProductForm({ product, scannedBarcode, onSave }: {
  product?: Product
  scannedBarcode?: string
  onSave: (values: ProductInput) => Promise<void>
}) {
  const { save, pending, error, setError } = useSave()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const read = (name: string) => String(fields.get(name) ?? '').trim()
    const name = read('name')
    const priceInCents = parsePrice(read('price'))
    if (!name || priceInCents === null) {
      setError('Ingresá un nombre y un precio válido.')
      return
    }
    void save(() => onSave({
      barcode: read('barcode') || undefined,
      name,
      category: read('category') || undefined,
      presentation: read('presentation') || undefined,
      priceInCents,
    }))
  }

  return (
    <form className="new-product" onSubmit={submit} onChange={() => setError('')}>
      <div className="field">
        <label htmlFor="new-barcode">Código de barras</label>
        <span className="input-icon">
          <input id="new-barcode" name="barcode" inputMode="numeric" pattern="[0-9]{8}|[0-9]{12,13}" title="Ingresá 8, 12 o 13 dígitos" defaultValue={product?.barcode ?? scannedBarcode} />
        </span>
        <small>{scannedBarcode ? 'Código tomado del lector. Podés corregirlo antes de guardar.' : 'Opcional. Ingresá 8, 12 o 13 dígitos.'}</small>
      </div>
      <label className="field">Nombre del producto *
        <input name="name" defaultValue={product?.name} maxLength={120} required />
      </label>
      <label className="field">Categoría<input name="category" defaultValue={product?.category} /></label>
      <div className="field-pair">
        <label className="field">Precio de venta *
          <span className="money-input"><span aria-hidden="true">$</span><input name="price" placeholder="1.200" inputMode="decimal" defaultValue={product ? suggestedPrice(product.priceInCents) : undefined} required /></span>
        </label>
        <label className="field">Presentación<input name="presentation" defaultValue={product?.presentation} /></label>
      </div>
      <p className="required">* Campos obligatorios</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-footer"><button className="button primary" type="submit" disabled={pending}>{pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Guardar producto'}</button></div>
    </form>
  )
}
