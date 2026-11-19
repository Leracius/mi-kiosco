# Mi Kiosco

Aplicación web para consultar precios de productos en un kiosco. Está desarrollada con React, Vite y TypeScript. El [mockup de Figma](https://www.figma.com/design/iwsSx3XchUbCuJBBrCzjOZ/mi-kiosco?t=SUvk3d5J9JQxl2tO-0) es la referencia visual principal.

## Ejecutar el proyecto

Usá Node.js 22.12 o posterior dentro de la rama 22 y ejecutá estos comandos desde la carpeta del proyecto.

```bash
npm ci
npm run dev
```

Abrí [Mi Kiosco en localhost](http://localhost:5173/#productos).

| Comando | Qué verifica o ejecuta |
| --- | --- |
| `npm test` | Pruebas de búsqueda, formato de precios y escaneo con el ejecutor de Node.js. |
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

En **Productos**, escribí `GUAYMALLEN` para encontrar **Alfajor Guaymallén**. Buscá `COCA` y seleccioná **Coca-Cola Original** para ver el precio de ejemplo de **$ 1.500** y su código de barras. Volvé a la búsqueda y comprobá que el campo sigue mostrando `COCA`.

## Fase 3 — Escáner de códigos de barras

- Cámara en vivo con permiso explícito, preferencia por la trasera y lectura de EAN-13, EAN-8 y UPC-A mediante ZXing.
- Consulta local por coincidencia exacta, con equivalencia entre UPC-A y su representación EAN-13 con un cero inicial.
- La cámara se apaga al leer un código, detener el escaneo, salir de la vista u ocultar la página. El escáner ofrece reintento y entrada manual cuando falla o no encuentra el producto.
- Pruebas automatizadas de consulta, códigos equivalentes y cierre único por sesión. Probado en Edge con video sintético para los tres formatos. La validación con una cámara física está pendiente.

### Probar desde un celular

1. Serví la app desde una URL HTTPS con un certificado válido y abrila directamente en el navegador del celular. El acceso por IP local con HTTP no habilita la cámara. En una computadora se puede probar en `http://localhost:5173`.
2. Entrá en **Escanear → Escanear producto**, permití el uso de la cámara y alineá el código. Para etiquetas de prueba, usá EAN-13 `7790895000997`, EAN-8 `96385074` y UPC-A `036000291452`. Son códigos del catálogo simulado.
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

## Organización del código

- [`src/App.tsx`](src/App.tsx) coordina la navegación y el estado compartido.
- [`src/catalog/`](src/catalog/) reúne la interfaz del catálogo, su modelo, los datos simulados, la búsqueda y el formato de precios. Los importes se guardan como enteros en centavos de ARS y los códigos como texto para conservar ceros iniciales.
- [src/scanner/](src/scanner/) contiene el visor, la lectura y el ciclo de vida de la cámara.
- [src/KioskPanels.tsx](src/KioskPanels.tsx) contiene la tarjeta de resultado y los formularios.
- [`tests/`](tests/) contiene las pruebas automatizadas.

## Estado actual

El catálogo y sus precios son de demostración. Las altas y modificaciones se pierden al recargar. La validación física del escáner, la persistencia, la autenticación y el modo offline quedan pendientes. El mockup revisado no incluye una sección de productos frecuentes.
