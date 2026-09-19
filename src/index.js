import { config } from "./config.js";
import { createImapClient, fetchPendingInvoiceEmails } from "./imapClient.js";

// Este script SOLO lista los correos con factura pendientes de subir.
// La creacion en Holded requiere leer el importe real de cada PDF (ver README),
// asi que no se automatiza aqui de forma ciega: usa este listado como punto de
// partida y procesa cada uno con holdedClient.createDraftPurchaseInvoice pasando
// los importes reales.
async function run() {
  const client = createImapClient();
  await client.connect();
  console.log(`Conectado a ${config.imap.host} como ${config.imap.user}`);

  try {
    const emails = await fetchPendingInvoiceEmails(client);
    console.log(`\n${emails.length} correo(s) con PDF pendientes de revisar:\n`);
    for (const email of emails) {
      console.log(`- uid ${email.uid} | ${email.fromEmail} | "${email.subject}" | ${email.attachments.length} PDF(s)`);
    }
  } finally {
    await client.logout();
  }
}

run().catch((err) => {
  console.error("Fallo general:", err);
  process.exit(1);
});
