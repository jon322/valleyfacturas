// Lista todas las compras existentes en Holded para un contacto (util para
// comparar contra la lista de facturas de un proveedor y ver cuales faltan).
// Uso: node scripts/list-holded-purchases-by-contact.js <contactId>
import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const contactId = process.argv[2];
let cursor;
const all = [];
do {
  const { data } = await holded.get("/purchases", { params: { contact_id: contactId, cursor, limit: 50 } });
  all.push(...data.items);
  cursor = data.has_more ? data.cursor : null;
} while (cursor);
console.log(JSON.stringify(all.map(p => ({ id: p.id, document_number: p.document_number, date: p.date, total: p.total, description: p.description })), null, 2));
