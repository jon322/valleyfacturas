import { createImapClient } from "../src/imapClient.js";
import { simpleParser } from "mailparser";
import { config } from "../src/config.js";
import fs from "fs";

const uids = [39, 49, 56, 65];
const client = createImapClient();
await client.connect();
const lock = await client.getMailboxLock(config.imap.sourceFolder);
try {
  for await (const message of client.fetch(uids, { envelope: true, source: true }, { uid: true })) {
    const parsed = await simpleParser(message.source);
    const pdf = parsed.attachments.find(a => a.contentType === "application/pdf");
    const outPath = `tmp-pdfs/uid${message.uid}_${pdf.filename}`;
    fs.writeFileSync(outPath, pdf.content);
    console.log("Guardado:", outPath);
  }
} finally {
  lock.release();
}
await client.logout();
