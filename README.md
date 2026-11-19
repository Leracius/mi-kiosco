# Mi Kiosco

Aplicación web para consultar precios de productos en un kiosco. Está desarrollada con React, Vite y TypeScript. El [mockup de Figma](https://www.figma.com/design/iwsSx3XchUbCuJBBrCzjOZ/mi-kiosco?t=SUvk3d5J9JQxl2tO-0) es la referencia visual principal.

**Producción** · [Abrir Mi Kiosco](https://mi-kiosco-nine.vercel.app/)

## Ejecutar el proyecto

Usá Node.js 22.12 o posterior dentro de la rama 22 y ejecutá estos comandos desde la carpeta del proyecto.

```bash
npm ci
npm run dev
```

Abrí [Mi Kiosco en localhost](http://localhost:5173/#productos).

| Comando | Qué verifica o ejecuta |
| --- | --- |
| `npm test` | Pruebas de catálogo, búsqueda, precios, códigos y operaciones de administración con el ejecutor de Node.js. |
| `npm run lint` | Análisis estático con Oxlint. |
| `npm run build` | Verificación de tipos con TypeScript y compilación de producción con Vite. |
| `npm run preview` | Vista previa local de la última compilación. |

## Fase 1 — Interfaz y navegación

- Cuatro pantallas móviles basadas en Figma: escaneo, catálogo, alta de producto y modificación de precio.
- Vista de escritorio que combina el catálogo, el visor de escaneo y el editor de precio.
- Navegación por enlaces con fragmentos de URL, compatibilidad con Atrás y Adelante del navegador y foco en el título al cambiar de pantalla.
- Visor y linterna simulados, entrada manual de código y formularios de demostración con cambios en memoria.

## Fase 2 — Catálogo y búsqueda

- Catálogo simulado de 20 productos con ID, nombre y precio. El código de barras, la categoría y la presentación son opcionales.
- Búsqueda mientras escribís, por nombre completo, coincidencia parcial o código de barras. Las mayúsculas y las tildes se normalizan al comparar. Si no hay coincidencias, el catálogo muestra un mensaje.
- Filtros por categoría y consulta de productos desde el listado móvil o la tabla de escritorio.
- Ficha de consulta que reutiliza la tarjeta «Producto encontrado». Muestra el nombre, el precio en ARS y el código de barras cuando existe. **Volver a la búsqueda** conserva la consulta y los filtros.
- Pruebas automatizadas para coincidencias exactas y parciales, normalización, búsquedas vacías o sin resultados, códigos y formato de importes.

### Probar la consulta

En **Productos**, buscá parte del nombre de un artículo registrado y abrí su ficha. Volvé a la búsqueda y comprobá que se conserva el texto ingresado. En un entorno de prueba con el seed cargado, podés buscar `GUAYMALLEN` para encontrar **Alfajor Guaymallén**.

## Fase 3 — Escáner de códigos de barras

- Cámara en vivo con permiso explícito, preferencia por la trasera y lectura de EAN-13, EAN-8 y UPC-A mediante ZXing.
- Consulta local por coincidencia exacta, con equivalencia entre UPC-A y su representación EAN-13 con un cero inicial.
- La cámara se apaga al leer un código, detener el escaneo, salir de la vista u ocultar la página. El escáner ofrece reintento y entrada manual cuando falla o no encuentra el producto.
- Pruebas automatizadas de consulta, códigos equivalentes y cierre único por sesión. Probado en Edge con video sintético para los tres formatos. La validación con una cámara física está pendiente.

### Probar desde un celular

1. Serví la app desde una URL HTTPS con un certificado válido y abrila directamente en el navegador del celular. El acceso por IP local con HTTP no habilita la cámara. En una computadora se puede probar en `http://localhost:5173`.
2. Entrá en **Escanear → Escanear producto**, permití el uso de la cámara y alineá el código. Para verificar una coincidencia, usá el código de un producto cargado en el catálogo que estés probando. Con el seed local, podés usar EAN-13 `7790895000997`, EAN-8 `96385074` y UPC-A `036000291452`.
3. Probá un código válido que no esté en el catálogo. Verificá el mensaje y las opciones para volver a escanear o buscar por nombre.
4. Volvé a iniciar el escaneo y cambiá de pantalla. Comprobá que se apague el indicador de cámara. Repetí la prueba denegando el permiso y usá la entrada manual.

### Probar con Dev Tunnels de VS Code

1. En VS Code, abrí **Puertos → Reenviar un puerto** y reenviá el puerto `5173` si todavía no está en la lista. Copiá la dirección reenviada HTTPS.
2. Si Vite muestra **Blocked request. This host is not allowed**, detené el proceso de Vite y reinicialo desde PowerShell con el nombre de host exacto de esa dirección. No incluyas `https://` ni la ruta.

   ```powershell
   $env:__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS = ([uri]'https://PEGÁ-ACÁ-TU-DIRECCIÓN').Host
   npm run dev -- --port 5173 --strictPort
   ```

3. Abrí la dirección HTTPS en Chrome o Safari del celular. Si el puerto es privado, iniciá sesión con la misma cuenta que usaste en VS Code. Entrá en **Escanear → Escanear producto** y permití el acceso a la cámara.

[Reenvío de puertos en VS Code](https://code.visualstudio.com/docs/debugtest/port-forwarding) · [Hosts permitidos en Vite](https://vite.dev/config/server-options#server-allowedhosts)

## Fase 4 — Persistencia con Supabase

La app carga el catálogo de PostgreSQL mediante la Data API de Supabase. La búsqueda y el escáner consultan los productos cargados durante la sesión y reutilizan sus reglas de coincidencia. La interfaz distingue carga, error de conexión y catálogo vacío. Recargá la página para traer cambios administrativos.

### Configuración

1. Elegí un proyecto de Supabase dedicado a Mi Kiosco y verificá que la Data API esté habilitada y que exponga el esquema `public`.
2. En un proyecto aprobado y sin una tabla `public.products` existente, aplicá la [migración](supabase/migrations/20261119004858_create_products.sql). La app necesita permiso de lectura para `anon` y `authenticated`. La migración habilita RLS, concede solo `SELECT` a esos roles y no define políticas de escritura.
3. Para una prueba, ejecutá [supabase/seed.sql](supabase/seed.sql) como administrador en el SQL Editor de Supabase. Contiene 20 productos y precios de ejemplo. Los códigos del seed se usan solo para probar sus asociaciones. Los IDs fijos y `ON CONFLICT DO NOTHING` permiten repetir la carga sin sobreescribir productos existentes. Reservá el seed para entornos de prueba. En producción, cargá los productos reales desde la administración de Mi Kiosco.
4. Copiá [`.env.example`](.env.example) a `.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` desde el panel del proyecto. El cliente admite una clave `sb_publishable_…`. Las variables `VITE_` se publican en el bundle, así que usá exclusivamente la clave publicable.
5. Reiniciá Vite. Para el deploy, agregá las mismas variables en el entorno correspondiente de Vercel y redeplegá.

La tabla guarda `price` como `numeric(12,2)` en ARS y la app lo adapta a centavos enteros al leerlo. Los códigos opcionales son texto. PostgreSQL impide duplicados entre UPC-A y su representación equivalente como EAN-13. `created_at` registra el alta y `updated_at` se actualiza con un trigger.

**Verificación remota.** Se verificaron la búsqueda, los códigos conocidos y los códigos inexistentes contra la Data API real. Los productos de ejemplo se retiraron de producción y el catálogo quedó vacío después de esa limpieza. El seed sigue disponible para pruebas locales. La clave publicable permite consultar y la API rechaza las escrituras anónimas.

## Fase 5 — Administración de productos

La administración usa Supabase Auth con correo y contraseña. Entrá en **Acceso admin**. Una cuenta necesita `app_metadata.kiosk_admin = true` para agregar, editar o eliminar. El permiso se asigna únicamente con una operación administrativa de confianza. Después de asignarlo o quitarlo, cerrá sesión y volvé a iniciarla para obtener un token actualizado.

El catálogo sigue siendo público. La migración aplicada habilita `INSERT`, `UPDATE` y `DELETE` para el rol autenticado, con políticas RLS que los limitan a la marca de administrador en el token. El rol anónimo conserva solo lectura. El frontend utiliza la clave publicable.

En el menú **⋯** de cada fila podés editar o eliminar. La eliminación muestra el nombre y exige confirmación. La lista se actualiza con el resultado de Supabase. Para probar en un entorno de desarrollo, creá un producto descartable, probá cancelar y recién entonces confirmá su eliminación.

La migración y la primera cuenta administradora están activas en producción. El registro público está deshabilitado y Supabase Auth usa el dominio HTTPS de la app como Site URL.

### Agregar un producto escaneando

1. Iniciá sesión desde **Acceso admin**.
2. Entrá en **Escanear → Escanear producto** y leé un código. Si el producto ya existe, vas a ver su ficha y el precio.
3. Si aparece **Producto no registrado**, tocá **Agregar producto**. El formulario abre con el código precargado y editable.
4. Completá el nombre y el precio, y tocá **Guardar producto**. El artículo aparece en el catálogo y se puede encontrar al volver a escanear ese código.

El alta desde un código desconocido está disponible solo para administradores. Los visitantes pueden consultar y escanear. También podés agregar un artículo manualmente desde **Agregar**.

### Campos en móviles

Los campos editables tienen un tamaño de texto mínimo de 16 px para evitar la ampliación automática al enfocarlos. El zoom manual del navegador sigue disponible. Se verificaron los tamaños en Edge con vista móvil y queda comprobar el comportamiento del foco en iOS y Android físicos.

### Instalar Mi Kiosco

- **Android o escritorio compatible.** Abrí la app por HTTPS y tocá **Instalar Mi Kiosco** cuando aparezca. También podés usar la opción de instalación del menú del navegador.
- **iPhone o iPad.** Abrí la URL en Safari. Tocá **Compartir → Agregar a pantalla de inicio**, activá **Abrir como app web** si aparece y tocá **Agregar**. El botón de instalación de la app muestra estos mismos pasos.
- **Prueba local.** Ejecutá `npm run build` y `npm run preview`. Abrí la URL local que indica Vite. El Service Worker se registra en la compilación de producción.

Los íconos y el modo de pantalla independiente se configuran en [el manifest](public/manifest.webmanifest). El Service Worker pide el HTML por red y activa las revisiones del propio worker cuando llegan. Para probar una versión recién publicada, recargá la app o cerrala y abrila otra vez. Si abrís la app sin conexión, vas a ver un aviso. El catálogo requiere conexión a Supabase.

### Checklist de primera entrega

- [x] Habilitar el acceso por correo, desactivar el registro público y configurar la primera cuenta administradora en Supabase Auth.
- [x] Configurar la **Site URL** de Auth con el dominio HTTPS de producción.
- [x] Aplicar la migración de administración y comprobar que la API remota rechaza las escrituras anónimas.
- [ ] Validar las escrituras administrativas en producción con un producto descartable. Los permisos de usuario común y el CRUD se probaron localmente.
- [x] Configurar las variables de Vercel y publicar la versión con administración, PWA y alta por escaneo.
- [ ] En Android y en iPhone, buscar por nombre, abrir una ficha y volver. Escanear un código registrado y otro ajeno al catálogo. Probar el permiso denegado, la entrada manual y el foco de los campos sin zoom automático.
- [ ] Instalar la app en el celular, abrirla desde el ícono y comprobar el modo standalone y la cámara. Verificar el aviso sin conexión y volver a abrir con red.
- [ ] En móvil y escritorio, entrar como administrador, crear y editar un producto descartable, cambiar su precio, cancelar una baja y verificar que el producto sigue visible. Confirmar la baja solo para ese producto. Cerrar sesión y comprobar que los controles de edición desaparecen.
- [ ] Tras un nuevo despliegue, recargar o reabrir la app instalada y comprobar que muestra la versión actual.

## Organización del código

- [`src/App.tsx`](src/App.tsx) coordina la navegación y el estado compartido.
- [`src/catalog/`](src/catalog/) reúne la interfaz del catálogo, su modelo, el acceso a Supabase, la búsqueda y el formato de precios. Los importes se guardan como enteros en centavos de ARS y los códigos como texto para conservar ceros iniciales.
- [src/scanner/](src/scanner/) contiene el visor, la lectura y el ciclo de vida de la cámara.
- [src/KioskPanels.tsx](src/KioskPanels.tsx) contiene la tarjeta de resultado y los formularios.
- [`tests/`](tests/) contiene las pruebas automatizadas.

## Estado actual

La consulta es pública y la administración requiere una cuenta autorizada. La administración y la PWA están disponibles en [producción](https://mi-kiosco-nine.vercel.app/). La sincronización offline del catálogo corresponde a una fase futura. El mockup revisado no incluye una sección de productos frecuentes.
