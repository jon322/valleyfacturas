import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { config } from "./config.js";

export function createImapClient() {
  return new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: true,
    auth: {
      user: config.imap.user,
      pass: config.imap.pass,
    },
    logger: false,
  });
}

async function ensureFolder(client, path) {
  const exists = await client.mailboxExists(path);
  if (!exists) {
    await client.mailboxCreate(path);
  }
}

// Devuelve los correos no leidos con adjuntos PDF que cumplen el filtro de remitente.
export async function fetchPendingInvoiceEmails(client) {
  const lock = await client.getMailboxLock(config.imap.sourceFolder);
  const results = [];
  try {
    for await (const message of client.fetch(
      { seen: false },
      { envelope: true, source: true }
    )) {
      const fromEmail = (message.envelope.from?.[0]?.address || "").toLowerCase();

      if (
        config.allowedSenders.length > 0 &&
        !config.allowedSenders.includes(fromEmail)
      ) {
        continue;
      }

      const parsed = await simpleParser(message.source);
      const pdfAttachments = parsed.attachments.filter(
        (a) => a.contentType === "application/pdf"
      );

      if (pdfAttachments.length === 0) continue;

      results.push({
        uid: message.uid,
        fromEmail,
        subject: parsed.subject || "(sin asunto)",
        date: parsed.date,
        attachments: pdfAttachments,
      });
    }
  } finally {
    lock.release();
  }
  return results;
}

export async function moveMessage(client, uid, folder) {
  await ensureFolder(client, folder);
  await client.messageMove(uid, folder, { uid: true });
}
