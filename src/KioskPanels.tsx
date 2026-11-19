import { useState, type FormEvent } from 'react'
import { formatPrice } from './catalog/formatPrice'
import { Icon } from './Icon'
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
          {readOnly && product.barcode && <p>Código de barras: {product.barcode}</p>}
          <div className="result-action">
            <strong>{formatPrice(product.priceInCents)}</strong>
            {!readOnly && <a className="button secondary" href={'#precio/' + product.id}><Icon name="edit" /> Editar precio</a>}
          </div>
        </section>
      )}
      {!readOnly && (
        <div className="scan-add">
          <p>¿No está en tu catálogo?</p>
          <a className="button white" href="#agregar/codigo">+ Agregar producto</a>
        </div>
      )}
    </>
  )
}

function parsePrice(value: string) {
  const text = value.trim()
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null
  const cents = Math.round(Number(text.replaceAll('.', '').replace(',', '.')) * 100)
  return Number.isSafeInteger(cents) ? cents : null
}

function suggestedPrice(cents: number) {
  return formatPrice(cents).slice(2)
}

export function PriceEditor({ product, compact = false, onSave }: { product: Product; compact?: boolean; onSave: (cents: number) => void }) {
  const [draft, setDraft] = useState(suggestedPrice(product.priceInCents + (product.id === 'coca-cola' && product.priceInCents === 150_000 ? 20_000 : 0)))
  const [status, setStatus] = useState('')
  const next = parsePrice(draft)
  const delta = next === null ? null : next - product.priceInCents
  const percentage = delta !== null && product.priceInCents > 0
    ? new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(delta / product.priceInCents)
    : null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (next === null) return
    onSave(next)
    setStatus('Precio actualizado en la demostración.')
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
          <input inputMode="decimal" required value={draft} onChange={(event) => { setDraft(event.target.value); setStatus('') }} aria-invalid={next === null && draft !== ''} />
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
        <button className="button primary" type="submit" disabled={next === null}>Guardar nuevo precio</button>
      </div>
      {compact && status && <p className="form-status" role="status">{status}</p>}
    </form>
  )
}

export function ProductForm({ scanned, products, onSave }: {
  scanned: boolean
  products: readonly Product[]
  onSave: (values: Omit<Product, 'id'>) => void
}) {
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const read = (name: string) => String(fields.get(name) ?? '').trim()
    const barcode = read('barcode')
    const name = read('name')
    const priceInCents = parsePrice(read('price'))
    if (!name || priceInCents === null) {
      setError('Ingresá un nombre y un precio válido.')
      return
    }
    if (barcode && products.some((product) => product.barcode === barcode)) {
      setError('Ya existe un producto con ese código de barras.')
      return
    }
    onSave({ barcode: barcode || undefined, name, category: read('category'), presentation: read('presentation'), priceInCents })
  }

  return (
    <form className="new-product" onSubmit={submit} onChange={() => setError('')}>
      {scanned && <Badge>Código escaneado</Badge>}
      <div className="field">
        <label htmlFor="new-barcode">Código de barras</label>
        <span className="input-icon">
          <input id="new-barcode" name="barcode" inputMode="numeric" pattern="[0-9]+" defaultValue={scanned ? '7790310981214' : ''} />
          <a href="#escanear" aria-label="Volver a escanear"><Icon name="scan" /></a>
        </span>
        <small>Podés editarlo o volver a escanear.</small>
      </div>
      <label className="field">Nombre del producto *
        <input name="name" placeholder="Galletitas Oreo Original" required />
      </label>
      <label className="field">Categoría *
        <span className="select-icon">
          <select name="category" defaultValue="" required>
            <option value="" disabled>Elegí una categoría</option>
            <option>Bebidas</option><option>Golosinas</option><option>Snacks</option>
          </select>
          <Icon name="down" />
        </span>
      </label>
      <div className="field-pair">
        <label className="field">Precio de venta *
          <span className="money-input"><span aria-hidden="true">$</span><input name="price" placeholder="1.200" inputMode="decimal" required /></span>
        </label>
        <label className="field">Presentación<input name="presentation" placeholder="118 g" /></label>
      </div>
      <div className="form-note"><Icon name="info" /><div><strong>Listo para la próxima consulta</strong><p>Se encontrará al escanear este código.</p></div></div>
      <p className="required">* Campos obligatorios</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-footer"><button className="button primary" type="submit">Guardar producto</button></div>
    </form>
  )
}
