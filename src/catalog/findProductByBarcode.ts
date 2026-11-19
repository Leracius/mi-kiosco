import type { Product } from './product'

function normalizeBarcode(value: string) {
  const barcode = value.trim()
  if (!/^(?:\d{8}|\d{12}|\d{13})$/.test(barcode)) return undefined

  return barcode.length === 13 && barcode.startsWith('0') ? barcode.slice(1) : barcode
}

export function findProductByBarcode(products: readonly Product[], value: string) {
  const barcode = normalizeBarcode(value)
  if (barcode === undefined) return undefined

  return products.find((product) =>
    product.barcode !== undefined && normalizeBarcode(product.barcode) === barcode,
  )
}
