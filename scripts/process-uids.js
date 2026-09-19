import { createImapClient, moveMessage } from "../src/imapClient.js";
import { simpleParser } from "mailparser";
import { config } from "../src/config.js";
import {
  findOrCreateSupplierContact,
  createDraftPurchaseInvoice,
  attachFileToDocument,
} from "../src/holdedClient.js";

const uids = process.argv.slice(2).map(Number);

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

for (const parsed of messages) {
  const fromEmail = parsed.from.value[0].address;
  const fromName = parsed.from.value[0].name;
  const pdf = parsed.attachments.find(a => a.contentType === "application/pdf");
  console.log(`\n--- ${parsed.subject} (${fromEmail}) ---`);
  try {
    const contact = await findOrCreateSupplierContact(fromEmail, fromName);
    console.log("Contacto:", contact.id, contact.name);
    const invoice = await createDraftPurchaseInvoice({
      subject: parsed.subject,
      fromEmail,
      contactId: contact.id,
      date: parsed.date,
    });
    console.log("Factura borrador:", invoice.id);
    await attachFileToDocument(invoice.id, pdf.filename, pdf.content);
    console.log("Adjunto OK:", pdf.filename);
  } catch (err) {
    console.error("ERROR:", err.response?.data?.detail || err.message);
  }
}

await client.logout();
