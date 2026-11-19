import { ProductActions } from '../admin/ProductActions'
import chevron from './chevron.svg'
import { formatPrice } from './formatPrice'

import type { Product } from './product'

export function ProductCatalog({ products, onDelete }: { products: readonly Product[]; onDelete?: (product: Product) => void }) {
  return (
    <ul className="product-list" role="list">
      {products.map((product) => (
        <li key={product.id} className={onDelete ? 'managed-row' : undefined}>
          <a className="product-row" href={'#producto/' + product.id}>
            <div className="product-row__details">
              <p className="product-row__name">{product.name}</p>
              <p className="product-row__metadata">
                {[product.presentation, product.category].filter(Boolean).join(' · ')}
              </p>
              <p className="product-row__price">{formatPrice(product.priceInCents)}</p>
            </div>
            <img src={chevron} alt="" width="17" height="17" />
          </a>
          {onDelete && <ProductActions product={product} onDelete={onDelete} />}
        </li>
      ))}
    </ul>
  )
}
