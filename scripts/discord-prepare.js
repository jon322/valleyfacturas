// Descarga las imagenes de mensajes del canal de facturas aun no marcados como
// procesados, y resuelve/crea el contacto proveedor a partir del texto del
// mensaje si se puede inferir (si no, usa "Desconocido" y se corrige luego).
// Uso: node scripts/discord-prepare.js
import fs from "fs";
import { fetchUnprocessedInvoiceImageMessages, downloadAttachment } from "../src/discordClient.js";
import { config } from "../src/config.js";

fs.mkdirSync(config.outputDir, { recursive: true });

const messages = await fetchUnprocessedInvoiceImageMessages();
console.log(`${messages.length} mensaje(s) sin procesar.`);

for (const m of messages) {
  const paths = [];
  for (const img of m.images) {
    const buffer = await downloadAttachment(img.url);
    const outPath = `${config.outputDir}/discord_${m.id}_${img.filename}`;
    fs.writeFileSync(outPath, buffer);
    paths.push(outPath);
  }
  console.log(JSON.stringify({ messageId: m.id, author: m.author, timestamp: m.timestamp, images: paths }));
}
