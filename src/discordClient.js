import axios from "axios";
import { config } from "./config.js";

const discord = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: `Bot ${config.discord.botToken}` },
});

const PROCESSED_EMOJI = "%E2%9C%85"; // ✅

function isInvoiceFile(a) {
  return a.content_type?.startsWith("image/") || a.content_type === "application/pdf";
}

// Devuelve los mensajes del canal de facturas que tienen imagenes o PDFs
// adjuntos y que todavia no llevan la reaccion de "procesado".
export async function fetchUnprocessedInvoiceImageMessages({ after } = {}) {
  const { data } = await discord.get(`/channels/${config.discord.invoiceChannelId}/messages`, {
    params: { limit: 100, after },
  });
  return data
    .filter((m) => m.attachments.some(isInvoiceFile))
    .filter((m) => !m.reactions?.some((r) => r.emoji.name === "✅" && r.me))
    .map((m) => ({
      id: m.id,
      author: m.author.username,
      timestamp: m.timestamp,
      images: m.attachments.filter(isInvoiceFile),
    }));
}

export async function markMessageProcessed(messageId) {
  await discord.put(
    `/channels/${config.discord.invoiceChannelId}/messages/${messageId}/reactions/${PROCESSED_EMOJI}/@me`
  );
}

export async function downloadAttachment(url) {
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(data);
}
