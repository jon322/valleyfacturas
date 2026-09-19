import axios from "axios";
import { config } from "./config.js";

const discord = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: `Bot ${config.discord.botToken}` },
});

// Devuelve los mensajes del canal de facturas que tienen imagenes adjuntas.
export async function fetchInvoiceImageMessages({ after } = {}) {
  const { data } = await discord.get(`/channels/${config.discord.invoiceChannelId}/messages`, {
    params: { limit: 100, after },
  });
  return data
    .filter((m) => m.attachments.some((a) => a.content_type?.startsWith("image/")))
    .map((m) => ({
      id: m.id,
      author: m.author.username,
      timestamp: m.timestamp,
      images: m.attachments.filter((a) => a.content_type?.startsWith("image/")),
    }));
}

export async function downloadAttachment(url) {
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(data);
}
