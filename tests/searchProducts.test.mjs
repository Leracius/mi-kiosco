import assert from 'node:assert/strict'
import { test } from 'node:test'
import { searchProducts } from '../src/catalog/searchProducts.ts'
import { formatPrice } from '../src/catalog/formatPrice.ts'

const products = [
  { id: '1', name: 'Alfajor Guaymallén', priceInCents: 80000, barcode: '0123456789012' },
  { id: '2', name: 'Maní salado', priceInCents: 170000, category: 'Snacks' },
]

test('encuentra un nombre existente', () => {
  assert.deepEqual(searchProducts(products, 'Alfajor Guaymallén'), [products[0]])
})

test('encuentra coincidencias parciales', () => {
  assert.deepEqual(searchProducts(products, 'salad'), [products[1]])
})

test('ignora mayúsculas, tildes y espacios externos', () => {
  for (const query of ['  GUAYMALLEN  ', 'guaymallén', 'Guaymalle\u0301n']) {
    assert.deepEqual(searchProducts(products, query), [products[0]])
  }
})

test('devuelve una lista vacía si no hay coincidencias', () => {
  assert.deepEqual(searchProducts(products, 'yerba'), [])
})

test('devuelve el catálogo en su orden original si la búsqueda está vacía', () => {
  const result = searchProducts(products, ' ')
  assert.deepEqual(result, products)
  assert.notEqual(result, products)
})

test('encuentra códigos como texto y admite productos sin código', () => {
  assert.deepEqual(searchProducts(products, '01234'), [products[0]])
})

test('formatea pesos argentinos con miles y centavos cuando corresponde', () => {
  assert.equal(formatPrice(150000), '$ 1.500')
  assert.equal(formatPrice(185050), '$ 1.850,50')
})
