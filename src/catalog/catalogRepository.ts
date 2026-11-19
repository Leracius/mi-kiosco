import { createClient } from '@supabase/supabase-js'
import type { Product } from './product'
import { editFields, toDatabasePrice, type ProductInput } from './productInput.ts'

type ProductRow = {
  id: string
  name: string
  price: number
  barcode: string | null
  category: string | null
  presentation: string | null
  is_frequent: boolean
  created_at: string
  updated_at: string
}

const columns = 'id,name,price,barcode,category,presentation,is_frequent,created_at,updated_at'
const pageSize = 500

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    priceInCents: Math.round(row.price * 100),
    barcode: row.barcode ?? undefined,
    category: row.category ?? undefined,
    presentation: row.presentation ?? undefined,
    isFrequent: row.is_frequent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mutationError(error: { code?: string }) {
  if (error.code === '23505') return new Error('Ya existe un producto con ese código de barras.')
  if (error.code === '42501') return new Error('Tu cuenta no tiene permiso para modificar el catálogo.')
  return new Error('Supabase no pudo guardar el cambio. Revisá la conexión y reintentá.')
}

export function createCatalogRepository(
  { url, key }: { url?: string; key?: string },
  fetchCatalog?: typeof fetch,
  adminSession = false,
) {
  if (!url || !key?.startsWith('sb_publishable_')) {
    throw new Error('Configurá la URL de Supabase y su clave publicable para consultar el catálogo.')
  }

  const client = createClient(url, key, {
    auth: { persistSession: adminSession, autoRefreshToken: adminSession, detectSessionInUrl: false, storageKey: adminSession ? 'mi-kiosco-admin' : undefined },
    global: { fetch: fetchCatalog },
  })

  return {
    auth: client.auth,
    async createProduct(input: ProductInput) {
      const { data, error } = await client.from('products').insert(editFields(input))
        .select(columns).single().returns<ProductRow>()
      if (error) throw mutationError(error)
      return toProduct(data)
    },
    async updateProduct(id: string, input: ProductInput | { priceInCents: number }) {
      const fields = 'name' in input ? editFields(input) : { price: toDatabasePrice(input.priceInCents) }
      const { data, error } = await client.from('products').update(fields).eq('id', id)
        .select(columns).maybeSingle().returns<ProductRow | null>()
      if (error) throw mutationError(error)
      if (!data) throw new Error('El producto ya no existe o tu cuenta no tiene permiso para editarlo.')
      return toProduct(data)
    },
    async deleteProduct(id: string) {
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('Identificador de producto inválido.')
      }
      const { data, error } = await client.from('products').delete().eq('id', id).select('id').maybeSingle()
      if (error) throw mutationError(error)
      if (data?.id !== id) throw new Error('El producto ya no existe o tu cuenta no tiene permiso para eliminarlo.')
    },
    async getProducts(signal: AbortSignal): Promise<Product[]> {
      const products: Product[] = []
      let after: string | undefined

      do {
        let query = client.from('products').select(columns).order('id').limit(pageSize)
        if (after) query = query.gt('id', after)
        const { data, error } = await query.abortSignal(signal).returns<ProductRow[]>()
        if (error) throw new Error('No se pudo consultar el catálogo.', { cause: error })
        if (!data.length) break

        for (const row of data) {
          products.push(toProduct(row))
        }
        after = data.at(-1)?.id
      } while (after)

      return products.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    },
  }
}
