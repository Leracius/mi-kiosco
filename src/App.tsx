import { useEffect, useState } from 'react'
import { Catalog } from './catalog/Catalog'
import { sampleProducts } from './catalog/sampleProducts'
import type { Product } from './catalog/product'
import { PriceEditor, ProductForm, ScanResult } from './KioskPanels'
import { Scanner } from './scanner/Scanner'
import { findProductByBarcode } from './catalog/findProductByBarcode'
import { Icon, type IconName } from './Icon'

const tabs: { path: string; label: string; icon: IconName }[] = [
  { path: 'escanear', label: 'Escanear', icon: 'scan' },
  { path: 'productos', label: 'Productos', icon: 'grid' },
  { path: 'agregar', label: 'Agregar', icon: 'plus' },
]

const initialProducts = [...sampleProducts]

function readRoute() {
  return window.location.hash.slice(1) || 'productos'
}

export function App() {
  const [route, setRoute] = useState(readRoute)
  const [products, setProducts] = useState(initialProducts)
  const [selectedId, setSelectedId] = useState(initialProducts[0].id)
  const [scannedId, setScannedId] = useState('')
  const product = products.find((item) => item.id === selectedId) ?? products[0]
  const scannedProduct = products.find((item) => item.id === scannedId)
  const [page, productId] = route.split('/')
  const editing = products.find((item) => item.id === productId)
  const detail = page === 'producto' ? editing : undefined
  const detailPage = page === 'producto'
  const adding = page === 'agregar'
  const editingPrice = page === 'precio' && editing !== undefined
  const formPage = adding || editingPrice
  const scanning = page === 'escanear'
  const title = detailPage ? 'Tus productos' : adding ? 'Nuevo producto' : editingPrice ? 'Modificar precio' : scanning ? 'Escaneá y listo.' : 'Tus productos'
  const subtitle = adding ? 'Sumá un producto a tu catálogo.' : editingPrice ? 'Un cambio rápido. Todo actualizado.' : scanning ? 'Consultá precios en un instante.' : 'Todo tu kiosco, en un solo lugar.'

  useEffect(() => {
    function onHashChange() {
      setRoute(readRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.getElementById('page-title')?.focus({ preventScroll: true })
  }, [route])

  function updatePrice(id: string, priceInCents: number) {
    setProducts((items) => items.map((item) => item.id === id ? { ...item, priceInCents } : item))
    setSelectedId(id)
  }

  function findBarcode(barcode: string) {
    const match = findProductByBarcode(products, barcode)
    setScannedId(match?.id ?? '')
    if (match) setSelectedId(match.id)
    return Boolean(match)
  }

  function saveProduct(values: Omit<Product, 'id'>) {
    const newProduct = { ...values, id: crypto.randomUUID() }
    setProducts((items) => [newProduct, ...items])
    setSelectedId(newProduct.id)
    window.location.hash = 'productos'
  }

  function navigation(items: typeof tabs, className: string) {
    return (
      <nav className={className} aria-label="Navegación principal">
        {items.map((tab) => {
          const active = tab.path === (scanning ? 'escanear' : 'productos')
          return (
            <a key={tab.path} href={'#' + tab.path} aria-current={active ? 'page' : undefined}>
              <Icon name={tab.icon} /> {tab.label}
            </a>
          )
        })}
      </nav>
    )
  }

  return (
    <div className={formPage ? 'app app--form' : 'app'}>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#productos">kiosco<span>●</span></a>
          {navigation([tabs[1], tabs[0]], 'desktop-nav')}
          <span className="online" title="Estado simulado para la demostración"><span aria-hidden="true">●</span> En línea</span>
        </div>
      </header>
      <main className="shell">
        <header className="page-heading">
          {detailPage && <a className="back detail-back" href="#productos" aria-label="Volver a la búsqueda"><Icon name="back" /></a>}
          {formPage && <a className="back" href="#productos" aria-label="Volver a productos"><Icon name="back" /></a>}
          <h1 id="page-title" tabIndex={-1}>{title}</h1>
          <p>{subtitle}</p>
          {!formPage && !detailPage && <a className="button primary desktop-add" href="#agregar">+ Agregar producto</a>}
        </header>
        {adding && <ProductForm key={route} scanned={productId === 'codigo'} products={products} onSave={saveProduct} />}
        {editingPrice && (
          <PriceEditor key={editing.id} product={editing} onSave={(value) => {
            updatePrice(editing.id, value)
            window.location.hash = 'productos'
          }} />
        )}
        {detailPage && (
          detail
            ? <div className="product-detail"><ScanResult product={detail} readOnly /></div>
            : <p className="empty" role="status">No encontramos ese producto.</p>
        )}
        <div hidden={formPage || detailPage}>
          <div className={'workspace ' + (scanning ? 'workspace--scan' : 'workspace--catalog')}>
            <aside className="scanner-column" aria-label="Escáner de productos">
              <h2 className="scanner-heading">Escaneá y listo.</h2>
              <Scanner key={scanning ? 'scan' : 'idle'} enabled={scanning} onLookup={findBarcode}>
                {scannedProduct && <ScanResult product={scannedProduct} readOnly />}
              </Scanner>
              {!scanning && <div className="desktop-result">
                <PriceEditor key={product.id} product={product} compact onSave={(value) => updatePrice(product.id, value)} />
              </div>}
            </aside>
            <Catalog products={products} selectedId={product.id} onSelect={setSelectedId} />
          </div>
        </div>
      </main>
      {!formPage && navigation(tabs, 'mobile-nav')}
    </div>
  )
}
