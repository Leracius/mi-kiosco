import { useEffect, useRef, useState } from 'react'
import type { Product } from '../catalog/product'

export function ProductActions({ product, onDelete }: { product: Product; onDelete: (product: Product) => void }) {
  return (
    <details className="product-actions">
      <summary aria-label={'Opciones de ' + product.name}>⋯</summary>
      <div className="product-actions-menu">
        <a href={'#editar/' + product.id} onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}>Editar producto</a>
        <button type="button" onClick={(event) => {
          const summary = event.currentTarget.closest('details')?.querySelector('summary')
          summary?.focus()
          summary?.parentElement?.removeAttribute('open')
          onDelete(product)
        }}>Eliminar producto</button>
      </div>
    </details>
  )
}

export function DeleteProductDialog({ product, onCancel, onConfirm }: {
  product: Product
  onCancel: () => void
  onConfirm: (id: string) => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    cancel.current?.focus()
    return () => element?.close()
  }, [])

  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await onConfirm(product.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos eliminar el producto.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <dialog className="delete-dialog" ref={dialog} aria-labelledby="delete-title" aria-describedby="delete-message" onCancel={(event) => {
      event.preventDefault()
      if (!inFlight.current) onCancel()
    }}>
      <h2 id="delete-title">Eliminar producto</h2>
      <p id="delete-message">Vas a eliminar <strong>{product.name}</strong>. Esta acción es definitiva.</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="delete-actions">
        <button ref={cancel} type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancelar</button>
        <button type="button" className="button danger" disabled={busy} onClick={confirm}>{busy ? 'Eliminando…' : 'Eliminar producto'}</button>
      </div>
    </dialog>
  )
}
