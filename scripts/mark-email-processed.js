// Mueve un correo (por uid) a la carpeta de procesados o de error tras intentar subirlo.
// Uso: node scripts/mark-email-processed.js <uid> [error]
import { createImapClient, moveMessage } from "../src/imapClient.js";
import { config } from "../src/config.js";

const uid = Number(process.argv[2]);
const isError = process.argv[3] === "error";

const client = createImapClient();
await client.connect();
try {
  await moveMessage(client, uid, isError ? config.imap.errorFolder : config.imap.processedFolder);
  console.log(`uid ${uid} movido a ${isError ? config.imap.errorFolder : config.imap.processedFolder}`);
} finally {
  await client.logout();
}
