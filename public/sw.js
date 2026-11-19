self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return

  // Keep navigations fresh. Supabase requests and static assets use the browser's normal network path.
  event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(() => new Response(
    '<!doctype html><html lang="es-AR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mi Kiosco</title><main><h1>Sin conexión</h1><p>Volvé a conectarte para consultar el catálogo.</p><a href="/">Reintentar</a></main></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )))
})
