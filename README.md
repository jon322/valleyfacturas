# Automatizacion de facturas de proveedor — Valley Tech Projects

Sube facturas de proveedor a Holded (como borrador pendiente de pago) desde
tres origenes: correo de Banahost, fotos en un canal de Discord, y facturas
de Yoigo en MiYoigo. Requiere `npm install` y un `.env` (ver `.env.example`).

## Principio clave: NUNCA crear una factura a 0€

Holded no hace OCR fiable via API. Todo importe (subtotal, IVA, numero de
documento) tiene que salir de **leer el PDF/foto real** — con el lector de
PDF/imagen del agente que ejecuta esto, no inventado ni puesto a 0. Una
factura a 0€ se marca sola como "Pagado" en Holded, lo cual es enganoso.

## Flujo para correo (Banahost)

1. `node scripts/prepare-invoice.js <uid1> <uid2> ...` — uids se obtienen
   listando lo pendiente (`node src/index.js`). Descarga cada PDF a
   `tmp-pdfs/` y resuelve/crea el contacto proveedor en Holded por email.
   Imprime un JSON por correo con `contactId`, `pdfPath`, etc.
2. Lee cada PDF de `tmp-pdfs/` y extrae: importe neto por linea (sin IVA),
   tipo de IVA, numero de factura del proveedor, fecha.
3. `node scripts/create-purchase.js '<json>' <pdfPath> <nombreAdjunto>` con
   `json = { contactId, date, documentNumber, notes, lineItems: [{name, units, price, taxRate}] }`.
   `price` = importe NETO (sin IVA) de esa linea.
4. `node scripts/mark-email-processed.js <uid>` (o `<uid> error` si fallo)
   para mover el correo y no reprocesarlo.

## Flujo para Discord

1. `node scripts/discord-prepare.js` — descarga imagenes de mensajes sin la
   reaccion ✅ en el canal configurado (`DISCORD_INVOICE_CHANNEL_ID`).
2. Lee cada imagen, identifica proveedor/importe/IVA/numero de factura.
   Para el contacto: `searchContactsByName` (en `src/holdedClient.js`) antes
   de crear uno nuevo, para no duplicar proveedores que ya existen con otro
   email registrado (ej. Ballenoil llega de `cliente@` pero el contacto real
   es `ballenoil@`).
3. `node scripts/create-purchase.js '<json>' <imagePath> <nombreAdjunto>`.
4. `node scripts/discord-mark-processed.js <messageId>`.

## Flujo para Yoigo (mensual)

1. Login en `https://miyoigo.yoigo.com/login` (NO usar `miyoigo.com`, ese
   dominio no es de Yoigo — redirige a un sitio de publicidad/tracking).
   Credenciales en `.env` (`YOIGO_EMAIL`, `YOIGO_PASSWORD`).
2. Ir a Facturas, comparar con la ultima factura de Yoigo ya en Holded
   (`node scripts/list-holded-purchases-by-contact.js <contactId>` si existe,
   o buscar contacto "XFERA MOVILES" / "Yoigo").
3. Descargar cada factura que falte, leerla (base imponible, IVA, total,
   numero de factura), y seguir el mismo paso 3-4 que en el flujo de correo.

## Numero de documento (`document_number`)

Solo se puede fijar de forma fiable **despues** de que la factura este
aprobada/confirmada en Holded (no en estado borrador) — si se intenta antes,
la API devuelve éxito pero lo descarta en silencio. `createDraftPurchaseInvoice`
lo intenta igualmente al crear; si no cuaja, usar
`node scripts/set-document-number.js <purchaseId> "<numero>"` mas tarde.

## Variables de entorno

Ver `.env.example`. Nunca commitear `.env` real.
