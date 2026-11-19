import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findProductByBarcode } from '../src/catalog/findProductByBarcode.ts'
import { sampleProducts } from '../src/catalog/sampleProducts.ts'
import { createScanSession } from '../src/scanner/scanSession.ts'

test('encuentra códigos EAN-13, EAN-8 y UPC-A en el catálogo de ejemplo', () => {
  for (const [barcode, id] of [
    ['7790895000997', 'coca-cola'],
    ['96385074', 'beldent'],
    ['036000291452', 'palitos'],
  ]) {
    assert.equal(findProductByBarcode(sampleProducts, barcode)?.id, id)
  }
})

test('acepta el equivalente UPC-A y EAN-13 en ambos sentidos', () => {
  assert.equal(findProductByBarcode(sampleProducts, '0036000291452')?.id, 'palitos')
  const product = { id: 'example', name: 'Ejemplo', priceInCents: 100, barcode: '0036000291452' }
  assert.equal(findProductByBarcode([product], ' 036000291452 '), product)
})

test('ignora códigos incompletos, inexistentes y equivalencias arbitrarias', () => {
  for (const barcode of ['', '779089', '7790895000998', '36000291452', '000096385074', '0360-00291452']) {
    assert.equal(findProductByBarcode(sampleProducts, barcode), undefined)
  }
})

test('cierra cada sesión una sola vez y permite volver a escanear', () => {
  const attempt = createScanSession()
  assert.equal(attempt.closed, false)
  assert.equal(attempt.close(), true)
  assert.equal(attempt.closed, true)
  assert.equal(attempt.close(), false)
  assert.equal(createScanSession().close(), true)
})
