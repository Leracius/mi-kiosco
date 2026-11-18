import type { Product } from './product'

function normalizeSearch(text: string) {
  return text.trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{M}/gu, '')
}

export function searchProducts(products: readonly Product[], query: string) {
  const term = normalizeSearch(query)
  if (!term) return [...products]

  return products.filter((product) =>
    normalizeSearch(product.name).includes(term) || product.barcode?.includes(term),
  )
}
