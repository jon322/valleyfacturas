import axios from "axios";
import FormData from "form-data";
import { config } from "./config.js";

// API v2, autenticacion Bearer con API Token (formato "pat_...").
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: {
    Authorization: `Bearer ${config.holded.apiKey}`,
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Holded indexa contactos/compras de forma asincrona: justo despues de crear
// un recurso, un GET puede devolver 404 durante uno o dos segundos. Esperamos
// aqui a que el recurso sea consultable antes de usarlo en el siguiente paso
// (p.ej. crear una compra que referencia un contacto recien creado).
async function waitUntilReadable(path, { attempts = 10, delayMs = 1000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await holded.get(path);
      return data;
    } catch (err) {
      if (err.response?.status !== 404 || i === attempts - 1) throw err;
      await sleep(delayMs);
    }
  }
}

export async function findContactByEmail(email) {
  const { data } = await holded.get("/contacts", { params: { email } });
  return data.items?.[0] || null;
}

export async function createSupplierContact(email, name) {
  const { data } = await holded.post("/contacts", {
    name: name || email,
    email,
    type: "supplier",
  });
  return waitUntilReadable(`/contacts/${data.id}`);
}

export async function findOrCreateSupplierContact(email, name) {
  const existing = await findContactByEmail(email);
  if (existing) return existing;
  return createSupplierContact(email, name);
}

// Crea una factura de proveedor (compra) como borrador para revisar en Holded.
export async function createDraftPurchaseInvoice({ subject, fromEmail, contactId, date }) {
  const { data } = await holded.post("/purchases", {
    contact_id: contactId,
    date: (date || new Date()).toISOString().slice(0, 10),
    notes: `Importado automaticamente desde correo de ${fromEmail}. Asunto: ${subject}`,
    items: [
      {
        name: subject || "Factura recibida por email",
        desc: `Remitente: ${fromEmail}`,
        units: 1,
        price: 0,
        tax: 0,
        taxes: [config.holded.defaultTax],
        account: config.holded.defaultAccountId,
      },
    ],
  });
  return waitUntilReadable(`/purchases/${data.id}`);
}

export async function attachFileToDocument(documentId, filename, buffer) {
  const form = new FormData();
  form.append("file", buffer, filename);
  const { data } = await holded.post(
    `/purchases/${documentId}/attachments`,
    form,
    { headers: form.getHeaders() }
  );
  return data;
}
