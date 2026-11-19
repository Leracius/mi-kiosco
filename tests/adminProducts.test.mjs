import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCatalogRepository } from '../src/catalog/catalogRepository.ts'
import { editFields, parsePrice } from '../src/catalog/productInput.ts'

const id = '00000000-0000-4000-8000-000000000010'
const config = { url: 'https://example.invalid', key: 'sb_publishable_test' }
const input = { name: ' Producto ', priceInCents: 185050, barcode: '036000291452' }
const row = {
  id, name: 'Producto', price: 1850.5, barcode: '036000291452', category: null,
  presentation: null, is_frequent: false, created_at: '2026-01-01', updated_at: '2026-01-01',
}

test('elimina solo por UUID y verifica que Supabase devuelva la fila eliminada', async () => {
  let requests = 0
  const repo = createCatalogRepository(config, async (url, request) => {
    requests += 1
    assert.equal(request.method, 'DELETE')
    assert.deepEqual(Object.fromEntries(new URL(url).searchParams), { id: 'eq.' + id, select: 'id' })
    return Response.json([{ id }])
  })
  await assert.rejects(repo.deleteProduct(''), /inválido/)
  await repo.deleteProduct(id)
  assert.equal(requests, 1)
})

test('distingue eliminación rechazada, fila ausente y error de Supabase', async () => {
  for (const [response, message] of [
    [Response.json([], { status: 200 }), /ya no existe/],
    [Response.json({ code: '42501' }, { status: 403 }), /no tiene permiso/],
    [Response.json({ code: 'XX000' }, { status: 400 }), /reintentá/],
  ]) {
    const repo = createCatalogRepository(config, async () => response)
    await assert.rejects(repo.deleteProduct(id), message)
  }
})

test('guarda productos y permite editar solo el precio sin tocar otros campos', async () => {
  const repo = createCatalogRepository(config, async (url, request) => {
    const body = JSON.parse(request.body)
    if (request.method === 'POST') {
      assert.deepEqual(body, { name: 'Producto', category: null, presentation: null, price: '1850.50', barcode: '036000291452' })
      return Response.json(row)
    }
    assert.equal(request.method, 'PATCH')
    assert.deepEqual(body, { price: '1999.95' })
    assert.equal(new URL(url).searchParams.get('id'), 'eq.' + id)
    return Response.json([{ ...row, price: 1999.95 }])
  })
  assert.equal((await repo.createProduct(input)).priceInCents, 185050)
  assert.equal((await repo.updateProduct(id, { priceInCents: 199995 })).priceInCents, 199995)
})

test('valida nombres, precios y códigos sin perder ceros iniciales', () => {
  assert.equal(parsePrice('1.850,50'), 185050)
  assert.equal(parsePrice('9.999.999.999,99'), 999999999999)
  assert.equal(parsePrice('10.000.000.000'), null)
  assert.equal(parsePrice('-1'), null)
  assert.equal(editFields(input).barcode, '036000291452')
  assert.throws(() => editFields({ ...input, name: ' ' }), /nombre/)
  assert.throws(() => editFields({ ...input, barcode: '123' }), /dígitos/)
})
