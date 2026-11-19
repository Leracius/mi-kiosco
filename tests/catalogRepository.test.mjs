import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCatalogRepository } from '../src/catalog/catalogRepository.ts'
import { findProductByBarcode } from '../src/catalog/findProductByBarcode.ts'
import { searchProducts } from '../src/catalog/searchProducts.ts'

const row = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Maní salado',
  price: 1850.5,
  barcode: '036000291452',
  category: null,
  presentation: '80 g',
  is_frequent: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
const config = { url: 'https://example.invalid', key: 'sb_publishable_test' }
const signal = new AbortController().signal

test('carga páginas mediante el SDK y adapta los productos para búsqueda y escáner', async () => {
  let requests = 0
  const repository = createCatalogRepository(config, async (url, init) => {
    requests += 1
    assert.equal(new URL(url).pathname, '/rest/v1/products')
    assert.equal(new Headers(init.headers).get('apikey'), config.key)
    assert.equal(init.method ?? 'GET', 'GET')
    const cursor = new URL(url).searchParams.get('id')
    if (requests === 1) assert.equal(cursor, null)
    else assert.equal(cursor, 'gt.' + row.id)
    return Response.json(cursor ? [] : [row])
  })

  const products = await repository.getProducts(signal)
  assert.equal(requests, 2)
  assert.equal(products[0].priceInCents, 185050)
  assert.equal(products[0].category, undefined)
  assert.equal(products[0].createdAt, row.created_at)
  assert.deepEqual(searchProducts(products, 'MANI'), products)
  assert.equal(findProductByBarcode(products, '0036000291452'), products[0])
  assert.equal(findProductByBarcode(products, '4006381333931'), undefined)
})

test('distingue una respuesta vacía de un fallo de conexión', async () => {
  const empty = createCatalogRepository(config, async () => Response.json([]))
  assert.deepEqual(await empty.getProducts(signal), [])
  const broken = createCatalogRepository(config, async () => { throw new TypeError('offline') })
  await assert.rejects(broken.getProducts(signal), /No se pudo consultar el catálogo/)
})

test('requiere configuración y rechaza una clave privilegiada', () => {
  assert.throws(() => createCatalogRepository({}), /clave publicable/)
  assert.throws(() => createCatalogRepository({ ...config, key: 'sb_secret_test' }), /clave publicable/)
})
