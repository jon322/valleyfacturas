import { createImapClient } from "../src/imapClient.js";
import { simpleParser } from "mailparser";
import { config } from "../src/config.js";

const client = createImapClient();
await client.connect();
console.log("Conectado a", config.imap.host);

const lock = await client.getMailboxLock(config.imap.sourceFolder);
const results = [];
try {
  for await (const message of client.fetch({ all: true }, { envelope: true, source: true })) {
    const parsed = await simpleParser(message.source);
    const pdfs = parsed.attachments.filter(a => a.contentType === "application/pdf");
    if (pdfs.length > 0) {
      results.push({
        uid: message.uid,
        from: parsed.from?.text,
        subject: parsed.subject,
        date: parsed.date,
        pdfCount: pdfs.length,
        pdfNames: pdfs.map(p => p.filename),
      });
    }
  }
} finally {
  lock.release();
}

console.log(`Encontrados ${results.length} correos con PDF.`);
console.log(JSON.stringify(results.slice(-15), null, 2));
await client.logout();
