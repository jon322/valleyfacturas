// Paso 1 del flujo manual/agente: descarga los PDF de los correos indicados y
// resuelve/crea el contacto proveedor en Holded. NO crea nada en Holded todavia.
// Uso: node scripts/prepare-invoice.js <uid1> <uid2> ...
// Luego: lee cada PDF guardado en tmp-pdfs/ y usa scripts/create-purchase.js
// con los importes reales.
import fs from "fs";
import { createImapClient } from "../src/imapClient.js";
import { simpleParser } from "mailparser";
import { config } from "../src/config.js";
import { findOrCreateSupplierContact } from "../src/holdedClient.js";

const uids = process.argv.slice(2).map(Number);
fs.mkdirSync("tmp-pdfs", { recursive: true });

const client = createImapClient();
await client.connect();
const lock = await client.getMailboxLock(config.imap.sourceFolder);
const messages = [];
try {
  for await (const message of client.fetch(uids, { envelope: true, source: true }, { uid: true })) {
    messages.push(await simpleParser(message.source));
  }
} finally {
  lock.release();
}
await client.logout();

for (const parsed of messages) {
  const fromEmail = parsed.from.value[0].address;
  const fromName = parsed.from.value[0].name;
  const pdf = parsed.attachments.find((a) => a.contentType === "application/pdf");
  if (!pdf) {
    console.log(`(sin PDF) ${parsed.subject}`);
    continue;
  }
  const outPath = `tmp-pdfs/${parsed.subject.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.pdf`;
  fs.writeFileSync(outPath, pdf.content);

  const contact = await findOrCreateSupplierContact(fromEmail, fromName);

  console.log(JSON.stringify({
    subject: parsed.subject,
    fromEmail,
    date: parsed.date,
    contactId: contact.id,
    contactName: contact.name,
    pdfPath: outPath,
  }));
}
