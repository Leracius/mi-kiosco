import type { Product } from './product'

export type ProductInput = Pick<Product, 'name' | 'barcode' | 'category' | 'presentation' | 'priceInCents'>

const maxCents = 999_999_999_999

export function parsePrice(value: string) {
  const text = value.trim()
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null
  const [whole, fractions = ''] = text.replaceAll('.', '').split(',')
  const cents = Number(whole) * 100 + Number(fractions.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= maxCents ? cents : null
}

export function editFields(values: ProductInput) {
  const name = values.name.trim()
  const barcode = values.barcode?.trim()
  if (!name || name.length > 120) throw new Error('Ingresá un nombre de hasta 120 caracteres.')
  if (barcode && !/^(?:\d{8}|\d{12}|\d{13})$/.test(barcode)) {
    throw new Error('El código de barras debe tener 8, 12 o 13 dígitos.')
  }
  return {
    name,
    price: toDatabasePrice(values.priceInCents),
    barcode: barcode || null,
    category: values.category?.trim() || null,
    presentation: values.presentation?.trim() || null,
  }
}

export function toDatabasePrice(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > maxCents) throw new Error('Ingresá un precio válido.')
  return (cents / 100).toFixed(2)
}
