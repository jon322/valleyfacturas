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

export async function createSupplierContact(email, name, extra = {}) {
  const { data } = await holded.post("/contacts", {
    name: name || email,
    ...(email ? { email } : {}),
    type: "supplier",
    ...extra,
  });
  return waitUntilReadable(`/contacts/${data.id}`);
}

export async function findOrCreateSupplierContact(email, name) {
  const existing = await findContactByEmail(email);
  if (existing) return existing;
  return createSupplierContact(email, name);
}

// Para casos sin email (ej. foto subida a Discord): busca por nombre de texto libre.
// Devuelve TODAS las coincidencias para que quien llama elija la correcta
// (evita crear duplicados de proveedores que ya existen con otro email de contacto).
export async function searchContactsByName(text) {
  const { data } = await holded.get("/contacts", { params: { search: text, limit: 10 } });
  return data.items || [];
}

// Crea una factura de proveedor (compra) como borrador para revisar en Holded.
// IMPORTANTE: "lineItems" debe llevar los importes REALES leidos de la factura
// (subtotal/base imponible por linea), no un placeholder a 0. Holded no hace
// OCR fiable via API: quien llama a esta funcion (persona o agente) tiene que
// haber leido el documento antes de invocarla.
// lineItems: [{ name, units, price, taxRate? }]  price = importe neto (sin IVA) de la linea
export async function createDraftPurchaseInvoice({ contactId, date, notes, documentNumber, lineItems }) {
  if (!lineItems?.length) {
    throw new Error("createDraftPurchaseInvoice requiere lineItems con importes reales (no 0).");
  }
  const items = lineItems.map((it) => ({
    name: it.name,
    units: it.units ?? 1,
    price: it.price,
    tax: 0,
    taxes: [it.taxRate || config.holded.defaultTax],
    account: config.holded.defaultAccountId,
  }));

  const { data } = await holded.post("/purchases", {
    contact_id: contactId,
    date: typeof date === "string" ? date : (date || new Date()).toISOString().slice(0, 10),
    notes,
    items,
  });
  const purchase = await waitUntilReadable(`/purchases/${data.id}`);

  if (documentNumber) {
    // document_number solo se puede fijar de forma fiable una vez el documento
    // esta aprobado (no en borrador); si sigue en borrador este intento puede
    // no persistir y habra que repetirlo mas tarde con scripts/set-document-number.js.
    try {
      await holded.put(`/purchases/${data.id}`, { document_number: documentNumber });
    } catch {
      // no crítico: se puede fijar mas tarde
    }
  }

  return purchase;
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

export async function setDocumentNumber(purchaseId, documentNumber) {
  const { data } = await holded.put(`/purchases/${purchaseId}`, { document_number: documentNumber });
  return data;
}
