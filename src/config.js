import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} en el archivo .env`);
  }
  return value;
}

export const config = {
  imap: {
    host: required("BANAHOST_IMAP_HOST"),
    port: Number(process.env.BANAHOST_IMAP_PORT || 993),
    user: required("BANAHOST_EMAIL"),
    pass: required("BANAHOST_PASSWORD"),
    sourceFolder: process.env.BANAHOST_SOURCE_FOLDER || "INBOX",
    processedFolder: process.env.BANAHOST_PROCESSED_FOLDER || "Facturas Subidas",
    errorFolder: process.env.BANAHOST_ERROR_FOLDER || "Facturas Error",
  },
  allowedSenders: (process.env.ALLOWED_SENDERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  holded: {
    apiKey: required("HOLDED_API_KEY"),
    defaultTax: process.env.HOLDED_DEFAULT_TAX || "p_iva_21",
    defaultAccountId: required("HOLDED_DEFAULT_ACCOUNT_ID"),
  },
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN,
    invoiceChannelId: process.env.DISCORD_INVOICE_CHANNEL_ID,
  },
};
