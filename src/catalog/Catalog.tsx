import { useState } from 'react'
import { ProductActions } from '../admin/ProductActions'
import { formatPrice } from './formatPrice'
import { Icon } from '../Icon'
import { ProductCatalog } from './ProductCatalog'
import type { Product } from './product'
import { searchProducts } from './searchProducts'

type Props = {
  products: readonly Product[]
  selectedId?: string
  onDelete?: (product: Product) => void
  onSelect: (id: string) => void
}

export function Catalog({ products, selectedId, onSelect, onDelete }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [order, setOrder] = useState('recent')
  const categories = ['Todos', ...new Set(products.flatMap((product) => product.category ? [product.category] : []))]
  const visible = searchProducts(products, query).filter((product) =>
    category === 'Todos' || product.category === category,
  )
  if (order !== 'recent') {
    visible.sort((a, b) => a.name.localeCompare(b.name, 'es-AR') * (order === 'az' ? 1 : -1))
  }
  const count = visible.length + (visible.length === 1 ? ' producto' : ' productos')

  return (
    <section className="catalog-column" aria-label="Catálogo de productos">
      <div className="catalog-controls">
        <h2 className="table-title">Catálogo de productos <span>{visible.length}</span></h2>
        <div className="catalog-search">
          <label className="input-icon">
            <Icon name="search" />
            <input type="search" aria-label="Nombre o código de barras" placeholder="Nombre o código de barras" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label className="sort-desktop select-icon">
            <select aria-label="Orden del catálogo" value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="recent">Ordenar: más recientes</option>
              <option value="az">Ordenar: A–Z</option>
              <option value="za">Ordenar: Z–A</option>
            </select>
            <Icon name="down" />
          </label>
        </div>
        <div className="filters" aria-label="Filtrar por categoría" role="group">
          {categories.map((item) => (
            <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="mobile-count">
          <span role="status">{count}</span>
          <button type="button" onClick={() => setOrder(order === 'az' ? 'za' : 'az')} aria-label="Cambiar orden alfabético">
            {order === 'za' ? 'Z–A ↑' : 'A–Z ↓'}
          </button>
        </div>
      </div>
      {visible.length === 0 && <p className="empty" role="status">{products.length ? 'No encontramos productos.' : 'El catálogo todavía no tiene productos.'}</p>}
      <div className="mobile-catalog">
        <ProductCatalog products={visible} onDelete={onDelete} />
        {onDelete && <a className="button primary add-action" href="#agregar">+ Agregar producto</a>}
      </div>
      <div className="desktop-catalog">
        <table>
          <thead><tr><th scope="col">Producto</th><th scope="col">Presentación</th><th scope="col">Categoría</th><th scope="col">Precio de venta</th><th scope="col">Acción</th></tr></thead>
          <tbody>
            {visible.map((product) => (
              <tr key={product.id} className={product.id === selectedId ? 'selected' : undefined}>
                <th scope="row"><a className="product-link" href={'#producto/' + product.id}>{product.name}</a></th>
                <td>{product.presentation}</td>
                <td>{product.category && <span className="category">{product.category}</span>}</td>
                <td className="table-price">{formatPrice(product.priceInCents)}</td>
                <td><div className="row-actions"><button className="button table-action" type="button" aria-label={'Ver precio de ' + product.name} onClick={() => onSelect(product.id)}>Ver precio</button>{onDelete && <ProductActions product={product} onDelete={onDelete} />}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span role="status">Mostrando {visible.length ? '1–' + visible.length : 0} de {products.length} productos</span>
          <div className="pagination" aria-label="Página 1 de 1"><span>1</span><button type="button" disabled aria-label="Página siguiente"><Icon name="next" /></button></div>
          <p>Seleccioná un producto para consultar su precio en el panel izquierdo.</p>
        </div>
      </div>
    </section>
  )
}
