// Paso 2 del flujo manual/agente: crea la compra en Holded con los importes
// REALES (leidos del PDF por una persona o por el propio agente) y adjunta el PDF.
// Uso:
//   node scripts/create-purchase.js '<json>' ruta/al/archivo.pdf nombre-adjunto.pdf
// json = { contactId, date: "YYYY-MM-DD", documentNumber, notes,
//          lineItems: [{ name, units, price, taxRate? }] }
import fs from "fs";
import { createDraftPurchaseInvoice, attachFileToDocument } from "../src/holdedClient.js";

const [json, pdfPath, attachmentName] = process.argv.slice(2);
const params = JSON.parse(json);

const purchase = await createDraftPurchaseInvoice(params);
console.log("Factura creada:", purchase.id, "total:", purchase.total);

if (pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  await attachFileToDocument(purchase.id, attachmentName || pdfPath.split(/[\\/]/).pop(), buffer);
  console.log("Adjunto OK");
}
