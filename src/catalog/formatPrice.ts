const priceFormat = new Intl.NumberFormat('es-AR', {
  useGrouping: 'always',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
})

export function formatPrice(cents: number) {
  return '$ ' + priceFormat.format(cents / 100)
}
