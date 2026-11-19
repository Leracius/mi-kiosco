import { useEffect, useState } from 'react'
import { createCatalogRepository } from './catalogRepository'
import type { Product } from './product'

type CatalogState =
  | { kind: 'loading' }
  | { kind: 'configuration'; message: string }
  | { kind: 'error' }
  | { kind: 'ready'; products: Product[] }

export function useCatalog() {
  const [state, setState] = useState<CatalogState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      let repository
      try {
        repository = createCatalogRepository({
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        })
      } catch {
        setState({
          kind: 'configuration',
          message: 'Configurá la URL de Supabase y su clave publicable para consultar el catálogo.',
        })
        return
      }

      try {
        const products = await repository.getProducts(controller.signal)
        if (!controller.signal.aborted) setState({ kind: 'ready', products })
      } catch {
        if (!controller.signal.aborted) setState({ kind: 'error' })
      }
    }

    void load()
    return () => controller.abort()
  }, [attempt])

  return {
    state,
    saveLocally(product: Product) {
      setState((current) => {
        if (current.kind !== 'ready') return current
        const found = current.products.some((item) => item.id === product.id)
        return {
          kind: 'ready',
          products: found
            ? current.products.map((item) => item.id === product.id ? product : item)
            : [product, ...current.products],
        }
      })
    },
    removeLocally(id: string) {
      setState((current) => current.kind === 'ready'
        ? { kind: 'ready', products: current.products.filter((item) => item.id !== id) }
        : current)
    },
    retry() {
      setState({ kind: 'loading' })
      setAttempt((value) => value + 1)
    },
  }
}
