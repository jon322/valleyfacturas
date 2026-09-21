# Guía de replicación: automatización de facturas → Holded

Esta guía documenta cómo montar este mismo sistema para **otro correo /
otra empresa**, partiendo de cero. Está basada en lo que realmente costó
descubrir la primera vez — sigue el orden, hay dependencias entre pasos.

Idea general: se leen facturas de proveedor desde 3 orígenes (correo IMAP,
fotos en un canal de Discord, portal web de un operador tipo Yoigo), se leen
**de verdad** (importe, IVA, número, proveedor) y se suben a Holded como
borrador. Nada se sube a 0€ ni se inventa.

---

## 1. Proyecto base

```
git clone <este-repo-o-una-copia> nombre-proyecto
cd nombre-proyecto
npm install
cp .env.example .env
```

## 2. Correo (IMAP)

Necesitas: host IMAP, puerto (normalmente 993), email, contraseña.

- Si el hosting es tipo cPanel (Banahost y similares), el host suele ser
  `mail.tudominio.com` con puerto 993 y SSL. Verifícalo en el panel de
  hosting (sección de cuentas de correo) — no lo asumas a ciegas.
- Rellena `BANAHOST_IMAP_HOST/PORT/EMAIL/PASSWORD` en `.env` (o renombra las
  variables si quieres, están todas en `src/config.js`).

## 3. Holded

### 3.1 Generar el API Token

1. Holded → icono de cuenta → **Configuración**
2. Desplegable superior "Configuración" → **Desarrolladores** → **Credenciales**
   (nota: hay un sistema antiguo "API Keys v1" obsoleto — usa el nuevo
   "API Tokens", botón **Agregar API Token**)
3. Descripción: algo identificable (ej. "Automatizacion facturas").
4. Permisos → **Por áreas** (no "Global", es más seguro dar solo lo necesario):
   - Expande **Contabilidad** → recurso **Compras** → **Full**
   - Expande **Contactos** → recurso **Contactos** → **Full**
   (si vas a leer el escáner nativo de Holded en vez de por email/Discord,
   añade también **Bandeja de entrada** → Full)
5. Crear Token → **cópialo ya** (solo se muestra una vez) →
   `HOLDED_API_KEY` en `.env`. Formato `pat_...`, autenticación `Bearer`.

⚠️ **Si la cuenta de Holded tiene un problema de cobro de suscripción**
(banner rojo arriba), la API acepta las peticiones de escritura con éxito
(devuelve un id) pero **no persiste nada** — ni se puede leer después, ni
aparece en la interfaz. No es un bug tuyo: hay que regularizar el pago
primero y solo entonces todo empieza a funcionar de verdad.

### 3.2 Cuenta contable e IVA por defecto

Necesitas el id de una cuenta de gastos real de tu plan de cuentas. Forma
más rápida: mira el campo `account` de cualquier compra ya existente
(`GET /api/v2/purchases`, con el token puesto) y reutiliza ese id en
`HOLDED_DEFAULT_ACCOUNT_ID`. `HOLDED_DEFAULT_TAX` suele ser `p_iva_21`
(21% general) — usa el código de IVA que corresponda por línea
(`p_iva_10` hostelería, etc., ver `taxRate` en `createDraftPurchaseInvoice`).

### 3.3 Cosas que sorprenden de la API v2 (`api.holded.com/api/v2`)

- Los campos van en **snake_case** (`contact_id`, `document_number`), no
  camelCase.
- `date` va en formato `YYYY-MM-DD`, NO timestamp unix.
- Crear un recurso (contacto o compra) es **asíncrono**: el `POST` responde
  200/201 con un `id` casi al instante, pero un `GET` a ese mismo id puede
  dar 404 durante uno o dos segundos. Hay que esperar (`waitUntilReadable`
  en `src/holdedClient.js`) antes de usar ese id en el siguiente paso (ej.
  crear una compra que referencia un contacto recién creado).
- `document_number` (el número de factura del proveedor) solo se puede fijar
  de forma fiable **una vez el documento está aprobado** en Holded (no en
  borrador). Si lo intentas mientras es borrador, el `PUT` responde éxito
  pero lo descarta en silencio. Fíjalo después de aprobar, con
  `scripts/set-document-number.js`.
- Buscar contacto por email exacto SÍ funciona (`GET /contacts?email=...`),
  pero el email del remitente de una factura casi nunca coincide con el
  email registrado del contacto (ej. factura viene de `cliente@proveedor.com`
  pero el contacto real tiene `proveedor@proveedor.com`). Vas a acabar con
  contactos duplicados con el tiempo — es esperable, se fusionan a mano de
  vez en cuando. `search`/`q` como parámetros de texto libre en `/contacts`
  **no filtran de verdad** (devuelven resultados genéricos), no confíes en
  ellos para encontrar un proveedor por nombre.
- Una factura creada con importe 0€ se marca sola como **"Pagado"** en
  Holded (no hay nada pendiente de cobrar) — muy engañoso. Por eso
  `createDraftPurchaseInvoice` **exige** `lineItems` con importes reales y
  falla si no se los pasas.

## 4. Discord (opcional — solo si quieres subir fotos de tickets)

1. https://discord.com/developers/applications → **New Application**.
2. Pestaña **Bot** → copia el token → `DISCORD_BOT_TOKEN` en `.env`.
3. En la misma pestaña Bot, baja a **Privileged Gateway Intents** y activa
   **MESSAGE CONTENT INTENT**. Sin esto, la API devuelve los mensajes pero
   con `content`, `attachments` y `embeds` **vacíos** aunque el mensaje
   tenga una foto de verdad — parece que no hay nada y sí lo hay.
4. Pestaña **OAuth2 → URL Generator**: scope `bot`, permisos mínimos
   **View Channel** + **Read Message History** (+ **Add Reactions** si
   quieres que marque mensajes como procesados, que es lo que hace este
   proyecto). Copia la URL generada.
5. El dueño del servidor de Discord abre esa URL **en su propio navegador
   con sesión iniciada** y añade el bot al servidor — esto no se puede
   automatizar por API, requiere autorización humana en el navegador.
6. `node scripts/discord-check.js` para confirmar que el bot ve el
   servidor, luego `node scripts/discord-list-channels.js` (o similar) para
   sacar el id del canal → `DISCORD_INVOICE_CHANNEL_ID`.

## 5. Portal web de un operador (tipo Yoigo) — opcional

Si hay que revisar mensualmente un portal de cliente (telefonía, hosting,
etc.) para descargar facturas:

- **Verifica el dominio real antes de meter credenciales en ningún sitio.**
  Dominios "cortos"/sin subdominio de marca a veces están caducados o
  secuestrados y redirigen a publicidad/tracking (nos pasó con
  `miyoigo.com`, que no es de Yoigo — el real es `miyoigo.yoigo.com`).
  Entra siempre desde la web oficial de la marca y sigue el enlace de
  "acceso a clientes" desde ahí, no adivines la URL.
- Las descargas de factura muchas veces se abren como `blob:` URL en una
  pestaña nueva en vez de guardarse directamente a disco. Para capturarlas:
  `fetch(location.href)` dentro de esa pestaña → `arrayBuffer` → base64 →
  decodificar a fichero (ver el patrón en el historial de este proyecto).

## 6. Repo + rutinas programadas en la nube (opcional, para que corra solo)

Solo tiene sentido si aceptas que las credenciales queden guardadas en la
configuración de la rutina (en la nube de Anthropic) y que el código viva en
un repo (privado) que esas rutinas puedan clonar.

1. Sube el proyecto a un repo de GitHub (privado).
2. En claude.ai: conecta GitHub en **claude.ai/customize/connectors** (si no
   lo haces antes, crear la rutina falla con "Connect your GitHub account").
3. Usa el skill `schedule` (o `RemoteTrigger` directamente) para crear una
   rutina en la nube con:
   - `sources`: tu repo de GitHub
   - Un prompt **autocontenido** que incluya: crear el `.env` con las
     credenciales reales, instrucción de leer el `README.md` del repo,
     y la instrucción explícita de **nunca inventar importes** — si no
     puede leer el documento con confianza, que lo deje sin procesar y lo
     reporte, no que adivine.
   - Cron en UTC (convierte desde tu zona horaria local).

## Resumen del flujo operativo (una vez montado)

1. `node scripts/prepare-invoice.js <uid...>` (correo) o
   `node scripts/discord-prepare.js` (Discord) → descarga el documento y
   resuelve/crea el contacto.
2. Se **lee** el documento (persona o agente con capacidad de leer
   PDF/imagen) para sacar importe neto, IVA, número de factura, fecha.
3. `node scripts/create-purchase.js '<json>' <ruta> <nombreAdjunto>` → crea
   el borrador en Holded y adjunta el archivo.
4. `node scripts/mark-email-processed.js <uid>` o
   `node scripts/discord-mark-processed.js <messageId>` → evita duplicados
   en la siguiente pasada.
