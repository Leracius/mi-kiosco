import { useEffect, useState } from 'react'
import { Catalog } from './catalog/Catalog'
import { findProductByBarcode } from './catalog/findProductByBarcode'
import { useCatalog } from './catalog/useCatalog'
import { useAdmin } from './admin/useAdmin'
import { AdminAccess } from './admin/AdminAccess'
import { DeleteProductDialog } from './admin/ProductActions'
import type { Product } from './catalog/product'
import type { ProductInput } from './catalog/productInput'
import { PriceEditor, ProductForm, ScanResult } from './KioskPanels'
import { Scanner } from './scanner/Scanner'
import { Icon, type IconName } from './Icon'
import { InstallApp } from './InstallApp'

const tabs: { path: string; label: string; icon: IconName }[] = [
  { path: 'escanear', label: 'Escanear', icon: 'scan' },
  { path: 'productos', label: 'Productos', icon: 'grid' },
  { path: 'agregar', label: 'Agregar', icon: 'plus' },
]

function readRoute() {
  return window.location.hash.slice(1) || 'productos'
}

export function App() {
  const [route, setRoute] = useState(readRoute)
  const [selectedId, setSelectedId] = useState('')
  const [scannedId, setScannedId] = useState('')
  const { state, retry, saveLocally, removeLocally } = useCatalog()
  const { repository, session, ready, isAdmin } = useAdmin()
  const [deleteTarget, setDeleteTarget] = useState<Product>()
  const [notice, setNotice] = useState('')
  const products = state.kind === 'ready' ? state.products : []
  const selected = products.find((item) => item.id === selectedId) ?? products[0]
  const scanned = products.find((item) => item.id === scannedId)
  const [page, productId] = route.split('/')
  const scannedBarcode = page === 'agregar' && productId && /^(?:\d{8}|\d{12}|\d{13})$/.test(productId)
    ? productId
    : undefined
  const adminPage = page === 'admin'
  const formPage = adminPage || page === 'agregar' || page === 'precio' || page === 'editar'
  const editing = products.find((item) => item.id === productId)
  const detailPage = page === 'producto'
  const detail = detailPage ? products.find((item) => item.id === productId) : undefined
  const scanning = page === 'escanear'
  const title = adminPage ? 'Administración' : page === 'editar' ? 'Editar producto' : page === 'agregar' ? 'Nuevo producto' : page === 'precio' ? 'Modificar precio' : scanning ? 'Escaneá y listo.' : 'Tus productos'
  const subtitle = scanning ? 'Consultá precios en un instante.' : 'Todo tu kiosco, en un solo lugar.'

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

  function findBarcode(barcode: string) {
    const match = findProductByBarcode(products, barcode)
    setScannedId(match?.id ?? '')
    if (match) setSelectedId(match.id)
    return Boolean(match)
  }

  function adminRepository() {
    if (!repository || !isAdmin) throw new Error('Necesitás una sesión de administración activa.')
    return repository
  }

  async function saveProduct(values: ProductInput) {
    const admin = adminRepository()
    const product = page === 'editar' && editing
      ? await admin.updateProduct(editing.id, values)
      : await admin.createProduct(values)
    saveLocally(product)
    setNotice(page === 'editar' ? 'Producto actualizado.' : 'Producto agregado.')
    window.location.hash = 'productos'
  }

  async function savePrice(cents: number) {
    if (!editing) return
    const product = await adminRepository().updateProduct(editing.id, { priceInCents: cents })
    saveLocally(product)
    setNotice('Precio actualizado.')
    window.location.hash = 'productos'
  }

  async function deleteProduct(id: string) {
    await adminRepository().deleteProduct(id)
    removeLocally(id)
    setDeleteTarget(undefined)
    setNotice('Producto eliminado.')
    document.getElementById('page-title')?.focus({ preventScroll: true })
  }

  function navigation(items: typeof tabs, className: string) {
    const activePage = scanning ? 'escanear' : formPage ? page : 'productos'
    return (
      <nav className={className} aria-label="Navegación principal">
        {items.filter((tab) => isAdmin || tab.path !== 'agregar').map((tab) => (
          <a key={tab.path} href={'#' + tab.path} aria-current={tab.path === activePage ? 'page' : undefined}>
            <Icon name={tab.icon} /> {tab.label}
          </a>
        ))}
      </nav>
    )
  }

  return (
    <div className={formPage ? 'app app--form' : 'app'}>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#productos">kiosco<span>●</span></a>
          {navigation([tabs[1], tabs[0]], 'desktop-nav')}
          <a className="admin-link" href="#admin">{isAdmin ? 'Administración' : 'Acceso admin'}</a>
          {state.kind === 'ready' && <span className="online"><span aria-hidden="true">●</span> En línea</span>}
        </div>
      </header>
      <main className="shell">
        <header className="page-heading">
          {(detailPage || formPage) && <a className="back detail-back" href="#productos" aria-label="Volver a la búsqueda"><Icon name="back" /></a>}
          <h1 id="page-title" tabIndex={-1}>{title}</h1>
          {!formPage && <p>{subtitle}</p>}
          <div hidden={formPage || detailPage}><InstallApp /></div>
          {isAdmin && !formPage && !detailPage && !scanning && <a className="button primary desktop-add" href="#agregar">+ Agregar producto</a>}
        </header>
        {notice && !formPage && <p className="catalog-notice" role="status">{notice}</p>}
        {adminPage && <AdminAccess auth={repository?.auth} ready={ready} signedIn={Boolean(session)} isAdmin={isAdmin} />}
        {formPage && !adminPage && !isAdmin && (
          <p className="empty">Para modificar el catálogo, <a href="#admin">iniciá sesión como administrador</a>.</p>
        )}
        {formPage && !adminPage && isAdmin && state.kind === 'ready' && (
          page === 'agregar'
            ? <ProductForm key={route} scannedBarcode={scannedBarcode} onSave={saveProduct} />
            : editing
              ? page === 'precio'
                ? <PriceEditor key={editing.id} product={editing} onSave={savePrice} />
                : <ProductForm key={editing.id} product={editing} onSave={saveProduct} />
              : <p className="empty" role="status">No encontramos ese producto.</p>
        )}
        {deleteTarget && isAdmin && <DeleteProductDialog key={deleteTarget.id} product={deleteTarget} onCancel={() => setDeleteTarget(undefined)} onConfirm={deleteProduct} />}
        {(!formPage || (isAdmin && !adminPage)) && state.kind === 'loading' && <p className="empty" role="status">Cargando catálogo…</p>}
        {!formPage && state.kind === 'configuration' && <p className="empty" role="status">{state.message}</p>}
        {(!formPage || (isAdmin && !adminPage)) && state.kind === 'error' && (
          <div className="empty">
            <p role="alert">No pudimos cargar el catálogo. Revisá la conexión y reintentá.</p>
            <button className="button secondary catalog-retry" type="button" onClick={retry}>Reintentar</button>
          </div>
        )}
        {detailPage && state.kind === 'ready' && (
          detail
            ? <div className="product-detail"><ScanResult product={detail} readOnly={!isAdmin} /></div>
            : <p className="empty" role="status">No encontramos ese producto.</p>
        )}
        {state.kind === 'ready' && (
          <div hidden={formPage || detailPage}>
            <div className={'workspace ' + (scanning ? 'workspace--scan' : 'workspace--catalog')}>
              <aside className="scanner-column" aria-label="Escáner de productos">
                <h2 className="scanner-heading">Escaneá y listo.</h2>
                <Scanner key={scanning ? 'scan' : 'idle'} enabled={scanning} canAddProduct={isAdmin} onLookup={findBarcode}>
                  {scanned && <ScanResult product={scanned} readOnly />}
                </Scanner>
                {!scanning && selected && (
                  <div className="desktop-result"><ScanResult product={selected} readOnly={!isAdmin} /></div>
                )}
              </aside>
              <Catalog products={products} selectedId={selected?.id} onSelect={setSelectedId} onDelete={isAdmin ? setDeleteTarget : undefined} />
            </div>
          </div>
        )}
      </main>
      {!formPage && navigation(tabs, 'mobile-nav')}
    </div>
  )
}
