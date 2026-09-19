import { config } from "./config.js";
import { createImapClient, fetchPendingInvoiceEmails, moveMessage } from "./imapClient.js";
import {
  createDraftPurchaseInvoice,
  attachFileToDocument,
  findOrCreateSupplierContact,
} from "./holdedClient.js";

async function run() {
  const client = createImapClient();
  await client.connect();
  console.log(`Conectado a ${config.imap.host} como ${config.imap.user}`);

  try {
    const emails = await fetchPendingInvoiceEmails(client);
    console.log(`Encontrados ${emails.length} correo(s) con PDF pendientes de subir.`);

    for (const email of emails) {
      console.log(`\nProcesando: "${email.subject}" de ${email.fromEmail}`);
      try {
        const contact = await findOrCreateSupplierContact(email.fromEmail);
        const invoice = await createDraftPurchaseInvoice({ ...email, contactId: contact.id });
        const invoiceId = invoice.id;

        for (const attachment of email.attachments) {
          await attachFileToDocument(invoiceId, attachment.filename, attachment.content);
          console.log(`  Adjunto subido: ${attachment.filename}`);
        }

        await moveMessage(client, email.uid, config.imap.processedFolder);
        console.log(`  OK -> factura ${invoiceId} creada en Holded.`);
      } catch (err) {
        console.error(`  ERROR procesando este correo: ${err.message}`);
        await moveMessage(client, email.uid, config.imap.errorFolder);
      }
    }
  } finally {
    await client.logout();
  }
}

run().catch((err) => {
  console.error("Fallo general:", err);
  process.exit(1);
});
